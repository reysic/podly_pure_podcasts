import { useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useConfigState from '../../hooks/useConfigState';
import { ConfigContext, type ConfigTabId } from './ConfigContext';
import { EnvOverrideWarningModal, ConnectionStatusCard } from './shared';
import {
  LLMSection,
  WhisperSection,
  OutputSection,
  AppSection,
  PromptSection,
} from './sections';
import UserManagementTab from './tabs/UserManagementTab';

const TABS: { id: ConfigTabId; label: string; adminOnly?: boolean }[] = [
  { id: 'whisper', label: 'Whisper' },
  { id: 'llm', label: 'LLM' },
  { id: 'output', label: 'Processing & Output' },
  { id: 'app', label: 'App' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'users', label: 'User Management', adminOnly: true },
];

export default function ConfigTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, requireAuth } = useAuth();
  const configState = useConfigState();

  const showSecurityControls = requireAuth && !!user;
  const isAdmin = !requireAuth || (showSecurityControls && user?.role === 'admin');

  // Get tab from URL or default
  const activeTab = useMemo<ConfigTabId>(() => {
    const urlTab = searchParams.get('tab') as ConfigTabId | null;
    if (urlTab && TABS.some((t) => t.id === urlTab)) {
      const tab = TABS.find((t) => t.id === urlTab);
      if (tab?.adminOnly && !isAdmin) {
        return 'whisper';
      }
      if (urlTab === 'users' && !requireAuth) {
        return 'whisper';
      }
      return urlTab;
    }
    return 'whisper';
  }, [searchParams, isAdmin, requireAuth]);

  const setActiveTab = useCallback((tab: ConfigTabId) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Redirect if on admin-only tab without permission
  useEffect(() => {
    const tab = TABS.find((t) => t.id === activeTab);
    if (tab?.adminOnly && !isAdmin) {
      setActiveTab('whisper');
    }
  }, [isAdmin, activeTab, setActiveTab]);

  const contextValue = useMemo(
    () => ({
      ...configState,
      activeTab,
      setActiveTab,
      isAdmin,
      showSecurityControls,
    }),
    [configState, activeTab, setActiveTab, isAdmin, showSecurityControls]
  );

  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === 'users' && !requireAuth) return false;
    return !tab.adminOnly || isAdmin;
  });

  if (configState.isLoading || !configState.pending) {
    return <div className="text-sm text-gray-700 dark:text-gray-300">Loading configuration...</div>;
  }

  return (
    <ConfigContext.Provider value={contextValue}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Configuration</h2>
        </div>

        {/* Connection status — always visible regardless of active tab */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ConnectionStatusCard
            title="Whisper"
            subtitle="· Transcription"
            status={configState.whisperStatus.status}
            message={configState.whisperStatus.message}
            error={configState.whisperStatus.error}
            onRetry={() => void configState.probeConnections()}
          />
          <ConnectionStatusCard
            title="LLM"
            subtitle="· Ad Identification"
            status={configState.llmStatus.status}
            message={configState.llmStatus.message}
            error={configState.llmStatus.error}
            onRetry={() => void configState.probeConnections()}
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-8 min-w-max" aria-label="Config tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'llm' && <LLMSection />}
          {activeTab === 'whisper' && <WhisperSection />}
          {activeTab === 'output' && <OutputSection />}
          {activeTab === 'app' && <AppSection />}
          {activeTab === 'prompts' && <PromptSection />}
          {activeTab === 'users' && isAdmin && <UserManagementTab />}
        </div>

        {/* Env Warning Modal */}
        {configState.showEnvWarning && configState.envWarningPaths.length > 0 && (
          <EnvOverrideWarningModal
            paths={configState.envWarningPaths}
            overrides={configState.envOverrides}
            onCancel={configState.handleDismissEnvWarning}
            onConfirm={configState.handleConfirmEnvWarning}
          />
        )}

        {/* Extra padding to prevent audio player overlay from obscuring bottom settings */}
        <div className="h-24"></div>
      </div>
    </ConfigContext.Provider>
  );
}
