"""Unit tests for post_stats_utils pure helper functions."""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from app.routes.post_stats_utils import (
    count_model_calls,
    count_primary_labels,
    group_identifications_by_segment,
    is_mixed_segment,
    merge_time_windows,
    parse_refined_windows,
)

# ---------------------------------------------------------------------------
# count_model_calls
# ---------------------------------------------------------------------------


def _make_call(status: str | None, model_name: str | None) -> Any:
    return SimpleNamespace(status=status, model_name=model_name)


def test_count_model_calls_empty() -> None:
    statuses, models = count_model_calls([])
    assert statuses == {}
    assert models == {}


def test_count_model_calls_single() -> None:
    statuses, models = count_model_calls([_make_call("completed", "gpt-4o")])
    assert statuses == {"completed": 1}
    assert models == {"gpt-4o": 1}


def test_count_model_calls_aggregates() -> None:
    calls = [
        _make_call("completed", "gpt-4o"),
        _make_call("completed", "gpt-4o"),
        _make_call("failed", "gpt-4o-mini"),
        _make_call("completed", "gpt-4o-mini"),
    ]
    statuses, models = count_model_calls(calls)
    assert statuses == {"completed": 3, "failed": 1}
    assert models == {"gpt-4o": 2, "gpt-4o-mini": 2}


def test_count_model_calls_skips_none_fields() -> None:
    calls = [_make_call(None, None), _make_call("completed", None)]
    statuses, models = count_model_calls(calls)
    assert statuses == {"completed": 1}
    assert models == {}


# ---------------------------------------------------------------------------
# group_identifications_by_segment
# ---------------------------------------------------------------------------


def _make_ident(seg_id: int | None, label: str = "ad") -> Any:
    return SimpleNamespace(transcript_segment_id=seg_id, label=label)


def test_group_identifications_empty() -> None:
    assert group_identifications_by_segment([]) == {}


def test_group_identifications_single() -> None:
    ident = _make_ident(42)
    result = group_identifications_by_segment([ident])
    assert result == {42: [ident]}


def test_group_identifications_multiple_segments() -> None:
    i1 = _make_ident(1, "content")
    i2 = _make_ident(2, "ad")
    i3 = _make_ident(1, "ad")
    result = group_identifications_by_segment([i1, i2, i3])
    assert set(result.keys()) == {1, 2}
    assert len(result[1]) == 2
    assert len(result[2]) == 1


def test_group_identifications_skips_none_segment_id() -> None:
    ident = _make_ident(None)
    result = group_identifications_by_segment([ident])
    assert result == {}


# ---------------------------------------------------------------------------
# count_primary_labels
# ---------------------------------------------------------------------------


def _make_segment(seg_id: int) -> Any:
    return SimpleNamespace(id=seg_id)


def test_count_primary_labels_all_content() -> None:
    segs = [_make_segment(1), _make_segment(2)]
    identifications_by_segment: dict[int, list[Any]] = {}
    content, ads = count_primary_labels(segs, identifications_by_segment)
    assert content == 2
    assert ads == 0


def test_count_primary_labels_all_ads() -> None:
    segs = [_make_segment(1), _make_segment(2)]
    by_seg = {
        1: [_make_ident(1, "ad")],
        2: [_make_ident(2, "ad")],
    }
    content, ads = count_primary_labels(segs, by_seg)
    assert content == 0
    assert ads == 2


def test_count_primary_labels_mixed() -> None:
    segs = [_make_segment(1), _make_segment(2), _make_segment(3)]
    by_seg = {
        1: [_make_ident(1, "content")],
        2: [_make_ident(2, "ad")],
    }
    content, ads = count_primary_labels(segs, by_seg)
    # seg 3 has no ident → counts as content
    assert content == 2
    assert ads == 1


def test_count_primary_labels_skips_none_segment_id() -> None:
    segs = [SimpleNamespace(id=None)]
    content, ads = count_primary_labels(segs, {})
    assert content == 0
    assert ads == 0


# ---------------------------------------------------------------------------
# parse_refined_windows
# ---------------------------------------------------------------------------


def test_parse_refined_windows_not_list() -> None:
    assert parse_refined_windows(None) == []
    assert parse_refined_windows("not a list") == []
    assert parse_refined_windows(42) == []


def test_parse_refined_windows_empty_list() -> None:
    assert parse_refined_windows([]) == []


def test_parse_refined_windows_valid() -> None:
    raw = [{"refined_start": 1.0, "refined_end": 3.5}]
    result = parse_refined_windows(raw)
    assert result == [(1.0, 3.5)]


def test_parse_refined_windows_multiple() -> None:
    raw = [
        {"refined_start": 0.0, "refined_end": 2.0},
        {"refined_start": 5.0, "refined_end": 8.0},
    ]
    result = parse_refined_windows(raw)
    assert result == [(0.0, 2.0), (5.0, 8.0)]


def test_parse_refined_windows_skips_missing_keys() -> None:
    raw = [{"refined_start": 1.0}, {"refined_end": 3.0}, {}]
    assert parse_refined_windows(raw) == []


def test_parse_refined_windows_skips_invalid_order() -> None:
    # end <= start should be skipped
    raw = [{"refined_start": 5.0, "refined_end": 2.0}]
    assert parse_refined_windows(raw) == []


def test_parse_refined_windows_skips_non_dict_items() -> None:
    raw: list[Any] = ["not-a-dict", 42, None]
    assert parse_refined_windows(raw) == []


def test_parse_refined_windows_coerces_strings() -> None:
    raw = [{"refined_start": "1.5", "refined_end": "4.0"}]
    result = parse_refined_windows(raw)
    assert result == [(1.5, 4.0)]


def test_parse_refined_windows_skips_non_numeric() -> None:
    raw = [{"refined_start": "abc", "refined_end": "def"}]
    assert parse_refined_windows(raw) == []


# ---------------------------------------------------------------------------
# merge_time_windows
# ---------------------------------------------------------------------------


def test_merge_time_windows_empty() -> None:
    assert merge_time_windows([]) == []


def test_merge_time_windows_single() -> None:
    assert merge_time_windows([(1.0, 3.0)]) == [(1.0, 3.0)]


def test_merge_time_windows_no_overlap() -> None:
    windows = [(0.0, 1.0), (5.0, 6.0)]
    result = merge_time_windows(windows, gap_seconds=1.0)
    assert result == [(0.0, 1.0), (5.0, 6.0)]


def test_merge_time_windows_adjacent_within_gap() -> None:
    # Gap between 1.0→2.5 is 1.5 s; with default gap=1.0 they should NOT merge
    windows = [(0.0, 1.0), (2.5, 4.0)]
    result = merge_time_windows(windows, gap_seconds=1.0)
    assert result == [(0.0, 1.0), (2.5, 4.0)]


def test_merge_time_windows_adjacent_within_gap_merges() -> None:
    windows = [(0.0, 1.0), (1.5, 3.0)]
    result = merge_time_windows(windows, gap_seconds=1.0)
    assert result == [(0.0, 3.0)]


def test_merge_time_windows_overlapping() -> None:
    windows = [(0.0, 3.0), (2.0, 5.0)]
    result = merge_time_windows(windows)
    assert result == [(0.0, 5.0)]


def test_merge_time_windows_sorts_first() -> None:
    windows = [(5.0, 6.0), (0.0, 1.0), (0.5, 2.0)]
    result = merge_time_windows(windows)
    assert result == [(0.0, 2.0), (5.0, 6.0)]


def test_merge_time_windows_gap_zero() -> None:
    # With gap=0, only exactly touching windows merge
    windows = [(0.0, 1.0), (1.0, 2.0)]
    result = merge_time_windows(windows, gap_seconds=0.0)
    assert result == [(0.0, 2.0)]


# ---------------------------------------------------------------------------
# is_mixed_segment
# ---------------------------------------------------------------------------


def test_is_mixed_segment_no_windows() -> None:
    assert is_mixed_segment(seg_start=0.0, seg_end=5.0, refined_windows=[]) is False


def test_is_mixed_segment_no_overlap() -> None:
    # Segment is entirely after the window
    assert (
        is_mixed_segment(seg_start=10.0, seg_end=15.0, refined_windows=[(0.0, 5.0)])
        is False
    )


def test_is_mixed_segment_fully_contained() -> None:
    # Segment completely inside the window → not mixed
    assert (
        is_mixed_segment(seg_start=1.0, seg_end=3.0, refined_windows=[(0.0, 5.0)])
        is False
    )


def test_is_mixed_segment_partial_overlap_start() -> None:
    # Segment starts before window end — partial overlap → mixed
    assert (
        is_mixed_segment(seg_start=3.0, seg_end=7.0, refined_windows=[(5.0, 10.0)])
        is True
    )


def test_is_mixed_segment_partial_overlap_end() -> None:
    # Segment ends after window start — partial overlap → mixed
    assert (
        is_mixed_segment(seg_start=0.0, seg_end=5.0, refined_windows=[(3.0, 8.0)])
        is True
    )


def test_is_mixed_segment_window_contained_in_segment() -> None:
    # Refined window entirely inside the segment → partial (not fully contained) → mixed
    assert (
        is_mixed_segment(seg_start=0.0, seg_end=10.0, refined_windows=[(3.0, 7.0)])
        is True
    )


def test_is_mixed_segment_multiple_windows_one_match() -> None:
    windows = [(20.0, 25.0), (3.0, 7.0)]
    # Segment 0-10 overlaps second window partially
    assert (
        is_mixed_segment(seg_start=0.0, seg_end=10.0, refined_windows=windows) is True
    )
