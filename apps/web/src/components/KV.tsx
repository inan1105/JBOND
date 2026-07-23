import React from 'react';

export function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-gray-50 py-1.5 last:border-0">
      <span className="text-[12px] text-gray-500">{label}</span>
      <span className="tabular-nums text-[13px] font-medium text-gray-900">{value}</span>
    </div>
  );
}
