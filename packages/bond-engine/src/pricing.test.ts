import { describe, expect, it } from 'vitest';
import { priceBond, PricingError } from './pricing.js';
import type { PricingInput } from './types.js';

const base: Omit<PricingInput, 'bondType'> = {
  faceValue: 10000,
  issueDate: '2024-01-01',
  maturityDate: '2027-01-01',
  valuationDate: '2024-01-01',
  couponRate: 3,
  marketYield: 3,
  couponFrequency: 2,
  dayCount: 'ACT_365',
  redemptionRate: 100,
};

describe('할인채 (DISCOUNT)', () => {
  it('만기 단일 현금흐름을 할인한다', () => {
    const r = priceBond({
      ...base,
      bondType: 'DISCOUNT',
      couponRate: 0,
      couponFrequency: 1,
      marketYield: 4,
      maturityDate: '2025-01-01',
    });
    expect(r.cashflows).toHaveLength(1);
    expect(r.cashflows[0].total).toBe(10000);
    // 1년, 4% → 10000/1.04 ≈ 9615.38
    expect(r.dirtyPrice).toBeGreaterThan(9600);
    expect(r.dirtyPrice).toBeLessThan(9620);
    // 할인채는 경과이자 없음 → clean == dirty
    expect(r.accruedInterest).toBe(0);
    expect(r.cleanPrice).toBe(r.dirtyPrice);
  });

  it('수익률 0에 가까우면 액면에 근접', () => {
    const r = priceBond({
      ...base,
      bondType: 'DISCOUNT',
      couponRate: 0,
      couponFrequency: 1,
      marketYield: 0.001,
      maturityDate: '2025-01-01',
    });
    expect(r.dirtyPrice).toBeGreaterThan(9999);
  });
});

describe('고정 이표채 (FIXED_COUPON)', () => {
  it('표면=시장수익률이면 액면(par) 근처', () => {
    const r = priceBond({ ...base, bondType: 'FIXED_COUPON', couponRate: 3, marketYield: 3 });
    // par 채권: dirty ≈ 10000 (발행일 평가, 경과이자 0)
    expect(r.accruedInterest).toBe(0);
    expect(Math.abs(r.dirtyPrice - 10000)).toBeLessThan(5);
  });

  it('시장수익률 > 표면금리 → 할인(가격<액면)', () => {
    const r = priceBond({ ...base, bondType: 'FIXED_COUPON', couponRate: 3, marketYield: 5 });
    expect(r.cleanPrice).toBeLessThan(10000);
  });

  it('시장수익률 < 표면금리 → 할증(가격>액면)', () => {
    const r = priceBond({ ...base, bondType: 'FIXED_COUPON', couponRate: 5, marketYield: 3 });
    expect(r.cleanPrice).toBeGreaterThan(10000);
  });

  it('반기 이표 3년 → 현금흐름 6개', () => {
    const r = priceBond({ ...base, bondType: 'FIXED_COUPON', couponFrequency: 2 });
    expect(r.cashflows).toHaveLength(6);
    // 마지막 CF에 원금 포함
    expect(r.cashflows[r.cashflows.length - 1].principal).toBe(10000);
  });

  it('이표 구간 중간 평가 시 경과이자 > 0, dirty > clean', () => {
    const r = priceBond({
      ...base,
      bondType: 'FIXED_COUPON',
      valuationDate: '2024-04-01', // 첫 이표(7/1) 이전
      marketYield: 3,
      couponRate: 3,
    });
    expect(r.accruedInterest).toBeGreaterThan(0);
    expect(r.dirtyPrice).toBeGreaterThan(r.cleanPrice);
  });
});

describe('단리채 (SIMPLE_COMPOUND)', () => {
  it('만기 일시 이자 = 액면×금리×연수', () => {
    const r = priceBond({
      ...base,
      bondType: 'SIMPLE_COMPOUND',
      couponRate: 3,
      couponFrequency: 1,
      marketYield: 3,
      issueDate: '2024-01-01',
      maturityDate: '2027-01-01',
    });
    expect(r.cashflows).toHaveLength(1);
    // 3년 단리 3% → 이자 ≈ 900, 원금 10000
    expect(r.cashflows[0].interest).toBeGreaterThan(890);
    expect(r.cashflows[0].interest).toBeLessThan(910);
    expect(r.cashflows[0].principal).toBe(10000);
  });
});

describe('복리채 (COMPOUND)', () => {
  it('만기가치가 단리채보다 크다', () => {
    const common = {
      ...base,
      couponRate: 3,
      couponFrequency: 1 as const,
      marketYield: 3,
      issueDate: '2024-01-01',
      maturityDate: '2029-01-01',
    };
    const simple = priceBond({ ...common, bondType: 'SIMPLE_COMPOUND' });
    const compound = priceBond({ ...common, bondType: 'COMPOUND' });
    expect(compound.cashflows[0].total).toBeGreaterThan(simple.cashflows[0].total);
  });
});

describe('입력 검증 (오류 케이스)', () => {
  it('만기일 <= 발행일 → 오류', () => {
    expect(() =>
      priceBond({ ...base, bondType: 'DISCOUNT', maturityDate: '2024-01-01', issueDate: '2024-01-01' }),
    ).toThrow(PricingError);
  });

  it('평가일 > 만기일 → 오류', () => {
    expect(() =>
      priceBond({ ...base, bondType: 'DISCOUNT', valuationDate: '2030-01-01' }),
    ).toThrow(/VALUATION_AFTER_MATURITY/);
  });

  it('marketYield NaN → 오류', () => {
    expect(() => priceBond({ ...base, bondType: 'DISCOUNT', marketYield: NaN })).toThrow(
      /NON_FINITE/,
    );
  });

  it('지급횟수 3 → 오류', () => {
    expect(() =>
      // @ts-expect-error 잘못된 빈도 테스트
      priceBond({ ...base, bondType: 'FIXED_COUPON', couponFrequency: 3 }),
    ).toThrow(/INVALID_FREQUENCY/);
  });

  it('1 + y/f <= 0 → 오류', () => {
    expect(() =>
      priceBond({ ...base, bondType: 'DISCOUNT', couponFrequency: 1, marketYield: -150 }),
    ).toThrow(/INVALID_DISCOUNT_BASE/);
  });
});

describe('경계: 윤년/1tenor 미만', () => {
  it('잔존 1년 미만이면 규칙에 기록', () => {
    const r = priceBond({
      ...base,
      bondType: 'DISCOUNT',
      couponFrequency: 1,
      valuationDate: '2026-07-01',
      maturityDate: '2027-01-01',
    });
    expect(r.remainingYears).toBeLessThan(1);
    expect(r.appliedRules.join(' ')).toMatch(/1tenor 미만/);
  });

  it('ACT_ACT 윤년 구간 반영', () => {
    const r = priceBond({
      ...base,
      bondType: 'DISCOUNT',
      couponFrequency: 1,
      dayCount: 'ACT_ACT',
      valuationDate: '2024-01-01',
      maturityDate: '2024-12-31', // 2024 윤년
    });
    expect(r.appliedRules.join(' ')).toMatch(/윤년/);
  });
});
