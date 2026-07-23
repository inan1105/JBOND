import type {
  BondDetail,
  BondMarketObservation,
  BondMaster,
  BondTerms,
  MtmRate,
  YieldCurvePoint,
} from '@jbond/shared-types';
import { priceBond, type EngineBondType } from '@jbond/bond-engine';
import * as mock from './mock.js';

const API = import.meta.env.VITE_API_BASE_URL as string | undefined;
const LAST_GOOD_KEY = 'jbond.lastgood.v1';

/** 원천 장애 대비 마지막 정상 응답 캐시 (오프라인 마지막 조회) */
function cacheLastGood<T>(key: string, value: T): T {
  try {
    const store = JSON.parse(localStorage.getItem(LAST_GOOD_KEY) ?? '{}');
    store[key] = { value, savedAt: mock.AS_OF };
    localStorage.setItem(LAST_GOOD_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
  return value;
}

export function readLastGood<T>(key: string): { value: T; savedAt: string } | null {
  try {
    const store = JSON.parse(localStorage.getItem(LAST_GOOD_KEY) ?? '{}');
    return store[key] ?? null;
  } catch {
    return null;
  }
}

async function viaApiOrMock<T>(path: string, mockFn: () => T): Promise<T> {
  if (!API) return mockFn();
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } catch {
    // 원천 장애 → mock/마지막 정상값 폴백
    return mockFn();
  }
}

/** terms 기준으로 특정 평가일·수익률의 단가 계산 */
export function priceAt(terms: BondTerms, valuationDate: string, marketYield: number) {
  return priceBond({
    bondType: terms.bondType as EngineBondType,
    faceValue: terms.pricingFaceValue,
    issueDate: terms.issueDate,
    maturityDate: terms.maturityDate,
    valuationDate,
    couponRate: terms.couponRate ?? 0,
    marketYield,
    couponFrequency: terms.couponFrequency ?? 1,
    dayCount: terms.dayCount,
    redemptionRate: terms.redemptionRate,
  });
}

export const dataService = {
  async search(keyword: string): Promise<BondMaster[]> {
    return viaApiOrMock(`/api/bonds/search?keyword=${encodeURIComponent(keyword)}`, () => {
      const kw = keyword.trim().toLowerCase();
      return mock.MASTERS.filter(
        (m) =>
          !kw ||
          m.bondName.toLowerCase().includes(kw) ||
          (m.isin ?? '').toLowerCase().includes(kw) ||
          (m.issueCode ?? '').toLowerCase().includes(kw) ||
          m.issuerName.toLowerCase().includes(kw),
      );
    });
  },

  getTerms(bondId: string): BondTerms | undefined {
    return mock.TERMS[bondId];
  },

  getMaster(bondId: string): BondMaster | undefined {
    return mock.MASTERS.find((m) => m.bondId === bondId);
  },

  async getDetail(bondId: string): Promise<BondDetail | null> {
    const key = `detail:${bondId}`;
    const detail = await viaApiOrMock<BondDetail | null>(`/api/bonds/${bondId}`, () => {
      const obs = mock.observations(bondId, '2025-05-01', mock.AS_OF);
      const latest = obs.length ? obs[obs.length - 1] : null;
      const master = mock.MASTERS.find((m) => m.bondId === bondId);
      const terms = mock.TERMS[bondId];
      if (!master || !terms) return null;
      // 최신 관측 단가를 엔진으로 계산해 채움
      let filledLatest = latest;
      if (latest?.yield != null) {
        const p = priceAt(terms, latest.valuationDate, latest.yield);
        filledLatest = {
          ...latest,
          cleanPrice: p.cleanPrice,
          dirtyPrice: p.dirtyPrice,
          accruedInterest: p.accruedInterest,
        };
      }
      return {
        master,
        terms,
        ratings: mock.RATINGS[bondId] ?? [],
        latestObservation: filledLatest,
        metadata: {
          source: 'MOCK',
          sourceUrl: 'mock://seibro/detail',
          sourceTimestamp: `${mock.AS_OF}T16:00:00+09:00`,
          collectedAt: `${mock.AS_OF}T16:00:00+09:00`,
          qualityStatus: 'VALID',
          note: 'Mock 데이터 — 실제 SEIBro 연동 시 SeibroAdapter 로 대체',
        },
      };
    });
    if (detail) cacheLastGood(key, detail);
    return detail;
  },

  async getObservations(
    bondId: string,
    from: string,
    to: string,
  ): Promise<BondMarketObservation[]> {
    const key = `obs:${bondId}`;
    const list = await viaApiOrMock(
      `/api/bonds/${bondId}/observations?from=${from}&to=${to}`,
      () => {
        const terms = mock.TERMS[bondId];
        return mock.observations(bondId, from, to).map((o) => {
          if (terms && o.yield != null) {
            const p = priceAt(terms, o.valuationDate, o.yield);
            return { ...o, cleanPrice: p.cleanPrice, dirtyPrice: p.dirtyPrice, accruedInterest: p.accruedInterest };
          }
          return o;
        });
      },
    );
    if (list.length) cacheLastGood(key, list);
    return list;
  },

  async getCurve(curveId: string, date: string): Promise<YieldCurvePoint[]> {
    return viaApiOrMock(`/api/curves/${curveId}?date=${date}`, () => mock.curve(curveId, date));
  },

  async getMtmMatrix(date: string): Promise<MtmRate[]> {
    const key = `mtm:${date}`;
    const list = await viaApiOrMock(`/api/mtm?date=${date}`, () => mock.mtmMatrix(date));
    if (list.length) cacheLastGood(key, list);
    return list;
  },
};
