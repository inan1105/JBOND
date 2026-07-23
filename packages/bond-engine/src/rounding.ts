import type { RoundingRule } from './types.js';

/** 부동소수 잡음을 제거한 절사/반올림 */
export function applyRounding(value: number, rule: RoundingRule): number {
  const factor = 10 ** rule.digits;
  // 15자리로 먼저 정규화해 0.1 같은 이진 오차를 흡수
  const scaled = Number((value * factor).toPrecision(15));
  if (rule.mode === 'round') {
    return Math.round(scaled) / factor;
  }
  // truncate: 0 방향 절사 (금액은 양수 가정, 음수도 0 방향)
  return Math.trunc(scaled) / factor;
}

/** PRD 기본 계산 관행 */
export const DEFAULT_PRICE_ROUNDING: RoundingRule = { mode: 'truncate', digits: 1 };
export const DEFAULT_ACCRUED_ROUNDING: RoundingRule = { mode: 'truncate', digits: 1 };
