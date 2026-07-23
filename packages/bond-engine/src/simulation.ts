import type { CouponFrequency, DayCount, EngineBondType, PricingResult } from './types.js';
import { priceBond } from './pricing.js';
import { diffDays, parseDate } from './daycount.js';
import { generateSchedule, type ScheduleContext } from './cashflows.js';

export interface SimBond {
  bondType: EngineBondType;
  faceValue?: number;
  issueDate: string;
  maturityDate: string;
  couponRate?: number | null;
  couponFrequency?: CouponFrequency;
  dayCount: DayCount;
  redemptionRate?: number;
}

export interface SimSide {
  valuationDate: string;
  marketYield: number; // 연 %
  fx?: number; // 환율 (원화 1.0)
}

export type TaxBase = 'INCOME' | 'INCOME_AND_CAPITAL' | 'TOTAL';

export interface SimInput {
  bond: SimBond;
  a: SimSide;
  b: SimSide;
  quantity: number; // 기준액면 단위 좌수
  buyCost?: number;
  sellCost?: number;
  otherCost?: number;
  taxRate?: number; // 사용자 설정 세율 %
  taxBase?: TaxBase; // 과세 대상 (자동판정 아님)
}

export interface IncomeCashflow {
  paymentDate: string;
  principal: number;
  interest: number;
  total: number;
}

export interface SimResult {
  aPricing: PricingResult;
  bPricing: PricingResult;
  initialInvestment: number;
  proceeds: number;
  incomeGain: number;
  capitalGain: number;
  fxGain: number;
  costs: number;
  tax: number;
  totalProfit: number;
  tr: number; // Total Return
  cagr: number;
  bepYield: number | null; // 손익분기 B수익률
  holdingDays: number;
  incomeCashflows: IncomeCashflow[];
}

function pricingFor(bond: SimBond, side: SimSide): PricingResult {
  return priceBond({
    bondType: bond.bondType,
    faceValue: bond.faceValue ?? 10000,
    issueDate: bond.issueDate,
    maturityDate: bond.maturityDate,
    valuationDate: side.valuationDate,
    couponRate: bond.couponRate ?? 0,
    marketYield: side.marketYield,
    couponFrequency: bond.couponFrequency ?? 1,
    dayCount: bond.dayCount,
    redemptionRate: bond.redemptionRate ?? 100,
  });
}

/** A~B 보유기간 중 수취하는 현금흐름 (A 이후 ~ B 이하) */
function incomeBetween(bond: SimBond, aDate: string, bDate: string): IncomeCashflow[] {
  const ctx: ScheduleContext = {
    bondType: bond.bondType,
    faceValue: bond.faceValue ?? 10000,
    couponRate: bond.couponRate ?? 0,
    couponFrequency: bond.couponFrequency ?? 1,
    redemptionRate: bond.redemptionRate ?? 100,
    issueDate: bond.issueDate,
    maturityDate: bond.maturityDate,
    dayCount: bond.dayCount,
  };
  const a = parseDate(aDate).getTime();
  const b = parseDate(bDate).getTime();
  return generateSchedule(ctx)
    .filter((cf) => {
      const t = parseDate(cf.paymentDate).getTime();
      return t > a && t <= b;
    })
    .map((cf) => ({
      paymentDate: cf.paymentDate,
      principal: cf.principal,
      interest: cf.interest,
      total: cf.principal + cf.interest,
    }));
}

function computeProfit(
  input: SimInput,
  bYieldOverride?: number,
): SimResult {
  const { bond, a, quantity } = input;
  const b = bYieldOverride == null ? input.b : { ...input.b, marketYield: bYieldOverride };
  const afx = a.fx ?? 1;
  const bfx = b.fx ?? 1;

  const aPricing = pricingFor(bond, a);
  const bPricing = pricingFor(bond, b);

  const income = incomeBetween(bond, a.valuationDate, b.valuationDate);
  // 현금흐름은 기준액면(예:10,000)당 금액 → 좌수를 곱해 보유기간 수취액(원화) 산출
  const incomePerUnit = income.reduce((s, cf) => s + cf.total, 0);
  const incomeGainKRW = incomePerUnit * quantity * bfx;

  const initialInvestment = aPricing.dirtyPrice * quantity * afx;
  const proceeds = bPricing.dirtyPrice * quantity * bfx;
  const capitalGain = (bPricing.cleanPrice - aPricing.cleanPrice) * quantity * bfx;
  const fxGain = aPricing.dirtyPrice * quantity * (bfx - afx);

  const costs = (input.buyCost ?? 0) + (input.sellCost ?? 0) + (input.otherCost ?? 0);

  const taxRate = (input.taxRate ?? 0) / 100;
  const taxBase = input.taxBase ?? 'INCOME';
  let taxableBase: number;
  if (taxBase === 'INCOME') taxableBase = incomeGainKRW;
  else if (taxBase === 'INCOME_AND_CAPITAL') taxableBase = incomeGainKRW + Math.max(0, capitalGain);
  else taxableBase = Math.max(0, incomeGainKRW + capitalGain + fxGain);
  const tax = Math.max(0, taxableBase * taxRate);

  const totalProfit = incomeGainKRW + capitalGain + fxGain - costs - tax;
  const tr = initialInvestment !== 0 ? totalProfit / initialInvestment : 0;

  const holdingDays = Math.max(1, diffDays(parseDate(a.valuationDate), parseDate(b.valuationDate)));
  const finalValue = initialInvestment + totalProfit;
  const cagr =
    initialInvestment > 0 && finalValue > 0
      ? (finalValue / initialInvestment) ** (365 / holdingDays) - 1
      : 0;

  return {
    aPricing,
    bPricing,
    initialInvestment,
    proceeds,
    incomeGain: incomeGainKRW,
    capitalGain,
    fxGain,
    costs,
    tax,
    totalProfit,
    tr,
    cagr,
    bepYield: null,
    holdingDays,
    incomeCashflows: income,
  };
}

/** 손익분기 B수익률: totalProfit = 0 이 되는 B시점 수익률 (이분법) */
function solveBep(input: SimInput): number | null {
  const f = (y: number) => computeProfit(input, y).totalProfit;
  let lo = -5;
  let hi = 30;
  let flo = f(lo);
  let fhi = f(hi);
  if (Number.isNaN(flo) || Number.isNaN(fhi)) return null;
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  if (flo * fhi > 0) return null; // 구간 내 부호변화 없음
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fmid = f(mid);
    if (Math.abs(fmid) < 1e-6 || hi - lo < 1e-7) return Number(mid.toFixed(3));
    if (flo * fmid < 0) {
      hi = mid;
      fhi = fmid;
    } else {
      lo = mid;
      flo = fmid;
    }
  }
  return Number(((lo + hi) / 2).toFixed(3));
}

export function simulate(input: SimInput): SimResult {
  const base = computeProfit(input);
  base.bepYield = solveBep(input);
  return base;
}

export interface SensitivityRow {
  bpOffset: number;
  bYield: number;
  expectedCleanPrice: number;
  capitalGain: number;
  totalReturn: number;
  cagr: number;
  afterTaxReturn: number;
}

/** B수익률 -100bp ~ +100bp (25bp 간격) 민감도 */
export function sensitivity(
  input: SimInput,
  offsetsBp: number[] = [-100, -75, -50, -25, 0, 25, 50, 75, 100],
): SensitivityRow[] {
  return offsetsBp.map((bp) => {
    const bYield = input.b.marketYield + bp / 100;
    const r = computeProfit(input, bYield);
    const afterTaxReturn =
      r.initialInvestment !== 0 ? r.totalProfit / r.initialInvestment : 0;
    return {
      bpOffset: bp,
      bYield: Number(bYield.toFixed(3)),
      expectedCleanPrice: r.bPricing.cleanPrice,
      capitalGain: Number(r.capitalGain.toFixed(2)),
      totalReturn: Number((r.tr * 100).toFixed(3)),
      cagr: Number((r.cagr * 100).toFixed(3)),
      afterTaxReturn: Number((afterTaxReturn * 100).toFixed(3)),
    };
  });
}
