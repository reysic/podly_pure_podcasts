import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { configApi } from '../../../services/api';
import { useConfigContext } from '../ConfigContext';
import { Section, Field, SaveButton, TestButton } from '../shared';
import type { LLMConfig } from '../../../types';
import { useEffect } from 'react';

const LLM_MODEL_ALIASES: string[] = [
  'openai/gpt-4',
  'openai/gpt-4o',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.5-haiku',
  'gemini/gemini-3-flash-preview',
  'gemini/gemini-2.0-flash',
  'gemini/gemini-1.5-pro',
  'gemini/gemini-1.5-flash',
  'groq/openai/gpt-oss-120b',
];

export default function LLMSection() {
  const { pending, setField, getEnvHint, handleSave, isSaving } = useConfigContext();
  const [showBaseUrlInfo, setShowBaseUrlInfo] = useState(false);
  const [githubPat, setGithubPat] = useState<string | null>(null);
  const [models, setModels] = useState<Array<{ id: string; name: string; cost_multiplier?: number | null }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  if (!pending) return null;

  const handleTestLLM = () => {
    toast.promise(configApi.testLLM({ llm: pending.llm as LLMConfig }), {
      loading: 'Testing LLM connection...',
      success: (res: { ok: boolean; message?: string }) => res?.message || 'LLM connection OK',
      error: (err: unknown) => {
        const e = err as {
          response?: { data?: { error?: string; message?: string } };
          message?: string;
        };
        return (
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          'LLM connection failed'
        );
      },
    });
  };

  useEffect(() => {
    // initialize github PAT from pending config if present
    if (pending?.llm?.github_pat) setGithubPat(pending.llm.github_pat as string);
    if (pending?.llm?.llm_github_pat) setGithubPat(pending.llm.llm_github_pat as string);
  }, [pending]);

  const handleFetchModels = async () => {
    setLoadingModels(true);
    try {
      const res = await configApi.getCopilotModels({ github_pat: githubPat ?? undefined });
      if (res?.ok && Array.isArray(res.models)) {
        setModels(res.models.map((m: any) => ({ id: m.id, name: m.name, cost_multiplier: m.cost_multiplier ?? null })));
        toast.success('Fetched models');
      } else {
        toast.error(res?.error || 'Failed to fetch models');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || 'Failed to fetch models');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSelectModel = (id?: string) => {
    if (!id) return;
    setField(['llm', 'llm_model'], id);
  };

  return (
    <div className="space-y-6">
      <Section title="LLM">
        <Field label="API Key" envMeta={getEnvHint('llm.llm_api_key')}>
          <input
            className="input"
            type="text"
            placeholder={pending?.llm?.llm_api_key_preview || ''}
            value={pending?.llm?.llm_api_key || ''}
            onChange={(e) => setField(['llm', 'llm_api_key'], e.target.value)}
          />
        </Field>

        <label className="flex items-start justify-between gap-3">
          <div className="w-60">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">OpenAI Base URL</span>
              <button
                type="button"
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                onClick={() => setShowBaseUrlInfo((v) => !v)}
                title="When is this used?"
              >
                ⓘ
              </button>
            </div>
            {getEnvHint('llm.openai_base_url')?.env_var && (
              <code className="mt-1 block text-xs text-gray-500 font-mono">
                {getEnvHint('llm.openai_base_url')?.env_var}
              </code>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              className="input"
              type="text"
              placeholder="https://api.openai.com/v1"
              value={pending?.llm?.openai_base_url || ''}
              onChange={(e) => setField(['llm', 'openai_base_url'], e.target.value)}
            />
            {showBaseUrlInfo && <BaseUrlInfoBox />}
          </div>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Model" envMeta={getEnvHint('llm.llm_model')}>
            <div className="relative">
              <input
                list="llm-model-datalist"
                className="input"
                type="text"
                value={pending?.llm?.llm_model ?? ''}
                onChange={(e) => setField(['llm', 'llm_model'], e.target.value)}
                placeholder="e.g. groq/openai/gpt-oss-120b"
              />
              <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Copilot Integration
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Enter your GitHub Personal Access Token to browse and select Copilot AI models
                </p>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      className="input w-full"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={githubPat ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setGithubPat(v);
                        setField(['llm', 'github_pat'], v);
                        setField(['llm', 'llm_github_pat'], v);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className={`btn rounded px-4 py-2 ${githubPat ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                    onClick={handleFetchModels}
                    disabled={loadingModels || !githubPat}
                  >
                    {loadingModels ? (
                      <span className="flex items-center gap-1">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      'Fetch Models'
                    )}
                  </button>
                </div>
              </div>
              {models.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-green-800">
                      ✓ Available Copilot Models ({models.length})
                    </label>
                  </div>
                  <ul className="mt-1 space-y-1">{models.map((m) => {
                    const isPremium = m.cost_multiplier != null && m.cost_multiplier === 0;
                    return (
                      <li key={m.id} className="flex items-center justify-between">
                        <button
                          type="button"
                          className={`text-left text-sm ${isPremium ? 'text-orange-600 font-semibold' : 'text-blue-600'}`}
                          onClick={() => handleSelectModel(m.id)}
                        >
                          {isPremium && '🔥 '}
                          {m.name || m.id}
                        </button>
                        <span className={`text-xs ${isPremium ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                          {m.cost_multiplier != null ? `${m.cost_multiplier}x` : '—'}
                        </span>
                      </li>
                    );
                  })}
                  </ul>
                </div>
              )}
            </div>
          </Field>
          <Field label="OpenAI Timeout (sec)">
            <input
              className="input"
              type="number"
              value={pending?.llm?.openai_timeout ?? 300}
              onChange={(e) => setField(['llm', 'openai_timeout'], Number(e.target.value))}
            />
          </Field>
          <Field label="OpenAI Max Tokens">
            <input
              className="input"
              type="number"
              value={pending?.llm?.openai_max_tokens ?? 4096}
              onChange={(e) => setField(['llm', 'openai_max_tokens'], Number(e.target.value))}
            />
          </Field>
          <Field label="Max Concurrent LLM Calls">
            <input
              className="input"
              type="number"
              value={pending?.llm?.llm_max_concurrent_calls ?? 3}
              onChange={(e) => setField(['llm', 'llm_max_concurrent_calls'], Number(e.target.value))}
            />
          </Field>
          <Field label="Max Retry Attempts">
            <input
              className="input"
              type="number"
              value={pending?.llm?.llm_max_retry_attempts ?? 5}
              onChange={(e) => setField(['llm', 'llm_max_retry_attempts'], Number(e.target.value))}
            />
          </Field>
          <Field label="Enable Token Rate Limiting">
            <input
              type="checkbox"
              checked={!!pending?.llm?.llm_enable_token_rate_limiting}
              onChange={(e) => setField(['llm', 'llm_enable_token_rate_limiting'], e.target.checked)}
            />
          </Field>
          <Field label="Enable Boundary Refinement" hint="LLM-based ad boundary refinement for improved precision">
            <input
              type="checkbox"
              checked={pending?.llm?.enable_boundary_refinement ?? true}
              onChange={(e) => setField(['llm', 'enable_boundary_refinement'], e.target.checked)}
            />
          </Field>
          <Field
            label="Enable Word-Level Boundary Refiner"
            hint="Uses a word-position heuristic to estimate the ad start time within a transcript segment"
          >
            <input
              type="checkbox"
              checked={!!pending?.llm?.enable_word_level_boundary_refinder}
              onChange={(e) =>
                setField(['llm', 'enable_word_level_boundary_refinder'], e.target.checked)
              }
            />
          </Field>
          <Field label="Max Input Tokens Per Call (optional)">
            <input
              className="input"
              type="number"
              value={pending?.llm?.llm_max_input_tokens_per_call ?? ''}
              onChange={(e) =>
                setField(
                  ['llm', 'llm_max_input_tokens_per_call'],
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
            />
          </Field>
          <Field label="Max Input Tokens Per Minute (optional)">
            <input
              className="input"
              type="number"
              value={pending?.llm?.llm_max_input_tokens_per_minute ?? ''}
              onChange={(e) =>
                setField(
                  ['llm', 'llm_max_input_tokens_per_minute'],
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
            />
          </Field>
        </div>

        <TestButton onClick={handleTestLLM} label="Test LLM" />
      </Section>

      <SaveButton onSave={handleSave} isPending={isSaving} />

      {/* Datalist for model suggestions */}
      <datalist id="llm-model-datalist">
        {LLM_MODEL_ALIASES.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <style>{`.input{width:100%;padding:0.5rem;border:1px solid #e5e7eb;border-radius:0.375rem;font-size:0.875rem}`}</style>
    </div>
  );
}

function BaseUrlInfoBox() {
  return (
    <div className="text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
      <p className="font-semibold">When is Base URL used?</p>
      <p>
        The Base URL is <strong>only used for models without a provider prefix</strong>. LiteLLM
        automatically routes provider-prefixed models to their respective APIs.
      </p>
      <div className="space-y-1">
        <p className="font-medium">✅ Base URL is IGNORED for:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>
            <code className="bg-white px-1 rounded">groq/openai/gpt-oss-120b</code> → Groq API
          </li>
          <li>
            <code className="bg-white px-1 rounded">anthropic/claude-3.5-sonnet</code> → Anthropic
            API
          </li>
          <li>
            <code className="bg-white px-1 rounded">gemini/gemini-3-flash-preview</code> → Google API
          </li>
          <li>
            <code className="bg-white px-1 rounded">gemini/gemini-2.0-flash</code> → Google API
          </li>
        </ul>
      </div>
      <div className="space-y-1">
        <p className="font-medium">⚙️ Base URL is USED for:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>
            Unprefixed models like <code className="bg-white px-1 rounded">gpt-4o</code>
          </li>
          <li>Self-hosted OpenAI-compatible endpoints</li>
          <li>LiteLLM proxy servers or local LLMs</li>
        </ul>
      </div>
      <p className="italic text-gray-600">For the default Groq setup, you don't need to set this.</p>
    </div>
  );
}
