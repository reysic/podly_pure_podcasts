import { useConfigContext } from '../ConfigContext';
import { Section, Field, SaveButton } from '../shared';

export default function OutputSection() {
  const { pending, setField, handleSave, isSaving } = useConfigContext();

  if (!pending) return null;

  return (
    <div className="space-y-6">
      <Section title="Processing">
        <Field
          label="Segments per Prompt"
          hint="Number of transcript segments batched together in each LLM ad-detection call. Higher values reduce the number of API calls but increase per-call cost and prompt size."
        >
          <input
            className="input"
            type="number"
            value={pending?.processing?.num_segments_to_input_to_prompt ?? 30}
            onChange={(e) =>
              setField(['processing', 'num_segments_to_input_to_prompt'], Number(e.target.value))
            }
          />
        </Field>
      </Section>

      <Section title="Output">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Fade (ms)"
            hint="Duration of the audio crossfade at each ad cut point, in milliseconds. Set to 0 to disable fading."
          >
            <input
              className="input"
              type="number"
              value={pending?.output?.fade_ms ?? 3000}
              onChange={(e) => setField(['output', 'fade_ms'], Number(e.target.value))}
            />
          </Field>
          <Field
            label="Min Segment Separation (sec)"
            hint="Adjacent ad segments closer than this are merged into a single cut. Prevents choppy back-to-back cuts."
          >
            <input
              className="input"
              type="number"
              value={pending?.output?.min_ad_segement_separation_seconds ?? 60}
              onChange={(e) =>
                setField(['output', 'min_ad_segement_separation_seconds'], Number(e.target.value))
              }
            />
          </Field>
          <Field
            label="Min Segment Length (sec)"
            hint="Ad segments shorter than this duration are ignored. Prevents very short false-positive cuts."
          >
            <input
              className="input"
              type="number"
              value={pending?.output?.min_ad_segment_length_seconds ?? 14}
              onChange={(e) =>
                setField(['output', 'min_ad_segment_length_seconds'], Number(e.target.value))
              }
            />
          </Field>
          <Field
            label="Min Confidence"
            hint="Minimum LLM confidence score (0–1) required to classify a segment as an ad. Higher values produce fewer but more certain cuts."
          >
            <input
              className="input"
              type="number"
              step="0.01"
              value={pending?.output?.min_confidence ?? 0.8}
              onChange={(e) => setField(['output', 'min_confidence'], Number(e.target.value))}
            />
          </Field>
        </div>
      </Section>

      <SaveButton onSave={handleSave} isPending={isSaving} />

      <style>{`.input{width:100%;padding:0.5rem;border:1px solid #e5e7eb;border-radius:0.375rem;font-size:0.875rem}`}</style>
    </div>
  );
}
