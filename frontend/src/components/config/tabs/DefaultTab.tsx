import { useConfigContext } from '../ConfigContext';
import { Section, ConnectionStatusCard } from '../shared';

export default function DefaultTab() {
  const {
    llmStatus,
    whisperStatus,
    probeConnections,
  } = useConfigContext();

  return (
    <div className="space-y-6">
      <Section title="Connection Status">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ConnectionStatusCard
            title="LLM"
            status={llmStatus.status}
            message={llmStatus.message}
            error={llmStatus.error}
            onRetry={() => void probeConnections()}
          />
          <ConnectionStatusCard
            title="Whisper"
            status={whisperStatus.status}
            message={whisperStatus.message}
            error={whisperStatus.error}
            onRetry={() => void probeConnections()}
          />
        </div>
      </Section>
    </div>
  );
}
