import { useEffect, useState } from 'react';
import { useConfigContext } from '../ConfigContext';
import { Section, Field, SaveButton } from '../shared';
import { backupApi, type BackupStatus } from '../../../services/api';

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AppSection() {
  const { pending, setField, handleSave, isSaving } = useConfigContext();

  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    backupApi.getStatus().then(setBackupStatus).catch(console.error);
  }, []);

  async function handleBackupNow() {
    setIsBackingUp(true);
    setBackupMessage(null);
    try {
      const result = await backupApi.runBackup();
      if (result.ok) {
        setBackupMessage({ ok: true, text: 'Backup completed successfully.' });
        const updated = await backupApi.getStatus();
        setBackupStatus(updated);
      } else {
        setBackupMessage({ ok: false, text: result.error ?? 'Backup failed.' });
      }
    } catch {
      setBackupMessage({ ok: false, text: 'Backup request failed.' });
    } finally {
      setIsBackingUp(false);
    }
  }

  if (!pending) return null;

  return (
    <div className="space-y-6">
      <Section title="App">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Feed Refresh Interval (min)"
            hint="How often Podly polls your subscribed RSS feeds for new episodes, in minutes."
          >
            <input
              className="input"
              type="number"
              value={pending?.app?.background_update_interval_minute ?? ''}
              onChange={(e) =>
                setField(
                  ['app', 'background_update_interval_minute'],
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
            />
          </Field>
          <Field
            label="Cleanup Retention (days)"
            hint="Processed audio files older than this many days are automatically deleted. Set to 0 to keep files indefinitely."
          >
            <input
              className="input"
              type="number"
              min={0}
              value={pending?.app?.post_cleanup_retention_days ?? ''}
              onChange={(e) =>
                setField(
                  ['app', 'post_cleanup_retention_days'],
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
            />
          </Field>
          <Field
            label="Auto-whitelist new episodes"
            hint="When a new episode is detected in a subscribed feed, automatically queue it for ad removal processing."
          >
            <input
              type="checkbox"
              checked={!!pending?.app?.automatically_whitelist_new_episodes}
              onChange={(e) =>
                setField(['app', 'automatically_whitelist_new_episodes'], e.target.checked)
              }
            />
          </Field>
          <Field
            label="Autoprocess on download"
            hint="Include all feed episodes in the RSS output. When a client downloads an unprocessed episode, trigger ad removal processing automatically."
          >
            <input
              type="checkbox"
              checked={!!pending?.app?.autoprocess_on_download}
              onChange={(e) => setField(['app', 'autoprocess_on_download'], e.target.checked)}
            />
          </Field>
          <Field
            label="Archive episodes on new feed"
            hint="When you subscribe to a new feed, this many of the most recent existing episodes are immediately whitelisted and queued for processing."
          >
            <input
              className="input"
              type="number"
              value={pending?.app?.number_of_episodes_to_whitelist_from_archive_of_new_feed ?? 1}
              onChange={(e) =>
                setField(
                  ['app', 'number_of_episodes_to_whitelist_from_archive_of_new_feed'],
                  Number(e.target.value)
                )
              }
            />
          </Field>
          <Field
            label="Enable public landing page"
            hint="Show a public landing page to unauthenticated visitors instead of redirecting them to the login screen."
          >
            <input
              type="checkbox"
              checked={!!pending?.app?.enable_public_landing_page}
              onChange={(e) => setField(['app', 'enable_public_landing_page'], e.target.checked)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Database Backup">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Enable automatic backups"
            hint="Automatically back up the SQLite database on a recurring schedule."
          >
            <input
              type="checkbox"
              checked={!!pending?.app?.db_backup_enabled}
              onChange={(e) => setField(['app', 'db_backup_enabled'], e.target.checked)}
            />
          </Field>
          <Field
            label="Backup interval (hours)"
            hint="How often to create a scheduled backup. Only takes effect when automatic backups are enabled."
          >
            <input
              className="input"
              type="number"
              min={1}
              disabled={!pending?.app?.db_backup_enabled}
              value={pending?.app?.db_backup_interval_hours ?? 24}
              onChange={(e) =>
                setField(['app', 'db_backup_interval_hours'], Number(e.target.value))
              }
            />
          </Field>
          <Field
            label="Backups to retain"
            hint="Number of most-recent backup files to keep. Older backups are automatically deleted."
          >
            <input
              className="input"
              type="number"
              min={1}
              value={pending?.app?.db_backup_retention_count ?? 7}
              onChange={(e) =>
                setField(['app', 'db_backup_retention_count'], Number(e.target.value))
              }
            />
          </Field>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
            {backupStatus ? (
              <>
                <span className="font-medium text-gray-700 dark:text-gray-300">Last backup: </span>
                {backupStatus.last_success_at ? (
                  <span title={new Date(backupStatus.last_success_at).toLocaleString()}>
                    {formatRelativeTime(backupStatus.last_success_at)}
                  </span>
                ) : (
                  <span className="italic">Never</span>
                )}
                <span className="ml-3 text-gray-400 dark:text-gray-500">
                  ({backupStatus.backup_count} file{backupStatus.backup_count !== 1 ? 's' : ''} stored)
                </span>
              </>
            ) : (
              <span className="italic text-gray-400">Loading backup info…</span>
            )}
          </div>
          <button
            type="button"
            disabled={isBackingUp}
            onClick={handleBackupNow}
            className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
          >
            {isBackingUp ? 'Backing up…' : 'Backup Now'}
          </button>
        </div>

        {backupMessage && (
          <p
            className={`mt-2 text-sm ${backupMessage.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {backupMessage.text}
          </p>
        )}
      </Section>

      <SaveButton onSave={handleSave} isPending={isSaving} />
    </div>
  );
}

