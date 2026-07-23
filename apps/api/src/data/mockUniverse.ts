import type {
  BondCreditRating,
  BondDetail,
  BondMarketObservation,
  BondMaster,
  BondTerms,
  MtmRate,
  TenorLabel,
  YieldCurvePoint,
} from '@jbond/shared-types';

/**
 * API 측 Mock 유니버스. 실제 원천(SEIBro 등) 연동 전 개발/데모용.
 * 결측은 0이 아닌 null 로 유지한다.
 */

export const MOCK_MASTERS: BondMaster[] = [
  {
    bondId: 'KR103501GA34',
    isin: 'KR103501GA34',
    issueCode: '국고03500-3403',
    bondName: '국고채권 03500-3403(24-2)',
    category: 'GOVERNMENT',
    bondType: 'FIXED_COUPON',
    issuerName: '대한민국정부',
    currency: 'KRW',
    creditRating: 'AAA',
  },
  {
    bondId: 'KR2000MONE01',
    isin: 'KR2000MONE01',
    issueCode: '통안0250-2601',
    bondName: '통화안정증권 02500-2601',
    category: 'MONETARY',
    bondType: 'DISCOUNT',
    issuerName: '한국은행',
    currency: 'KRW',
    creditRating: 'AAA',
  },
  {
    bondId: 'KR6000CORPAA',
    isin: 'KR6000CORPAA',
    issueCode: '회사AA0-2701',
    bondName: '(주)본드전자 12 회사채',
    category: 'CORPORATE',
    bondType: 'FIXED_COUPON',
    issuerName: '본드전자',
    currency: 'KRW',
    creditRating: 'AA0',
  },
  {
    bondId: 'KR3000COMPD1',
    isin: 'KR3000COMPD1',
    issueCode: '지역개발복리-2901',
    bondName: '지역개발채권(복리) 03000-2901',
    category: 'LOCAL',
    bondType: 'COMPOUND',
    issuerName: '서울특별시',
    currency: 'KRW',
    creditRating: 'AA+',
  },
  {
    bondId: 'KR4000SIMPLE',
    isin: 'KR4000SIMPLE',
    issueCode: '금융단리-2801',
    bondName: '본드은행 단리채 04000-2801',
    category: 'BANK',
    bondType: 'SIMPLE_COMPOUND',
    issuerName: '본드은행',
    currency: 'KRW',
    creditRating: 'AAA',
  },
];

const TERMS: Record<string, BondTerms> = {
  KR103501GA34: {
    bondId: 'KR103501GA34',
    faceValue: 10000,
    pricingFaceValue: 10000,
    currency: 'KRW',
    issueDate: '2024-03-10',
    maturityDate: '2034-03-10',
    bondType: 'FIXED_COUPON',
    couponRate: 3.5,
    issueYield: 3.52,
    couponFrequency: 2,
    dayCount: 'ACT_365',
    redemptionType: 'BULLET',
    redemptionRate: 100,
    interestPaymentType: 'ARREARS',
  },
  KR2000MONE01: {
    bondId: 'KR2000MONE01',
    faceValue: 10000,
    pricingFaceValue: 10000,
    currency: 'KRW',
    issueDate: '2025-01-15',
    maturityDate: '2026-01-15',
    bondType: 'DISCOUNT',
    couponRate: null,
    issueYield: 2.9,
    couponFrequency: 1,
    dayCount: 'ACT_365',
    redemptionType: 'BULLET',
    redemptionRate: 100,
    interestPaymentType: 'AT_MATURITY',
  },
  KR6000CORPAA: {
    bondId: 'KR6000CORPAA',
    faceValue: 10000,
    pricingFaceValue: 10000,
    currency: 'KRW',
    issueDate: '2024-07-01',
    maturityDate: '2027-07-01',
    bondType: 'FIXED_COUPON',
    couponRate: 4.2,
    issueYield: 4.25,
    couponFrequency: 4,
    dayCount: 'ACT_365',
    redemptionType: 'BULLET',
    redemptionRate: 100,
    interestPaymentType: 'ARREARS',
  },
  KR3000COMPD1: {
    bondId: 'KR3000COMPD1',
    faceValue: 10000,
    pricingFaceValue: 10000,
    currency: 'KRW',
    issueDate: '2024-01-02',
    maturityDate: '2029-01-02',
    bondType: 'COMPOUND',
    couponRate: 3.0,
    issueYield: 3.0,
    couponFrequency: 1,
    dayCount: 'ACT_365',
    redemptionType: 'BULLET',
    redemptionRate: 100,
    interestPaymentType: 'AT_MATURITY',
  },
  KR4000SIMPLE: {
    bondId: 'KR4000SIMPLE',
    faceValue: 10000,
    pricingFaceValue: 10000,
    currency: 'KRW',
    issueDate: '2024-01-02',
    maturityDate: '2028-01-02',
    bondType: 'SIMPLE_COMPOUND',
    couponRate: 3.8,
    issueYield: 3.8,
    couponFrequency: 1,
    dayCount: 'ACT_365',
    redemptionType: 'BULLET',
    redemptionRate: 100,
    interestPaymentType: 'AT_MATURITY',
  },
};

export function getTerms(bondId: string): BondTerms | undefined {
  return TERMS[bondId];
}

const RATINGS: Record<string, BondCreditRating[]> = {
  KR103501GA34: [{ bondId: 'KR103501GA34', agency: 'KIS', rating: 'AAA', ratedDate: '2024-03-01' }],
  KR6000CORPAA: [
    { bondId: 'KR6000CORPAA', agency: 'KIS', rating: 'AA0', ratedDate: '2024-06-20' },
    { bondId: 'KR6000CORPAA', agency: 'NICE', rating: 'AA0', ratedDate: '2024-06-21' },
  ],
};

/** 결정론적 유사난수 (테스트 재현성) */
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 종목의 일별 시가평가 관측 시계열 (asOf 기준 과거 lookbackDays) */
export function getObservations(
  bondId: string,
  fromIso: string,
  toIso: string,
): BondMarketObservation[] {
  const terms = TERMS[bondId];
  if (!terms) return [];
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  const baseYield = terms.issueYield ?? terms.couponRate ?? 3;
  const rnd = seeded(bondId.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const out: BondMarketObservation[] = [];
  let y = baseYield;
  for (let t = from; t <= to; t += 86_400_000) {
    const d = new Date(t);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue; // 주말 결측(휴장)
    y += (rnd() - 0.5) * 0.04; // 랜덤워크
    const iso = d.toISOString().slice(0, 10);
    const hasTrade = rnd() > 0.6;
    out.push({
      bondId,
      valuationDate: iso,
      yield: Number(y.toFixed(3)),
      cleanPrice: null, // 프런트/엔진에서 계산
      dirtyPrice: null,
      accruedInterest: null,
      tradeVolume: hasTrade ? Math.round(rnd() * 5000) * 100 : null,
      tradeAmount: null,
      valueType: 'MARK_TO_MARKET',
      source: 'MOCK',
      sourceUrl: 'mock://seibro/observation',
      sourceTimestamp: `${iso}T15:30:00+09:00`,
      collectedAt: `${iso}T16:00:00+09:00`,
      qualityStatus: 'VALID',
      rawReference: `MOCK-${bondId}-${iso}`,
    });
  }
  return out;
}

const TENORS: { label: TenorLabel; years: number }[] = [
  { label: '3M', years: 0.25 },
  { label: '6M', years: 0.5 },
  { label: '1Y', years: 1 },
  { label: '2Y', years: 2 },
  { label: '3Y', years: 3 },
  { label: '5Y', years: 5 },
  { label: '10Y', years: 10 },
  { label: '20Y', years: 20 },
  { label: '30Y', years: 30 },
];

const CURVE_BASE: Record<string, { base: number; slope: number; rating?: string }> = {
  GOVERNMENT: { base: 2.9, slope: 0.9 },
  MONETARY: { base: 2.85, slope: 0.5 },
  LOCAL: { base: 3.1, slope: 0.95, rating: 'AA+' },
  SPECIAL: { base: 3.15, slope: 0.95, rating: 'AAA' },
  BANK: { base: 3.25, slope: 0.9, rating: 'AAA' },
  CORPORATE_AA0: { base: 3.6, slope: 1.0, rating: 'AA0' },
  CORPORATE_BBB: { base: 6.5, slope: 1.4, rating: 'BBB' },
};

export function getCurve(curveId: string, valuationDate: string): YieldCurvePoint[] {
  const cfg = CURVE_BASE[curveId] ?? CURVE_BASE.GOVERNMENT;
  const category = (curveId.split('_')[0] as YieldCurvePoint['category']) ?? 'GOVERNMENT';
  const rnd = seeded(
    curveId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) +
      valuationDate.split('-').reduce((a, c) => a + Number(c), 0),
  );
  return TENORS.map((tn, i) => {
    // 일부 만기점은 원자료 결측 → 보간 표시
    const missing = tn.label === '2Y' && curveId.startsWith('CORPORATE');
    const y =
      cfg.base + cfg.slope * Math.log1p(tn.years) * 0.6 + (rnd() - 0.5) * 0.05;
    return {
      curveId,
      category,
      creditRating: cfg.rating ?? null,
      tenorLabel: tn.label,
      tenorYears: tn.years,
      valuationDate,
      yield: missing ? null : Number(y.toFixed(3)),
      valueType: missing ? 'INTERPOLATED' : i % 5 === 4 ? 'FINAL_QUOTE' : 'MARK_TO_MARKET',
      qualityStatus: missing ? 'ESTIMATED' : 'VALID',
      source: 'MOCK',
    };
  });
}

const MTM_ROWS: { key: string; label: string; base: number; slope: number }[] = [
  { key: 'GOV', label: '국고채', base: 2.9, slope: 0.9 },
  { key: 'MSB', label: '통안채', base: 2.85, slope: 0.5 },
  { key: 'LOCAL', label: '지방채', base: 3.1, slope: 0.95 },
  { key: 'SPECIAL_AAA', label: '특수채 AAA', base: 3.15, slope: 0.95 },
  { key: 'BANK_AAA', label: '은행채 AAA', base: 3.25, slope: 0.9 },
  { key: 'FIN_AA', label: '금융채 AA', base: 3.45, slope: 0.95 },
  { key: 'CARD_AA', label: '카드채 AA', base: 3.55, slope: 1.0 },
  { key: 'CAPITAL_AA', label: '캐피탈채 AA', base: 3.7, slope: 1.05 },
  { key: 'CORP_AAA', label: '회사채 AAA', base: 3.4, slope: 1.0 },
  { key: 'CORP_AAp', label: '회사채 AA+', base: 3.5, slope: 1.0 },
  { key: 'CORP_AA0', label: '회사채 AA0', base: 3.6, slope: 1.0 },
  { key: 'CORP_AAm', label: '회사채 AA-', base: 3.75, slope: 1.05 },
  { key: 'CORP_Ap', label: '회사채 A+', base: 4.1, slope: 1.1 },
  { key: 'CORP_A0', label: '회사채 A0', base: 4.4, slope: 1.15 },
  { key: 'CORP_Am', label: '회사채 A-', base: 4.8, slope: 1.2 },
  { key: 'CORP_BBB', label: '회사채 BBB', base: 6.5, slope: 1.4 },
];

const MTM_TENORS: TenorLabel[] = ['3M', '6M', '1Y', '3Y', '5Y', '10Y', '30Y'];
const MTM_YEARS: Record<TenorLabel, number> = {
  '3M': 0.25,
  '6M': 0.5,
  '1Y': 1,
  '2Y': 2,
  '3Y': 3,
  '5Y': 5,
  '10Y': 10,
  '20Y': 20,
  '30Y': 30,
};

export function getMtmMatrix(valuationDate: string): MtmRate[] {
  const rnd = seeded(valuationDate.split('-').reduce((a, c) => a + Number(c), 0) + 7);
  const out: MtmRate[] = [];
  for (const row of MTM_ROWS) {
    for (const tenor of MTM_TENORS) {
      const yrs = MTM_YEARS[tenor];
      // 결측 시나리오: 통안채 30Y 없음
      const missing = row.key === 'MSB' && tenor === '30Y';
      const y = row.base + row.slope * Math.log1p(yrs) * 0.6 + (rnd() - 0.5) * 0.04;
      const change = (rnd() - 0.5) * 12;
      const vt =
        row.key === 'GOV' || row.key === 'MSB'
          ? 'FINAL_QUOTE'
          : rnd() > 0.5
            ? 'MARK_TO_MARKET'
            : 'FINAL_QUOTE';
      out.push({
        rowKey: row.key,
        rowLabel: row.label,
        tenorLabel: tenor,
        valuationDate,
        yield: missing ? null : Number(y.toFixed(3)),
        changeBp: missing ? null : Number(change.toFixed(1)),
        valueType: missing ? 'INTERPOLATED' : vt,
        qualityStatus: missing ? 'MISSING' : 'VALID',
        source: 'MOCK',
      });
    }
  }
  return out;
}

export function getDetail(bondId: string, latest?: BondMarketObservation | null): BondDetail | null {
  const master = MOCK_MASTERS.find((m) => m.bondId === bondId);
  const terms = TERMS[bondId];
  if (!master || !terms) return null;
  return {
    master,
    terms,
    ratings: RATINGS[bondId] ?? [],
    latestObservation: latest ?? null,
    metadata: {
      source: 'MOCK',
      sourceUrl: 'mock://seibro/detail',
      sourceTimestamp: new Date(0).toISOString(),
      collectedAt: new Date(0).toISOString(),
      qualityStatus: 'VALID',
      note: 'Mock 데이터 — 실제 SEIBro 연동 시 SeibroAdapter 로 대체',
    },
  };
}
