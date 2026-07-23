import type { DayCount } from './types.js';

const MS_PER_DAY = 86_400_000;

/** yyyy-mm-dd → UTC Date (시각 무시) */
export function parseDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new Error(`INVALID_DATE: ${iso}`);
  const [, y, mo, d] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (Number.isNaN(date.getTime())) throw new Error(`INVALID_DATE: ${iso}`);
  return date;
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 실제 경과일수 (d2 - d1) */
export function diffDays(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / MS_PER_DAY);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function addMonths(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const target = new Date(Date.UTC(y, m + months, 1));
  // 말일 보정 (예: 1/31 - 1개월 → 그 달 마지막 날)
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target;
}

/**
 * 두 날짜 사이 연수(year fraction). Day Count 규칙별.
 * ACT_ACT 은 ISDA 방식(연도별 실제일수로 분할)으로 윤년을 반영한다.
 */
export function yearFraction(d1: Date, d2: Date, dayCount: DayCount): number {
  if (d2.getTime() <= d1.getTime()) return 0;
  switch (dayCount) {
    case 'ACT_365':
      return diffDays(d1, d2) / 365;
    case 'ACT_360':
      return diffDays(d1, d2) / 360;
    case '30_360': {
      const y1 = d1.getUTCFullYear();
      const y2 = d2.getUTCFullYear();
      const m1 = d1.getUTCMonth() + 1;
      const m2 = d2.getUTCMonth() + 1;
      let dd1 = d1.getUTCDate();
      let dd2 = d2.getUTCDate();
      if (dd1 === 31) dd1 = 30;
      if (dd2 === 31 && dd1 === 30) dd2 = 30;
      return (360 * (y2 - y1) + 30 * (m2 - m1) + (dd2 - dd1)) / 360;
    }
    case 'ACT_ACT': {
      // ISDA: 연도 경계로 분할해 각 연도의 실제일수(365/366)로 나눈다.
      let total = 0;
      const startYear = d1.getUTCFullYear();
      const endYear = d2.getUTCFullYear();
      for (let y = startYear; y <= endYear; y++) {
        const yearStart = new Date(Date.UTC(y, 0, 1));
        const yearEnd = new Date(Date.UTC(y + 1, 0, 1));
        const segStart = d1.getTime() > yearStart.getTime() ? d1 : yearStart;
        const segEnd = d2.getTime() < yearEnd.getTime() ? d2 : yearEnd;
        if (segEnd.getTime() <= segStart.getTime()) continue;
        const daysInYear = isLeapYear(y) ? 366 : 365;
        total += diffDays(segStart, segEnd) / daysInYear;
      }
      return total;
    }
    default:
      return diffDays(d1, d2) / 365;
  }
}
