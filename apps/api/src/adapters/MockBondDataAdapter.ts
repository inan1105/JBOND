import type {
  BondDataAdapter,
  BondDetail,
  BondMarketObservation,
  BondMaster,
  BondSearchQuery,
  DataSource,
  MtmRate,
  YieldCurvePoint,
} from '@jbond/shared-types';
import * as mock from '../data/mockUniverse.js';

/** 완전 동작하는 Mock 어댑터 (기본값). 원천 미연동 구간의 표준. */
export class MockBondDataAdapter implements BondDataAdapter {
  readonly source: DataSource = 'MOCK';

  async search(query: BondSearchQuery): Promise<BondMaster[]> {
    const kw = query.keyword?.trim().toLowerCase();
    return mock.MOCK_MASTERS.filter((m) => {
      if (query.category && m.category !== query.category) return false;
      if (query.currency && m.currency !== query.currency) return false;
      if (!kw) return true;
      return (
        m.bondName.toLowerCase().includes(kw) ||
        (m.isin ?? '').toLowerCase().includes(kw) ||
        (m.issueCode ?? '').toLowerCase().includes(kw) ||
        m.issuerName.toLowerCase().includes(kw)
      );
    });
  }

  async getDetail(bondId: string): Promise<BondDetail | null> {
    const obs = mock.getObservations(bondId, '2025-05-01', '2026-07-23');
    const latest = obs.length ? obs[obs.length - 1] : null;
    return mock.getDetail(bondId, latest);
  }

  async getObservations(
    bondId: string,
    from: string,
    to: string,
  ): Promise<BondMarketObservation[]> {
    return mock.getObservations(bondId, from, to);
  }

  async getCurve(curveId: string, valuationDate: string): Promise<YieldCurvePoint[]> {
    return mock.getCurve(curveId, valuationDate);
  }

  async getMtmMatrix(valuationDate: string): Promise<MtmRate[]> {
    return mock.getMtmMatrix(valuationDate);
  }
}
