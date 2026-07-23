import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function EmptyState({ message = '데이터가 없습니다' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
      <span className="text-3xl">—</span>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({
  message = '문제가 발생했습니다',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm text-gray-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-[44px] rounded-lg bg-gray-900 px-4 text-sm font-medium text-white"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

/** 오래된/오프라인 마지막 조회 배너 */
export function StaleBanner({ asOf, source }: { asOf?: string; source?: string }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
      원천 지연 또는 오프라인. 마지막 정상 데이터 표시 중{asOf ? ` · 기준 ${asOf}` : ''}
      {source ? ` · ${source}` : ''}
    </div>
  );
}
