/** 표시 포맷 유틸 (Tabular Numbers 전제) */

export function formatYield(y: number | null | undefined): string {
  if (y == null || Number.isNaN(y)) return '—';
  return `${y.toFixed(3)}%`;
}

export function formatPrice(p: number | null | undefined, digits = 1): string {
  if (p == null || Number.isNaN(p)) return '—';
  return p.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatBp(bp: number | null | undefined): string {
  if (bp == null || Number.isNaN(bp)) return '—';
  const sign = bp > 0 ? '▲' : bp < 0 ? '▼' : '';
  return `${sign} ${Math.abs(bp).toFixed(1)}bp`;
}

export function formatMoney(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return Math.round(v).toLocaleString('ko-KR');
}

export function formatPercent(v: number | null | undefined, digits = 3): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(digits)}%`;
}

/** 잔존만기 라벨 (평가일~만기일) */
export function formatRemaining(days: number | null | undefined): string {
  if (days == null || days < 0) return '—';
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  const d = days % 30;
  if (y > 0) return `${y}년 ${m}개월`;
  if (m > 0) return `${m}개월 ${d}일`;
  return `${d}일`;
}
