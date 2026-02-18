import type { ReactNode } from 'react';
import type { EnvOverrideEntry } from '../../../types';
import EnvVarHint from './EnvVarHint';

interface FieldProps {
  label: string;
  children: ReactNode;
  envMeta?: EnvOverrideEntry;
  labelWidth?: string;
  hint?: string;
}

export default function Field({
  label,
  children,
  envMeta,
  labelWidth = 'w-60',
  hint,
}: FieldProps) {
  return (
    <label className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
      <div className={`sm:${labelWidth}`}>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {hint ? <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</span> : null}
        <EnvVarHint meta={envMeta} />
      </div>
      <div className="flex-1 w-full sm:w-auto">{children}</div>
    </label>
  );
}
