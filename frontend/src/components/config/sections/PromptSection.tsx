import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { configApi } from '../../../services/api';
import { Section, SaveButton } from '../shared';

export default function PromptSection() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPromptTemplate, setUserPromptTemplate] = useState('');
  const [originalSystemPrompt, setOriginalSystemPrompt] = useState('');
  const [originalUserPromptTemplate, setOriginalUserPromptTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await configApi.getPrompts();
      setSystemPrompt(data.system_prompt);
      setUserPromptTemplate(data.user_prompt_template);
      setOriginalSystemPrompt(data.system_prompt);
      setOriginalUserPromptTemplate(data.user_prompt_template);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.updatePrompts({
        system_prompt: systemPrompt,
        user_prompt_template: userPromptTemplate,
      });
      setOriginalSystemPrompt(systemPrompt);
      setOriginalUserPromptTemplate(userPromptTemplate);
      toast.success('Prompts saved successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to save prompts');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSystemPrompt(originalSystemPrompt);
    setUserPromptTemplate(originalUserPromptTemplate);
  };

  const hasChanges =
    systemPrompt !== originalSystemPrompt || userPromptTemplate !== originalUserPromptTemplate;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading prompts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section title="LLM Prompts">
        <div className="space-y-6">
          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System Prompt
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              The system prompt defines the LLM's role and instructions for identifying ads in
              podcast transcripts. This prompt sets the context, classification taxonomy, and output
              format requirements.
            </p>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={15}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter system prompt..."
            />
          </div>

          {/* User Prompt Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Prompt Template
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              The user prompt template is a Jinja2 template that generates the specific prompt for
              each transcript chunk. Available variables: <code>podcast_title</code>,{' '}
              <code>podcast_topic</code>, <code>transcript</code>.
            </p>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={8}
              value={userPromptTemplate}
              onChange={(e) => setUserPromptTemplate(e.target.value)}
              placeholder="Enter user prompt template..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <SaveButton onClick={handleSave} isSaving={saving} disabled={!hasChanges || saving}>
              {saving ? 'Saving...' : 'Save Prompts'}
            </SaveButton>
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Warning:</strong> Modifying these prompts will affect how the LLM identifies
              advertisements in podcast transcripts. Changes take effect immediately for new
              processing jobs. Ensure you understand the prompt structure before making changes.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
