import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { statsApi } from '../services/api';
import type { StatsResponse } from '../services/api';

const REFRESH_INTERVAL_MS = 30_000;

// ---- small UI helpers ----

function StatCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
                {title}
            </h2>
            {children}
        </div>
    );
}

function BigNumber({
    label,
    value,
    sub,
}: {
    label: string;
    value: string | number;
    sub?: string;
}) {
    return (
        <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {value}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            {sub && (
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</span>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colours: Record<string, string> = {
        completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        skipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    const cls =
        colours[status] ??
        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}
        >
            {status}
        </span>
    );
}

// ---- page ----

export default function StatsPage() {
    const [data, setData] = useState<StatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    const load = useCallback(async () => {
        try {
            const result = await statsApi.getStats();
            setData(result);
            setLastRefreshed(new Date());
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load stats'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
        const interval = setInterval(() => void load(), REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [load]);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Stats
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Aggregate activity for this Podly instance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastRefreshed && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            Updated {lastRefreshed.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={() => void load()}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && !data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
                        />
                    ))}
                </div>
            )}

            {/* Content */}
            {data && (
                <>
                    {/* Top-level numbers */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard title="Feeds">
                            <BigNumber label="total feeds" value={data.feeds.total} />
                        </StatCard>

                        <StatCard title="Episodes">
                            <BigNumber
                                label="total episodes"
                                value={data.episodes.total}
                                sub={`${data.episodes.processed} processed · ${data.episodes.unprocessed} unprocessed`}
                            />
                        </StatCard>

                        <StatCard title="Transcription">
                            <BigNumber
                                label="hours transcribed"
                                value={data.transcript.total_transcribed_hours.toFixed(1)}
                                sub={`${data.transcript.total_segments.toLocaleString()} segments`}
                            />
                        </StatCard>

                        <StatCard title="Ad Detection">
                            <BigNumber
                                label="est. ads removed"
                                value={`${data.ad_detection.estimated_ad_hours.toFixed(1)} hrs`}
                                sub={`${data.ad_detection.estimated_ad_minutes.toFixed(0)} min · ${data.ad_detection.ad_identifications.toLocaleString()} ad identifications`}
                            />
                        </StatCard>
                    </div>

                    {/* Model calls */}
                    <StatCard title="LLM Model Calls">
                        <div className="flex flex-wrap gap-6">
                            <BigNumber
                                label="total calls"
                                value={data.model_calls.total.toLocaleString()}
                            />
                        </div>
                        {Object.keys(data.model_calls.by_model).length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    By model
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                                <th className="pb-1 pr-4 font-medium">Model</th>
                                                <th className="pb-1 text-right font-medium">Calls</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(data.model_calls.by_model)
                                                .sort((a, b) => b[1] - a[1])
                                                .map(([model, count]) => (
                                                    <tr
                                                        key={model}
                                                        className="border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                                                    >
                                                        <td className="py-1.5 pr-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                                                            {model}
                                                        </td>
                                                        <td className="py-1.5 text-right text-gray-900 dark:text-gray-100">
                                                            {count.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {Object.keys(data.model_calls.by_status).length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {Object.entries(data.model_calls.by_status).map(
                                    ([status, count]) => (
                                        <span
                                            key={status}
                                            className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
                                        >
                                            <StatusBadge status={status} />
                                            <span>{count.toLocaleString()}</span>
                                        </span>
                                    )
                                )}
                            </div>
                        )}
                    </StatCard>

                    {/* Processing jobs */}
                    <StatCard title="Processing Jobs">
                        <div className="flex flex-wrap gap-6">
                            <BigNumber
                                label="total jobs"
                                value={data.processing_jobs.total.toLocaleString()}
                            />
                            {data.processing_jobs.success_rate_percent !== null && (
                                <BigNumber
                                    label="success rate"
                                    value={`${data.processing_jobs.success_rate_percent}%`}
                                />
                            )}
                        </div>
                        {Object.keys(data.processing_jobs.by_status).length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {Object.entries(data.processing_jobs.by_status).map(
                                    ([status, count]) => (
                                        <span
                                            key={status}
                                            className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
                                        >
                                            <StatusBadge status={status} />
                                            <span>{count.toLocaleString()}</span>
                                        </span>
                                    )
                                )}
                            </div>
                        )}
                    </StatCard>
                </>
            )}
        </div>
    );
}
