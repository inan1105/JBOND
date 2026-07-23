import type { CouponFrequency, EngineBondType, DayCount } from './types.js';
import { addMonths, parseDate, toIso, yearFraction } from './daycount.js';

export interface RawCashflow {
  paymentDate: string;
  principal: number;
  interest: number;
}

export interface ScheduleContext {
  bondType: EngineBondType;
  faceValue: number;
  couponRate: number; // 연 %, 소수(예: 3.5 → 3.5)
  couponFrequency: CouponFrequency;
  redemptionRate: number; // %
  issueDate: string;
  maturityDate: string;
  dayCount: DayCount;
}

/**
 * 채권유형별 전체 현금흐름 생성 (발행일~만기 전 구간).
 * 할인/이표/단리/복리 지원. 상환은 만기일시(BULLET) 기준.
 */
export function generateSchedule(ctx: ScheduleContext): RawCashflow[] {
  const face = ctx.faceValue;
  const principalAtMaturity = (face * ctx.redemptionRate) / 100;
  const issue = parseDate(ctx.issueDate);
  const maturity = parseDate(ctx.maturityDate);
  const lifeYears = yearFraction(issue, maturity, ctx.dayCount);

  switch (ctx.bondType) {
    case 'DISCOUNT': {
      // 할인채: 이자 없음, 만기 원금상환만
      return [{ paymentDate: ctx.maturityDate, principal: principalAtMaturity, interest: 0 }];
    }

    case 'SIMPLE_COMPOUND': {
      // 단리채: 만기 일시 이자 = 액면 × 표면금리 × 잔존연수
      const interest = (face * (ctx.couponRate / 100)) * lifeYears;
      return [{ paymentDate: ctx.maturityDate, principal: principalAtMaturity, interest }];
    }

    case 'COMPOUND': {
      // 복리채: 만기 일시. 만기가치 = 액면 × (1 + r/f)^(f×N)
      const f = ctx.couponFrequency;
      const periods = f * lifeYears;
      const maturityValue = face * (1 + ctx.couponRate / 100 / f) ** periods;
      const interest = maturityValue - face;
      return [{ paymentDate: ctx.maturityDate, principal: principalAtMaturity, interest }];
    }

    case 'FIXED_COUPON': {
      // 고정 이표채: 만기부터 역산하여 지급일 생성
      const f = ctx.couponFrequency;
      const monthsPerPeriod = 12 / f;
      const periodCoupon = (face * (ctx.couponRate / 100)) / f;
      const dates: string[] = [];
      let cursor = maturity;
      // 발행일 이후 지급일만 수집
      while (cursor.getTime() > issue.getTime()) {
        dates.push(toIso(cursor));
        cursor = addMonths(cursor, -monthsPerPeriod);
      }
      dates.reverse(); // 오름차순
      return dates.map((d) => {
        const isMaturity = d === ctx.maturityDate;
        return {
          paymentDate: d,
          principal: isMaturity ? principalAtMaturity : 0,
          interest: periodCoupon,
        };
      });
    }

    default:
      return [];
  }
}

/**
 * 경과이자 (평가일 기준). 이표채만 실질적으로 존재.
 * 만기일시지급형(할인/단리/복리)은 중도 이표가 없으므로 0으로 본다 → Clean=Dirty.
 */
export function accruedInterest(
  ctx: ScheduleContext,
  valuationDate: string,
): number {
  if (ctx.bondType !== 'FIXED_COUPON') return 0;
  const f = ctx.couponFrequency;
  const monthsPerPeriod = 12 / f;
  const periodCoupon = (ctx.faceValue * (ctx.couponRate / 100)) / f;

  const val = parseDate(valuationDate);
  const issue = parseDate(ctx.issueDate);
  const maturity = parseDate(ctx.maturityDate);

  // 평가일이 속한 이표 구간 [prev, next) 탐색
  let next = maturity;
  let prev = addMonths(maturity, -monthsPerPeriod);
  while (prev.getTime() > val.getTime() && prev.getTime() > issue.getTime()) {
    next = prev;
    prev = addMonths(prev, -monthsPerPeriod);
  }
  if (prev.getTime() < issue.getTime()) prev = issue;
  if (val.getTime() <= prev.getTime()) return 0;

  const periodFrac = yearFraction(prev, next, ctx.dayCount);
  const accruedFrac = yearFraction(prev, val, ctx.dayCount);
  if (periodFrac <= 0) return 0;
  return periodCoupon * (accruedFrac / periodFrac);
}
