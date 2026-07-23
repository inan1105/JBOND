import React from 'react';

export function StatCard({
  label,
  value,
  sub,
  emphasis,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  emphasis?: boolean;
  tone?: 'default' | 'gold' | 'up' | 'down';
}) {
  const toneClass =
    tone === 'gold'
      ? 'text-[#C9A227]'
      : tone === 'up'
        ? 'text-red-600'
        : tone === 'down'
          ? 'text-blue-600'
          : 'text-gray-900';
  return (
    <div className="flex flex-col rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span
        className={`tabular-nums font-semibold ${emphasis ? 'text-xl' : 'text-lg'} ${toneClass}`}
      >
        {value}
      </span>
      {sub != null && <span className="mt-0.5 text-[11px] text-gray-400">{sub}</span>}
    </div>
  );
}
