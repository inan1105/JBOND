import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { BondMarketObservation } from '@jbond/shared-types';
import {
  Skeleton,
  EmptyState,
  StaleBanner,
  ValueTypeBadge,
  SourceBadge,
  formatYield,
  formatPrice,
  formatMoney,
} from '@jbond/ui';
import { dataService, readLastGood } from '../data/service.js';
import { useAppStore } from '../store/appStore.js';
import { AS_OF } from '../data/mock.js';
import { PriceYieldChart } from '../components/PriceYieldChart.js';
import { KV } from '../components/KV.js';

const PERIODS: { label: string; days: number }[] = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: '전체', days: 999 },
];

function shiftDate(iso: string, days: number): string {
  return new Date(Date.parse(iso) - days * 86_400_000).toISOString().slice(0, 10);
}

export function DistributionScreen() {
  const { bondId } = useParams();
  const navigate = useNavigate();
  const { context, pushContext, recents } = useAppStore();
  const effectiveId = bondId ?? context.bondId ?? recents[0] ?? 'KR103501GA34';

  const [period, setPeriod] = useState(2); // 6M
  const [obs, setObs] = useState<BondMarketObservation[] | null>(null);
  const [picked, setPicked] = useState<BondMarketObservation | null>(null);
  const [stale, setStale] = useState(false);

  const terms = dataService.getTerms(effectiveId);
  const master = dataService.getMaster(effectiveId);

  useEffect(() => {
    let alive = true;
    setObs(null);
    setPicked(null);
    const from = period === 4 ? '2024-01-01' : shiftDate(AS_OF, PERIODS[period].days);
    dataService
      .getObservations(effectiveId, from, AS_OF)
      .then((list) => {
        if (!alive) return;
        if (list.length === 0) {
          const cached = readLastGood<BondMarketObservation[]>(`obs:${effectiveId}`);
          if (cached) {
            setObs(cached.value);
            setStale(true);
            return;
          }
        }
        setObs(list);
        setStale(false);
        setPicked(list[list.length - 1] ?? null);
      })
      .catch(() => setObs([]));
    return () => {
      alive = false;
    };
  }, [effectiveId, period]);

  // 수익률 기본값 우선순위 표시용
  const yieldInfo = useMemo(() => {
    if (!picked) return null;
    if (picked.yield != null) {
      return {
        yield: picked.yield,
        label:
          picked.valueType === 'MARK_TO_MARKET'
            ? '시가평가수익률'
            : picked.valueType === 'ACTUAL_TRADE'
              ? '실제 거래수익률'
              : picked.valueType,
        isFallback: false,
        valueType: picked.valueType,
      };
    }
    // 대체값: 발행수익률
    const iy = terms?.issueYield;
    if (iy != null)
      return { yield: iy, label: '발행수익률(대체값)', isFallback: true, valueType: 'ISSUE_YIELD' };
    return null;
  }, [picked, terms]);

  const goSimulation = () => {
    if (!picked || !yieldInfo) return;
    pushContext({
      bondId: effectiveId,
      bondName: master?.bondName,
      bondType: terms?.bondType,
      valuationDate: picked.valuationDate,
      selectedYield: yieldInfo.yield,
      selectedPrice: picked.cleanPrice ?? undefined,
      yieldSource: yieldInfo.isFallback ? 'ISSUE' : 'MARKET',
      sourceScreen: 'MARKET',
    });
    navigate('/simulation');
  };

  return (
    <div className="flex flex-col gap-3" data-testid="distribution-screen">
      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
        <h2 className="text-sm font-bold text-gray-900">{master?.bondName ?? effectiveId}</h2>
        <p className="mt-0.5 text-[11px] text-gray-500">일별 유통·평가 수익률과 가격</p>
      </div>

      {stale && <StaleBanner asOf={AS_OF} source="MOCK" />}

      <div className="flex gap-1" role="tablist" aria-label="조회기간">
        {PERIODS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPeriod(i)}
            className={`min-h-[36px] flex-1 rounded-lg text-[12px] ${
              period === i ? 'bg-[#0b1020] text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
        {obs == null ? (
          <Skeleton className="h-[300px] w-full" />
        ) : obs.length === 0 ? (
          <EmptyState message="유통정보가 없습니다" />
        ) : (
          <PriceYieldChart observations={obs} onPick={setPicked} />
        )}
      </div>

      {/* 선택일 상세 카드 */}
      {picked && (
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100" data-testid="picked-card">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">{picked.valuationDate}</span>
            <span className="flex items-center gap-1.5">
              <ValueTypeBadge valueType={yieldInfo?.valueType ?? picked.valueType} />
              <SourceBadge source={String(picked.source)} />
            </span>
          </div>
          {yieldInfo?.isFallback && (
            <p className="mb-2 rounded bg-amber-50 px-2 py-1 text-[10px] text-amber-700">
              해당 일자 시가평가수익률 결측 → {yieldInfo.label} 사용
            </p>
          )}
          <KV label="시가평가수익률" value={formatYield(picked.yield)} />
          <KV label="평가가격(Clean)" value={formatPrice(picked.cleanPrice)} />
          <KV label="거래수익률" value={formatYield(picked.yield != null && picked.tradeVolume ? picked.yield : null)} />
          <KV label="거래가격" value={picked.tradeVolume ? formatPrice(picked.cleanPrice) : '—'} />
          <KV label="거래량(액면)" value={formatMoney(picked.tradeVolume)} />
          <KV label="민평구분/출처" value={String(picked.source)} />
          <KV label="데이터 상태" value={picked.qualityStatus} />

          <button
            type="button"
            onClick={goSimulation}
            data-testid="btn-calc-from-yield"
            className="mt-3 min-h-[48px] w-full rounded-xl bg-[#0b1020] text-sm font-medium text-white"
          >
            이 수익률로 계산
          </button>
        </div>
      )}
    </div>
  );
}
