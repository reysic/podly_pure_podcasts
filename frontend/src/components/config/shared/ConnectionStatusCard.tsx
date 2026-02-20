interface ConnectionStatusCardProps {
  title: string;
  subtitle: string;
  status: 'loading' | 'ok' | 'error';
  message: string;
  error?: string;
  onRetry: () => void;
}

const cfg = {
  loading: {
    border: 'border-l-gray-300 dark:border-l-gray-600',
    bg: 'bg-white dark:bg-gray-800',
    dotColor: 'bg-gray-400',
    textColor: 'text-gray-500 dark:text-gray-400',
    icon: (
      <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    ),
  },
  ok: {
    border: 'border-l-green-500',
    bg: 'bg-green-50/40 dark:bg-green-900/10',
    dotColor: 'bg-green-500',
    textColor: 'text-green-700 dark:text-green-400',
    icon: (
      <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    border: 'border-l-red-500',
    bg: 'bg-red-50/40 dark:bg-red-900/10',
    dotColor: 'bg-red-500',
    textColor: 'text-red-700 dark:text-red-400',
    icon: (
      <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

export default function ConnectionStatusCard({
  title,
  subtitle,
  status,
  message,
  error,
  onRetry,
}: ConnectionStatusCardProps) {
  const s = cfg[status];

  const displayMessage =
    status === 'loading'
      ? 'Testing connection…'
      : status === 'ok'
        ? message || `${title} connected`
        : error || `${title} connection failed`;

  return (
    <div className={`flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 ${s.border} ${s.bg} px-4 py-3`}>
      <div className="mt-0.5 shrink-0">{s.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</span>
        </div>
        <p className={`text-xs mt-0.5 truncate ${s.textColor}`}>{displayMessage}</p>
      </div>
      <button
        type="button"
        className="shrink-0 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline mt-0.5"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}
