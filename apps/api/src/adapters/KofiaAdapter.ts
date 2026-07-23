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
 * KOFIA(금융투자협회) 어댑터 — 최종호가수익률·민평수익률 보조 원천.
 * ⚠️ 최종호가수익률은 대표물(국고·통안·회사채 AA-/BBB- 등) 중심이므로
 * 전체 등급×만기 표는 민평수익률과 결합해야 한다(PRD §3.5).
 * 실제 API 규격 확인 전까지 TODO 로 격리한다.
 */
export class KofiaAdapter implements BondDataAdapter {
  readonly source: DataSource = 'KOFIA';

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  private notImplemented(method: string): never {
    throw new Error(`KofiaAdapter.${method} 미구현: KOFIA API 규격 확인 필요.`);
  }

  async search(_query: BondSearchQuery): Promise<BondMaster[]> {
    this.notImplemented('search');
  }
  async getDetail(_bondId: string): Promise<BondDetail | null> {
    this.notImplemented('getDetail');
  }
  async getObservations(
    _bondId: string,
    _from: string,
    _to: string,
  ): Promise<BondMarketObservation[]> {
    this.notImplemented('getObservations');
  }
  // TODO(kofia): 최종호가수익률 곡선 매핑 (valueType=FINAL_QUOTE)
  async getCurve(_curveId: string, _valuationDate: string): Promise<YieldCurvePoint[]> {
    this.notImplemented('getCurve');
  }
  // TODO(kofia): 최종호가+민평 결합 매트릭스 (행별 출처 배지)
  async getMtmMatrix(_valuationDate: string): Promise<MtmRate[]> {
    this.notImplemented('getMtmMatrix');
  }
}
