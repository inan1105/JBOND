import { describe, expect, it } from 'vitest';
import { simulate, sensitivity, type SimInput } from './simulation.js';

const input: SimInput = {
  bond: {
    bondType: 'FIXED_COUPON',
    faceValue: 10000,
    issueDate: '2023-01-01',
    maturityDate: '2028-01-01',
    couponRate: 4,
    couponFrequency: 2,
    dayCount: 'ACT_365',
    redemptionRate: 100,
  },
  a: { valuationDate: '2024-01-01', marketYield: 4, fx: 1 },
  b: { valuationDate: '2025-01-01', marketYield: 4, fx: 1 },
  quantity: 100,
  taxRate: 15.4,
  taxBase: 'INCOME',
};

describe('A/B 투자 시뮬레이션', () => {
  it('수익률 불변 시 Income Gain은 수취 이표의 합', () => {
    const r = simulate(input);
    // 1년 보유, 반기 4% → 이표 2회 = 액면당 400, 100좌 → 40,000
    expect(r.incomeGain).toBeGreaterThan(39000);
    expect(r.incomeGain).toBeLessThan(41000);
    expect(r.incomeCashflows.length).toBe(2);
  });

  it('B수익률 하락 → Capital Gain 양(+)', () => {
    const r = simulate({ ...input, b: { ...input.b, marketYield: 3 } });
    expect(r.capitalGain).toBeGreaterThan(0);
    expect(r.totalProfit).toBeGreaterThan(0);
  });

  it('B수익률 상승 → Capital Gain 음(-)', () => {
    const r = simulate({ ...input, b: { ...input.b, marketYield: 6 } });
    expect(r.capitalGain).toBeLessThan(0);
  });

  it('TR, CAGR, 보유일수 산출', () => {
    const r = simulate(input);
    expect(r.holdingDays).toBeGreaterThan(360);
    expect(Number.isFinite(r.tr)).toBe(true);
    expect(Number.isFinite(r.cagr)).toBe(true);
  });

  it('원화채권 FX Gain = 0', () => {
    const r = simulate(input);
    expect(r.fxGain).toBe(0);
  });

  it('외화채권 환율상승 시 FX Gain > 0', () => {
    const r = simulate({
      ...input,
      a: { ...input.a, fx: 1300 },
      b: { ...input.b, fx: 1400 },
    });
    expect(r.fxGain).toBeGreaterThan(0);
  });

  it('세율 적용 시 tax >= 0', () => {
    const r = simulate(input);
    expect(r.tax).toBeGreaterThanOrEqual(0);
  });

  it('BEP 수익률 산출(가능 시)', () => {
    const r = simulate({ ...input, b: { ...input.b, marketYield: 3 } });
    // 이익 구간이므로 BEP는 기준보다 높은 수익률(가격 하락)에 존재
    if (r.bepYield != null) {
      expect(r.bepYield).toBeGreaterThan(3);
    }
  });
});

describe('민감도 분석', () => {
  it('9개 시나리오(-100~+100bp)', () => {
    const rows = sensitivity(input);
    expect(rows).toHaveLength(9);
    expect(rows[0].bpOffset).toBe(-100);
    expect(rows[8].bpOffset).toBe(100);
  });

  it('수익률 하락 시 단가 상승(단조성)', () => {
    const rows = sensitivity(input);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].expectedCleanPrice).toBeLessThanOrEqual(rows[i - 1].expectedCleanPrice);
    }
  });
});
