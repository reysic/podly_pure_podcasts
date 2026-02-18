import type { EnvOverrideMap } from '../../../types';
import { ENV_FIELD_LABELS } from './constants';

interface EnvOverrideWarningModalProps {
  paths: string[];
  overrides: EnvOverrideMap;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EnvOverrideWarningModal({
  paths,
  overrides,
  onConfirm,
  onCancel,
}: EnvOverrideWarningModalProps) {
  if (!paths.length) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2 sm:px-4 py-4 sm:py-6">
      <div className="w-full max-w-lg space-y-3 sm:space-y-4 rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-xl max-h-[95vh] overflow-y-auto">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">Environment-managed settings</h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            These fields are controlled by environment variables. Update the referenced variables in your
            <code className="mx-1 font-mono text-xs">env</code>
            (or deployment secrets) to make the change persistent. Your manual change will be saved, but will be overwritten if you modify your environment variables in the future.
          </p>
        </div>
        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
          {paths.map((path) => {
            const meta = overrides[path];
            const label = ENV_FIELD_LABELS[path] ?? path;
            return (
              <li key={path} className="rounded border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-2 sm:p-3">
                <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
                {meta?.env_var ? (
                  <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                    Managed by <code className="font-mono">{meta.env_var}</code>
                    {meta?.value_preview && (
                      <span className="ml-1 text-gray-600 dark:text-gray-400">({meta.value_preview})</span>
                    )}
                    {!meta?.value_preview && meta?.value && (
                      <span className="ml-1 text-gray-600 dark:text-gray-400">({meta.value})</span>
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">Managed by deployment environment</p>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 w-full sm:w-auto"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-sm font-semibold text-white w-full sm:w-auto"
          >
            Save anyway
          </button>
        </div>
      </div>
    </div>
  );
}
