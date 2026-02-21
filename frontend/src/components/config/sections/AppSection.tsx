import { useConfigContext } from '../ConfigContext';
import { Section, Field, SaveButton } from '../shared';

export default function AppSection() {
  const { pending, setField, handleSave, isSaving } = useConfigContext();

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

      <SaveButton onSave={handleSave} isPending={isSaving} />
    </div>
  );
}
