import { describe, expect, it } from 'vitest';
import { curve, mtmMatrix, observations, MTM_ROWS, MTM_TENORS } from './mock.js';

describe('mock 데이터 파이프라인', () => {
  it('관측 시계열은 주말 결측(휴장)을 포함하지 않는다', () => {
    const obs = observations('KR103501GA34', '2026-06-01', '2026-06-30');
    expect(obs.length).toBeGreaterThan(0);
    for (const o of obs) {
      const dow = new Date(o.valuationDate).getUTCDay();
      expect(dow).not.toBe(0);
      expect(dow).not.toBe(6);
    }
  });

  it('동일 입력은 결정론적으로 동일 결과', () => {
    const a = curve('GOVERNMENT', '2026-07-23');
    const b = curve('GOVERNMENT', '2026-07-23');
    expect(a).toEqual(b);
  });

  it('회사채 2Y 곡선점은 보간(INTERPOLATED)으로 표시', () => {
    const c = curve('CORPORATE_AA0', '2026-07-23');
    const twoY = c.find((p) => p.tenorLabel === '2Y');
    expect(twoY?.valueType).toBe('INTERPOLATED');
    expect(twoY?.yield).toBeNull();
  });

  it('시가표는 모든 행×열을 채우되 결측은 null 유지', () => {
    const m = mtmMatrix('2026-07-23');
    expect(m.length).toBe(MTM_ROWS.length * MTM_TENORS.length);
    const missing = m.find((r) => r.rowKey === 'MSB' && r.tenorLabel === '30Y');
    expect(missing?.yield).toBeNull();
    expect(missing?.qualityStatus).toBe('MISSING');
  });
});
