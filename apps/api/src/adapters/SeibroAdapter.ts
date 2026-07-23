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
 * SEIBro 어댑터 — 기본 원천.
 *
 * ⚠️ SEIBro 화면은 WebSquare 기반 동적 화면이므로 실제 요청·응답 규격은
 * 브라우저 네트워크 패널로 확인 후 구현해야 한다(PRD §1, §8-1단계).
 * 규격 미확인 상태에서 임의 하드코딩을 금지하며, 아래는 TODO 로 격리한다.
 *
 * 구현 시 매핑 원칙:
 * - 원천 필드 → 내부 표준 필드 변환
 * - source, sourceUrl, sourceTimestamp, collectedAt, valueType,
 *   qualityStatus, rawReference 를 반드시 저장
 * - 결측은 0이 아닌 null 유지
 */
export class SeibroAdapter implements BondDataAdapter {
  readonly source: DataSource = 'SEIBRO';

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  private notImplemented(method: string): never {
    throw new Error(
      `SeibroAdapter.${method} 미구현: WebSquare 요청 규격 확인 필요 (PRD §8-1단계). ` +
        `baseUrl=${this.baseUrl ? 'set' : 'unset'}`,
    );
  }

  // TODO(seibro): 종목검색 WebSquare submit 규격 확인 후 구현
  async search(_query: BondSearchQuery): Promise<BondMaster[]> {
    this.notImplemented('search');
  }

  // TODO(seibro): 발행정보/개별 평가수익률 조회 규격 확인 후 구현
  async getDetail(_bondId: string): Promise<BondDetail | null> {
    this.notImplemented('getDetail');
  }

  // TODO(seibro): 유통추정정보/일별 평가 조회 규격 확인 후 구현
  async getObservations(
    _bondId: string,
    _from: string,
    _to: string,
  ): Promise<BondMarketObservation[]> {
    this.notImplemented('getObservations');
  }

  // TODO(seibro): 만기수익률 곡선 원자료 확인 후 구현
  async getCurve(_curveId: string, _valuationDate: string): Promise<YieldCurvePoint[]> {
    this.notImplemented('getCurve');
  }

  // TODO(seibro): 시장현황 매트릭스 원자료 확인 후 구현
  async getMtmMatrix(_valuationDate: string): Promise<MtmRate[]> {
    this.notImplemented('getMtmMatrix');
  }
}
