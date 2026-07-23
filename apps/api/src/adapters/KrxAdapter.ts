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

/**
 * KRX/금융위원회 어댑터 — 실제 거래(시가·고가·저가·종가·거래량·수익률) 보완.
 * 금융위 공공 API 는 JSON/XML 제공(PRD §3.3). 실거래 valueType=ACTUAL_TRADE.
 * 실제 요청 규격 확인 전까지 TODO 로 격리한다.
 */
export class KrxAdapter implements BondDataAdapter {
  readonly source: DataSource = 'KRX';

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  private notImplemented(method: string): never {
    throw new Error(`KrxAdapter.${method} 미구현: 금융위/KRX API 규격 확인 필요.`);
  }

  async search(_query: BondSearchQuery): Promise<BondMaster[]> {
    this.notImplemented('search');
  }
  async getDetail(_bondId: string): Promise<BondDetail | null> {
    this.notImplemented('getDetail');
  }
  // TODO(krx): 채권시세정보 API 일별 실거래(가격/수익률/거래량) 매핑
  async getObservations(
    _bondId: string,
    _from: string,
    _to: string,
  ): Promise<BondMarketObservation[]> {
    this.notImplemented('getObservations');
  }
  async getCurve(_curveId: string, _valuationDate: string): Promise<YieldCurvePoint[]> {
    this.notImplemented('getCurve');
  }
  async getMtmMatrix(_valuationDate: string): Promise<MtmRate[]> {
    this.notImplemented('getMtmMatrix');
  }
}
