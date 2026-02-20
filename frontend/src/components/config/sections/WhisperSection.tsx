import { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { configApi } from '../../../services/api';
import { useConfigContext } from '../ConfigContext';
import { Section, Field, SaveButton, TestButton } from '../shared';
import type { WhisperConfig } from '../../../types';

export default function WhisperSection() {
  const {
    pending,
    setField,
    getEnvHint,
    handleSave,
    isSaving,
    getWhisperApiKey,
    envOverrides,
  } = useConfigContext();

  const whisperApiKeyPreview = (pending?.whisper as { api_key_preview?: string } | undefined)
    ?.api_key_preview;

  const whisperApiKeyPlaceholder = useMemo(() => {
    if (whisperApiKeyPreview) {
      return whisperApiKeyPreview;
    }
    const override = envOverrides['whisper.api_key'];
    if (override) {
      return override.value_preview || override.value || '';
    }
    return '';
  }, [whisperApiKeyPreview, envOverrides]);

  if (!pending) return null;

  const handleTestWhisper = () => {
    toast.promise(configApi.testWhisper({ whisper: pending.whisper as WhisperConfig }), {
      loading: 'Testing Whisper...',
      success: (res: { ok: boolean; message?: string }) => res?.message || 'Whisper OK',
      error: (err: unknown) => {
        const e = err as {
          response?: { data?: { error?: string; message?: string } };
          message?: string;
        };
        return (
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          'Whisper test failed'
        );
      },
    });
  };

  return (
    <div className="space-y-6">
      <Section title="Whisper">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="API Key"
            envMeta={getEnvHint('whisper.api_key')}
          >
            <input
              className="input"
              type="text"
              placeholder={whisperApiKeyPlaceholder}
              value={getWhisperApiKey(pending?.whisper)}
              onChange={(e) => setField(['whisper', 'api_key'], e.target.value)}
            />
          </Field>
          <Field
            label="Model"
            envMeta={getEnvHint('whisper.model')}
          >
            <input
              className="input"
              type="text"
              value={(pending?.whisper as { model?: string })?.model || 'whisper-1'}
              onChange={(e) => setField(['whisper', 'model'], e.target.value)}
            />
          </Field>
          <Field label="Base URL" envMeta={getEnvHint('whisper.base_url')}>
            <input
              className="input"
              type="text"
              placeholder="https://api.openai.com/v1"
              value={(pending?.whisper as { base_url?: string })?.base_url || ''}
              onChange={(e) => setField(['whisper', 'base_url'], e.target.value)}
            />
          </Field>
          <Field label="Language">
            <input
              className="input"
              type="text"
              value={(pending?.whisper as { language?: string })?.language || 'en'}
              onChange={(e) => setField(['whisper', 'language'], e.target.value)}
            />
          </Field>
          <Field label="Timeout (sec)" envMeta={getEnvHint('whisper.timeout_sec')}>
            <input
              className="input"
              type="number"
              value={(pending?.whisper as { timeout_sec?: number })?.timeout_sec ?? 600}
              onChange={(e) => setField(['whisper', 'timeout_sec'], Number(e.target.value))}
            />
          </Field>
          <Field label="Chunk Size (MB)" envMeta={getEnvHint('whisper.chunksize_mb')}>
            <input
              className="input"
              type="number"
              value={(pending?.whisper as { chunksize_mb?: number })?.chunksize_mb ?? 24}
              onChange={(e) => setField(['whisper', 'chunksize_mb'], Number(e.target.value))}
            />
          </Field>
        </div>

        <TestButton onClick={handleTestWhisper} label="Test Whisper" />
      </Section>

      <SaveButton onSave={handleSave} isPending={isSaving} />

      <style>{`.input{width:100%;padding:0.5rem;border:1px solid #e5e7eb;border-radius:0.375rem;font-size:0.875rem}`}</style>
    </div>
  );
}
