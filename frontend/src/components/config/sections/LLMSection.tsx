import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { configApi } from '../../../services/api';
import { useConfigContext } from '../ConfigContext';
import { Section, Field, SaveButton, TestButton } from '../shared';
import type { LLMConfig } from '../../../types';

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

type CopilotModel = { id: string; name: string; cost_multiplier?: number | null };

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 inline-block" />
      Active
    </span>
  ) : (
    <span className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 inline-block" />
      Inactive
    </span>
  );
}

export default function LLMSection() {
  const { pending, setField, getEnvHint, handleSave, isSaving } = useConfigContext();
  const [showBaseUrlInfo, setShowBaseUrlInfo] = useState(false);
  const [githubPat, setGithubPat] = useState<string>('');
  const [models, setModels] = useState<CopilotModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    const pat = ((pending?.llm?.llm_github_pat ?? pending?.llm?.github_pat ?? '') as string);
    setGithubPat(pat);
  }, [pending]);

  if (!pending) return null;

  const currentCopilotModel = pending?.llm?.llm_github_model as string | undefined;
  const currentOpenAIModel = pending?.llm?.llm_model as string | undefined;

  // Copilot is active when both a PAT and a Copilot model are configured.
  // Otherwise the OpenAI-compatible provider is used.
  const isCopilotActive = !!(githubPat && currentCopilotModel);
  const isOpenAIActive = !isCopilotActive;

  const handleTestLLM = () => {
    toast.promise(configApi.testLLM({ llm: pending.llm as LLMConfig }), {
      loading: 'Testing LLM connection…',
      success: (res: { ok: boolean; message?: string }) => res?.message || 'LLM connection OK',
      error: (err: unknown) => {
        const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
        return e?.response?.data?.error || e?.response?.data?.message || e?.message || 'LLM connection failed';
      },
    });
  };

  const handleFetchModels = async () => {
    setLoadingModels(true);
    try {
      const res = await configApi.getCopilotModels({ github_pat: githubPat || undefined });
      if (res?.ok && Array.isArray(res.models)) {
        setModels(
          (res.models as Array<{ id: string; name: string; cost_multiplier?: number | null }>).map(
            (m) => ({ id: m.id, name: m.name, cost_multiplier: m.cost_multiplier ?? null })
          )
        );
        toast.success(`Fetched ${String(res.models.length)} models`);
      } else {
        toast.error((res as { error?: string })?.error || 'Failed to fetch models');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      toast.error(err?.response?.data?.error || err?.message || 'Failed to fetch models');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSelectModel = (id: string) => {
    setField(['llm', 'llm_github_model'], id);
    toast.success(`Copilot model set to ${id}`, { duration: 1500 });
  };

  const handlePatChange = (v: string) => {
    setGithubPat(v);
    setField(['llm', 'github_pat'], v);
    setField(['llm', 'llm_github_pat'], v);
  };

  return (
    <div className="space-y-6">
      <Section title="LLM — Ad Identification">

        {/* ── GitHub Copilot card ── */}
        <div className={`rounded-lg border overflow-hidden ${isCopilotActive ? 'border-green-300 dark:border-green-700' : 'border-gray-200 dark:border-gray-700'}`}>
          <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isCopilotActive ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/60' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-gray-800 dark:text-gray-200" fill="currentColor" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">GitHub Copilot</span>
            <ActiveBadge active={isCopilotActive} />
          </div>

          <div className="p-4 space-y-4 bg-white dark:bg-gray-800/40">
            {isCopilotActive && (
              <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded px-3 py-2">
                Copilot is the active LLM provider — using model <strong>{currentCopilotModel}</strong>.
              </p>
            )}
            {!isCopilotActive && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Use your GitHub Copilot subscription — no extra billing. Set both a PAT and a model below to activate.{' '}
                <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline hover:no-underline">
                  Get a token
                </a>{' '}
                with the <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-gray-700 dark:text-gray-300">copilot</code> scope.
              </p>
            )}

            {/* PAT */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Personal Access Token</label>
                {getEnvHint('llm.llm_github_pat')?.env_var && (
                  <code className="text-xs text-gray-400 font-mono">{getEnvHint('llm.llm_github_pat')?.env_var ?? 'GITHUB_PAT'}</code>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1 font-mono text-xs"
                  type="password"
                  placeholder="github_pat_…"
                  value={githubPat}
                  onChange={(e) => handlePatChange(e.target.value)}
                />
                <button
                  type="button"
                  disabled={loadingModels || !githubPat}
                  onClick={() => void handleFetchModels()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap
                    enabled:border-gray-300 enabled:dark:border-gray-600 enabled:text-gray-700 enabled:dark:text-gray-300
                    enabled:hover:bg-gray-50 enabled:dark:hover:bg-gray-700
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-200 disabled:dark:border-gray-700 disabled:text-gray-400"
                >
                  {loadingModels ? (
                    <>
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      Browse Models
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Model browser */}
            {models.length > 0 && (
              <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {models.length} available — click to select
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
                  {models.map((m) => {
                    const isSelected = currentCopilotModel === m.id;
                    const isFree = m.cost_multiplier != null && m.cost_multiplier === 0;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                          }`}
                      >
                        <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                          {m.name || m.id}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {isFree && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                              included
                            </span>
                          )}
                          {!isFree && m.cost_multiplier != null && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                              {m.cost_multiplier}×
                            </span>
                          )}
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Copilot model text field */}
            <Field
              label="Copilot Model"
              hint="GitHub Copilot model to use for ad classification. Use Browse Models above to find available models for your subscription."
              envMeta={getEnvHint('llm.llm_github_model')}
            >
              <input
                className="input"
                type="text"
                placeholder="e.g. gpt-4o, claude-sonnet-4.5, o1-mini"
                value={currentCopilotModel ?? ''}
                onChange={(e) => setField(['llm', 'llm_github_model'], e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── OpenAI-Compatible Provider card ── */}
        <div className={`rounded-lg border overflow-hidden ${isOpenAIActive ? 'border-green-300 dark:border-green-700' : 'border-gray-200 dark:border-gray-700'}`}>
          <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isOpenAIActive ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/60' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">OpenAI-Compatible Provider</span>
            <ActiveBadge active={isOpenAIActive} />
          </div>
          <div className="p-4 space-y-3 bg-white dark:bg-gray-800/40">
            {isOpenAIActive && (
              <p className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded px-3 py-2">
                OpenAI-compatible provider is the active LLM provider — using model <strong>{currentOpenAIModel || '(not set)'}</strong>.
              </p>
            )}
            {!isOpenAIActive && (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Any OpenAI-compatible API — OpenAI, Anthropic, Groq, Ollama, LiteLLM proxy, and more.
                Inactive because GitHub Copilot is fully configured.
              </p>
            )}

            <Field
              label="API Key"
              hint="API key for your chosen LLM provider (OpenAI, Anthropic, Groq, etc.). Required unless using a proxy that handles auth."
              envMeta={getEnvHint('llm.llm_api_key')}
            >
              <input
                className="input"
                type="text"
                placeholder={(pending?.llm?.llm_api_key_preview as string | undefined) || 'sk-…'}
                value={(pending?.llm?.llm_api_key as string | undefined) || ''}
                onChange={(e) => setField(['llm', 'llm_api_key'], e.target.value)}
              />
            </Field>

            <label className="flex items-start justify-between gap-3">
              <div className="w-52 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Base URL</span>
                  <button
                    type="button"
                    className="px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setShowBaseUrlInfo((v) => !v)}
                    title="When is this used?"
                  >ⓘ</button>
                </div>
                {getEnvHint('llm.openai_base_url')?.env_var && (
                  <code className="mt-1 block text-xs text-gray-400 font-mono">{getEnvHint('llm.openai_base_url')?.env_var}</code>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  className="input"
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={(pending?.llm?.openai_base_url as string | undefined) || ''}
                  onChange={(e) => setField(['llm', 'openai_base_url'], e.target.value)}
                />
                {showBaseUrlInfo && <BaseUrlInfoBox />}
              </div>
            </label>

            <Field
              label="Model"
              hint="LLM model to use for ad classification. Use a provider prefix for non-OpenAI providers (e.g. anthropic/claude-3.5-sonnet, groq/openai/gpt-oss-120b)."
              envMeta={getEnvHint('llm.llm_model')}
            >
              <input
                list="llm-model-datalist"
                className="input"
                type="text"
                value={currentOpenAIModel ?? ''}
                onChange={(e) => setField(['llm', 'llm_model'], e.target.value)}
                placeholder="e.g. openai/gpt-4o"
              />
            </Field>

            {/* OpenAI-compat-specific settings */}
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 select-none py-1 list-none flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Provider-specific settings
              </summary>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Timeout (sec)"
                  hint="Maximum seconds to wait for a single LLM response before the request is aborted and retried."
                >
                  <input className="input" type="number"
                    value={(pending?.llm?.openai_timeout as number | undefined) ?? 300}
                    onChange={(e) => setField(['llm', 'openai_timeout'], Number(e.target.value))} />
                </Field>
                <Field
                  label="Max Tokens"
                  hint="Maximum number of tokens the LLM can generate in a single response. Increase if responses are being truncated."
                >
                  <input className="input" type="number"
                    value={(pending?.llm?.openai_max_tokens as number | undefined) ?? 4096}
                    onChange={(e) => setField(['llm', 'openai_max_tokens'], Number(e.target.value))} />
                </Field>
                <Field
                  label="Enable Token Rate Limiting"
                  hint="Enables per-minute token rate limiting to avoid hitting provider API rate limits."
                >
                  <input type="checkbox"
                    checked={!!(pending?.llm?.llm_enable_token_rate_limiting)}
                    onChange={(e) => setField(['llm', 'llm_enable_token_rate_limiting'], e.target.checked)} />
                </Field>
                <Field label="Max Input Tokens Per Call" hint="Hard limit on input tokens per LLM call. Leave blank for no limit. Useful for controlling cost per request.">
                  <input className="input" type="number"
                    value={(pending?.llm?.llm_max_input_tokens_per_call as number | undefined) ?? ''}
                    onChange={(e) => setField(['llm', 'llm_max_input_tokens_per_call'],
                      e.target.value === '' ? null : Number(e.target.value))} />
                </Field>
                <Field label="Max Input Tokens Per Minute" hint="Cap total input tokens sent per minute across all concurrent calls. Leave blank for no limit. Helps avoid rate-limit errors.">
                  <input className="input" type="number"
                    value={(pending?.llm?.llm_max_input_tokens_per_minute as number | undefined) ?? ''}
                    onChange={(e) => setField(['llm', 'llm_max_input_tokens_per_minute'],
                      e.target.value === '' ? null : Number(e.target.value))} />
                </Field>
              </div>
            </details>
          </div>
        </div>

        {/* ── Shared settings (both providers) ── */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Shared Settings</span>
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">applies to both providers</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white dark:bg-gray-800/40">
            <Field
              label="Max Concurrent LLM Calls"
              hint="Number of ad-classification calls that can run in parallel. Higher values speed up processing but increase simultaneous API usage."
            >
              <input className="input" type="number"
                value={(pending?.llm?.llm_max_concurrent_calls as number | undefined) ?? 3}
                onChange={(e) => setField(['llm', 'llm_max_concurrent_calls'], Number(e.target.value))} />
            </Field>
            <Field
              label="Max Retry Attempts"
              hint="How many times Podly retries a failed LLM call before giving up on that segment."
            >
              <input className="input" type="number"
                value={(pending?.llm?.llm_max_retry_attempts as number | undefined) ?? 5}
                onChange={(e) => setField(['llm', 'llm_max_retry_attempts'], Number(e.target.value))} />
            </Field>
            <Field label="Enable Boundary Refinement" hint="LLM-based ad boundary refinement for improved precision">
              <input type="checkbox"
                checked={(pending?.llm?.enable_boundary_refinement as boolean | undefined) ?? true}
                onChange={(e) => setField(['llm', 'enable_boundary_refinement'], e.target.checked)} />
            </Field>
            <Field label="Enable Word-Level Boundary Refiner"
              hint="Uses a word-position heuristic to estimate the ad start time within a transcript segment">
              <input type="checkbox"
                checked={!!(pending?.llm?.enable_word_level_boundary_refinder)}
                onChange={(e) => setField(['llm', 'enable_word_level_boundary_refinder'], e.target.checked)} />
            </Field>
          </div>
        </div>

        <TestButton onClick={handleTestLLM} label="Test LLM" />
      </Section>

      <SaveButton onSave={handleSave} isPending={isSaving} />

      <datalist id="llm-model-datalist">
        {LLM_MODEL_ALIASES.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
}

function BaseUrlInfoBox() {
  return (
    <div className="text-xs text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 space-y-2">
      <p className="font-semibold">When is Base URL used?</p>
      <p>The Base URL is <strong>only used for models without a provider prefix</strong>. LiteLLM automatically routes provider-prefixed models to their respective APIs.</p>
      <div className="space-y-1">
        <p className="font-medium">✅ Base URL is IGNORED for:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><code className="bg-white dark:bg-gray-700 px-1 rounded">groq/openai/gpt-oss-120b</code> → Groq API</li>
          <li><code className="bg-white dark:bg-gray-700 px-1 rounded">anthropic/claude-3.5-sonnet</code> → Anthropic API</li>
          <li><code className="bg-white dark:bg-gray-700 px-1 rounded">gemini/gemini-2.0-flash</code> → Google API</li>
        </ul>
      </div>
      <div className="space-y-1">
        <p className="font-medium">⚙️ Base URL is USED for:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>Unprefixed models like <code className="bg-white dark:bg-gray-700 px-1 rounded">gpt-4o</code></li>
          <li>Self-hosted OpenAI-compatible endpoints</li>
          <li>LiteLLM proxy servers</li>
        </ul>
      </div>
    </div>
  );
}


