import React from 'react';

export type BadgeTone = 'actual' | 'mtm' | 'quote' | 'issue' | 'interp' | 'user' | 'neutral';

const TONE_CLASS: Record<BadgeTone, string> = {
  actual: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  mtm: 'bg-amber-100 text-amber-800 border-amber-300',
  quote: 'bg-sky-100 text-sky-800 border-sky-300',
  issue: 'bg-violet-100 text-violet-800 border-violet-300',
  interp: 'bg-gray-100 text-gray-500 border-gray-300 border-dashed',
  user: 'bg-pink-100 text-pink-800 border-pink-300',
  neutral: 'bg-gray-100 text-gray-600 border-gray-300',
};

export function Badge({
  children,
  tone = 'neutral',
  title,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

/** valueType → 배지 */
const VALUE_TYPE_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  ACTUAL_TRADE: { label: '실거래', tone: 'actual' },
  MARK_TO_MARKET: { label: '시가평가', tone: 'mtm' },
  FINAL_QUOTE: { label: '최종호가', tone: 'quote' },
  ISSUE_YIELD: { label: '발행', tone: 'issue' },
  INTERPOLATED: { label: '보간', tone: 'interp' },
  USER_INPUT: { label: '사용자', tone: 'user' },
};

export function ValueTypeBadge({ valueType }: { valueType: string }) {
  const meta = VALUE_TYPE_LABEL[valueType] ?? { label: valueType, tone: 'neutral' as BadgeTone };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function SourceBadge({ source }: { source: string }) {
  return <Badge tone="neutral" title="데이터 출처">{source}</Badge>;
}

export function QualityBadge({ status }: { status: string }) {
  const map: Record<string, BadgeTone> = {
    VALID: 'actual',
    STALE: 'quote',
    ESTIMATED: 'interp',
    MISSING: 'neutral',
  };
  const label: Record<string, string> = {
    VALID: '정상',
    STALE: '지연',
    ESTIMATED: '추정',
    MISSING: '결측',
  };
  return <Badge tone={map[status] ?? 'neutral'}>{label[status] ?? status}</Badge>;
}
