import type { CashflowRow, CouponFrequency, PricingInput, PricingResult } from './types.js';
import { diffDays, parseDate, yearFraction } from './daycount.js';
import { applyRounding, DEFAULT_ACCRUED_ROUNDING, DEFAULT_PRICE_ROUNDING } from './rounding.js';
import { accruedInterest, generateSchedule, type ScheduleContext } from './cashflows.js';

const VALID_FREQ: CouponFrequency[] = [1, 2, 4, 12];

export class PricingError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = 'PricingError';
  }
}

function requireFinite(name: string, v: number): void {
  if (typeof v !== 'number' || Number.isNaN(v) || !Number.isFinite(v)) {
    throw new PricingError('NON_FINITE', `${name} 값이 NaN/Infinity 입니다.`);
  }
}

function validate(input: PricingInput): { warnings: string[] } {
  const warnings: string[] = [];
  const issue = parseDate(input.issueDate);
  const maturity = parseDate(input.maturityDate);
  const val = parseDate(input.valuationDate);

  if (maturity.getTime() <= issue.getTime()) {
    throw new PricingError('MATURITY_BEFORE_ISSUE', '만기일은 발행일보다 이후여야 합니다.');
  }
  if (val.getTime() > maturity.getTime()) {
    throw new PricingError('VALUATION_AFTER_MATURITY', '평가일은 만기일 이전이어야 합니다.');
  }
  if (val.getTime() < issue.getTime()) {
    warnings.push('평가일이 발행일 이전입니다. 발행 전 이론가로 계산됩니다.');
  }

  requireFinite('marketYield', input.marketYield);
  if (input.couponRate != null) requireFinite('couponRate', input.couponRate);

  const f = input.couponFrequency ?? 1;
  if (!VALID_FREQ.includes(f)) {
    throw new PricingError('INVALID_FREQUENCY', `지급횟수(${f})가 유효하지 않습니다. (1,2,4,12)`);
  }

  const y = input.marketYield / 100;
  if (1 + y / f <= 0) {
    throw new PricingError('INVALID_DISCOUNT_BASE', '1 + y/f 는 0보다 커야 합니다.');
  }

  if (input.bondType !== 'DISCOUNT' && (input.couponRate == null || input.couponRate === 0)) {
    warnings.push('표면금리가 0 또는 미지정입니다. 이자 현금흐름이 없습니다.');
  }
  return { warnings };
}

/**
 * 채권단가 계산 엔진 (순수 함수).
 * P = Σ CFt / (1 + y/f)^(f×t)
 */
export function priceBond(input: PricingInput): PricingResult {
  const { warnings } = validate(input);

  const face = input.faceValue ?? 10000;
  const f = (input.couponFrequency ?? 1) as CouponFrequency;
  const redemptionRate = input.redemptionRate ?? 100;
  const couponRate = input.couponRate ?? 0;
  const priceRounding = input.priceRounding ?? DEFAULT_PRICE_ROUNDING;
  const accruedRounding = input.accruedRounding ?? DEFAULT_ACCRUED_ROUNDING;

  const ctx: ScheduleContext = {
    bondType: input.bondType,
    faceValue: face,
    couponRate,
    couponFrequency: f,
    redemptionRate,
    issueDate: input.issueDate,
    maturityDate: input.maturityDate,
    dayCount: input.dayCount,
  };

  const val = parseDate(input.valuationDate);
  const maturity = parseDate(input.maturityDate);
  const remainingDays = Math.max(0, diffDays(val, maturity));
  const remainingYears = yearFraction(val, maturity, input.dayCount);

  const schedule = generateSchedule(ctx);
  const y = input.marketYield / 100;

  const appliedRules: string[] = [
    `DayCount=${input.dayCount}`,
    `f=${f}`,
    `P = Σ CF/(1+y/f)^(f·t)`,
    `priceRounding=${priceRounding.mode}@${priceRounding.digits}`,
    `accruedRounding=${accruedRounding.mode}@${accruedRounding.digits}`,
  ];

  // 미래 현금흐름만 할인 (평가일 이후)
  const cashflows: CashflowRow[] = [];
  let dirtyRaw = 0;
  for (const cf of schedule) {
    const payDate = parseDate(cf.paymentDate);
    if (payDate.getTime() <= val.getTime()) continue; // 이미 지난 지급
    const t = yearFraction(val, payDate, input.dayCount);
    const discountFactor = 1 / (1 + y / f) ** (f * t);
    const total = cf.principal + cf.interest;
    const pv = total * discountFactor;
    dirtyRaw += pv;
    cashflows.push({
      paymentDate: cf.paymentDate,
      principal: cf.principal,
      interest: cf.interest,
      total,
      timeYears: Number(t.toFixed(6)),
      discountFactor: Number(discountFactor.toFixed(8)),
      presentValue: pv,
    });
  }

  // 윤년 안내
  if (input.dayCount === 'ACT_ACT') appliedRules.push('윤년: 연도별 실제일수(365/366) 반영');
  if (remainingYears < 1) appliedRules.push('잔존 1tenor 미만: 실제 기간일수로 계산');

  const accruedRaw = accruedInterest(ctx, input.valuationDate);
  const accrued = applyRounding(accruedRaw, accruedRounding);

  // Dirty(현재가치 총합) 절사 → Clean = Dirty - 경과이자
  const dirtyPrice = applyRounding(dirtyRaw, priceRounding);
  const cleanPrice = applyRounding(dirtyPrice - accrued, priceRounding);

  if (cashflows.length === 0) {
    warnings.push('평가일 이후 남은 현금흐름이 없습니다.');
  }

  return {
    pricingFaceValue: face,
    cleanPrice,
    dirtyPrice,
    accruedInterest: accrued,
    remainingDays,
    remainingYears: Number(remainingYears.toFixed(6)),
    cashflows,
    appliedRules,
    warnings,
  };
}
