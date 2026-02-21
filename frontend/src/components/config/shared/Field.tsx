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
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {hint ? (
            <span className="relative group/hint cursor-default" onClick={(e) => e.preventDefault()}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-md bg-gray-900 dark:bg-gray-700 px-3 py-2 text-xs font-normal text-white shadow-lg opacity-0 group-hover/hint:opacity-100 transition-opacity z-50 text-left leading-relaxed whitespace-normal">
                {hint}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
              </span>
            </span>
          ) : null}
        </span>
        <EnvVarHint meta={envMeta} />
      </div>
      <div className="flex-1 w-full sm:w-auto">{children}</div>
    </label>
  );
}
