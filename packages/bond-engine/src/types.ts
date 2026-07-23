/** bond-engine 입출력 타입 (외부 상태 비의존, 순수) */

export type EngineBondType = 'DISCOUNT' | 'FIXED_COUPON' | 'SIMPLE_COMPOUND' | 'COMPOUND';
export type DayCount = 'ACT_365' | 'ACT_ACT' | 'ACT_360' | '30_360';
export type CouponFrequency = 1 | 2 | 4 | 12;

export interface RoundingRule {
  mode: 'truncate' | 'round';
  digits: number;
}

export interface PricingInput {
  /** 기준 액면 (기본 10,000) */
  faceValue?: number;
  bondType: EngineBondType;

  issueDate: string; // yyyy-mm-dd
  maturityDate: string;
  valuationDate: string;

  /** 표면금리 (연 %). 할인채는 생략/0 가능 */
  couponRate?: number | null;
  /** 시장수익률 (연 %) */
  marketYield: number;
  /** 연 이자지급 횟수 */
  couponFrequency?: CouponFrequency;
  dayCount: DayCount;
  /** 상환율 (통상 100) */
  redemptionRate?: number;

  /** 절사·반올림 규칙 */
  priceRounding?: RoundingRule;
  accruedRounding?: RoundingRule;
}

export interface CashflowRow {
  paymentDate: string;
  principal: number;
  interest: number;
  total: number;
  /** 평가일로부터 잔존연수 */
  timeYears: number;
  discountFactor: number;
  presentValue: number;
}

export interface PricingResult {
  pricingFaceValue: number;
  cleanPrice: number;
  dirtyPrice: number;
  accruedInterest: number;

  /** 평가일~만기 잔존일수 / 연수 */
  remainingDays: number;
  remainingYears: number;

  cashflows: CashflowRow[];
  appliedRules: string[];
  warnings: string[];
}
