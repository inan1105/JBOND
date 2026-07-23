import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { BondDetail } from '@jbond/shared-types';
import { generateSchedule, type EngineBondType } from '@jbond/bond-engine';
import {
  Accordion,
  StatCard,
  Skeleton,
  ValueTypeBadge,
  SourceBadge,
  formatYield,
  formatPrice,
  formatRemaining,
} from '@jbond/ui';
import { dataService, priceAt } from '../data/service.js';
import { useAppStore } from '../store/appStore.js';
import { AS_OF } from '../data/mock.js';
import { CashflowTable } from '../components/CashflowTable.js';
import { KV } from '../components/KV.js';

const BOND_TYPE_LABEL: Record<string, string> = {
  DISCOUNT: '할인채',
  FIXED_COUPON: '고정금리 이표채',
  SIMPLE_COMPOUND: '단리채',
  COMPOUND: '복리채',
  FRN: '변동금리부',
};

export function IssueScreen() {
  const { bondId } = useParams();
  const navigate = useNavigate();
  const { pushContext, addRecent, toggleWatch, isWatched, recents } = useAppStore();
  const effectiveId = bondId ?? recents[0] ?? 'KR103501GA34';

  const [detail, setDetail] = useState<BondDetail | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setDetail(undefined);
    dataService.getDetail(effectiveId).then((d) => {
      if (!alive) return;
      setDetail(d);
      if (d) addRecent(d.master.bondId);
    });
    return () => {
      alive = false;
    };
  }, [effectiveId, addRecent]);

  const computed = useMemo(() => {
    if (!detail) return null;
    const { terms } = detail;
    const obsYield = detail.latestObservation?.yield ?? terms.issueYield ?? terms.couponRate ?? null;
    const pricing =
      obsYield != null ? priceAt(terms, AS_OF, obsYield) : null;
    const schedule = generateSchedule({
      bondType: terms.bondType as EngineBondType,
      faceValue: terms.pricingFaceValue,
      couponRate: terms.couponRate ?? 0,
      couponFrequency: terms.couponFrequency ?? 1,
      redemptionRate: terms.redemptionRate,
      issueDate: terms.issueDate,
      maturityDate: terms.maturityDate,
      dayCount: terms.dayCount,
    });
    const nextPay = schedule.find((c) => c.paymentDate > AS_OF);
    return { obsYield, pricing, schedule, nextPay };
  }, [detail]);

  if (detail === undefined) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }
  if (detail === null) {
    return <p className="py-16 text-center text-sm text-gray-500">종목을 찾을 수 없습니다.</p>;
  }

  const { master, terms, ratings, latestObservation } = detail;
  const p = computed?.pricing;

  const goDistribution = () => {
    pushContext({
      bondId: master.bondId,
      isin: master.isin,
      issueCode: master.issueCode,
      bondName: master.bondName,
      bondType: terms.bondType,
      sourceScreen: 'ISSUE',
    });
    navigate(`/distribution/${master.bondId}`);
  };

  const goSimulation = () => {
    pushContext({
      bondId: master.bondId,
      isin: master.isin,
      bondName: master.bondName,
      bondType: terms.bondType,
      valuationDate: AS_OF,
      selectedYield: computed?.obsYield ?? undefined,
      selectedPrice: p?.cleanPrice,
      yieldSource: latestObservation ? 'MARKET' : 'ISSUE',
      sourceScreen: 'ISSUE',
    });
    navigate('/simulation');
  };

  return (
    <div className="flex flex-col gap-3" data-testid="issue-screen">
      {/* 상단 식별 */}
      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{master.bondName}</h2>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500">
              <span>{master.isin}</span>
              <span>{BOND_TYPE_LABEL[terms.bondType] ?? terms.bondType}</span>
              {master.creditRating && <span>신용등급 {master.creditRating}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggleWatch(master.bondId)}
            aria-label="관심채권 저장"
            className="text-2xl leading-none"
          >
            {isWatched(master.bondId) ? '★' : '☆'}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {latestObservation && <ValueTypeBadge valueType={latestObservation.valueType} />}
          <SourceBadge source={String(detail.metadata.source)} />
          <span className="text-[10px] text-gray-400">기준 {latestObservation?.valuationDate ?? AS_OF}</span>
        </div>
      </div>

      {/* 핵심 카드 4 */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="최근 시가평가수익률"
          value={formatYield(computed?.obsYield)}
          tone="gold"
          emphasis
          sub={latestObservation ? '시가평가' : '발행수익률(대체)'}
        />
        <StatCard
          label="10,000원당 평가단가"
          value={formatPrice(p?.cleanPrice)}
          emphasis
          sub={p ? `Dirty ${formatPrice(p.dirtyPrice)}` : undefined}
        />
        <StatCard label="잔존만기" value={formatRemaining(p?.remainingDays)} sub={`만기 ${terms.maturityDate}`} />
        <StatCard
          label="다음 이자지급일"
          value={computed?.nextPay?.paymentDate ?? '—'}
          sub={terms.interestPaymentType === 'AT_MATURITY' ? '만기일시' : `연 ${terms.couponFrequency}회`}
        />
      </div>

      {/* 상세 아코디언 */}
      <Accordion title="발행조건" defaultOpen>
        <KV label="채권명" value={master.bondName} />
        <KV label="표준코드/ISIN" value={master.isin ?? '—'} />
        <KV label="종목코드" value={master.issueCode ?? '—'} />
        <KV label="발행기관" value={master.issuerName} />
        <KV label="발행일" value={terms.issueDate} />
        <KV label="만기일" value={terms.maturityDate} />
        <KV label="통화" value={terms.currency} />
        <KV label="기준 액면" value={`${terms.pricingFaceValue.toLocaleString()}원`} />
      </Accordion>

      <Accordion title="금리조건">
        <KV label="표면금리" value={terms.couponRate != null ? `${terms.couponRate}%` : '—(할인채)'} />
        <KV label="발행수익률" value={terms.issueYield != null ? `${terms.issueYield}%` : '—'} />
        <KV label="금리유형" value={BOND_TYPE_LABEL[terms.bondType]} />
        <KV label="지급주기" value={`연 ${terms.couponFrequency ?? 1}회`} />
        <KV label="이자계산방식" value={terms.dayCount} />
        <KV
          label="선·후급"
          value={
            terms.interestPaymentType === 'ARREARS'
              ? '후급'
              : terms.interestPaymentType === 'ADVANCE'
                ? '선급'
                : '만기일시'
          }
        />
      </Accordion>

      <Accordion title="상환조건">
        <KV label="상환방법" value={terms.redemptionType === 'BULLET' ? '만기일시상환' : '분할상환'} />
        <KV label="상환율" value={`${terms.redemptionRate}%`} />
      </Accordion>

      <Accordion title="현금흐름">
        {computed && <CashflowTable rows={computed.schedule} />}
      </Accordion>

      <Accordion title="평가정보">
        <KV label="최근 시가평가일" value={latestObservation?.valuationDate ?? '—'} />
        <KV label="평가수익률" value={formatYield(latestObservation?.yield)} />
        <KV label="평가가격(Clean)" value={formatPrice(p?.cleanPrice)} />
        <KV label="경과이자" value={formatPrice(p?.accruedInterest, 2)} />
        <KV label="데이터 상태" value={latestObservation?.qualityStatus ?? '—'} />
        {p && (
          <p className="mt-2 text-[10px] text-gray-400">
            적용규칙: {p.appliedRules.join(' · ')}
          </p>
        )}
      </Accordion>

      <Accordion title="원리금지급일정">
        <ul className="flex flex-col gap-1 text-[12px]">
          {computed?.schedule.map((c, i) => (
            <li key={i} className="flex justify-between tabular-nums">
              <span className="text-gray-500">{c.paymentDate}</span>
              <span>
                이자 {formatPrice(c.interest, 2)} · 원금 {formatPrice(c.principal, 0)}
              </span>
            </li>
          ))}
        </ul>
      </Accordion>

      {ratings.length > 0 && (
        <Accordion title="신용등급 이력">
          {ratings.map((r, i) => (
            <KV key={i} label={`${r.agency} (${r.ratedDate})`} value={r.rating} />
          ))}
        </Accordion>
      )}

      {/* 버튼 */}
      <div className="sticky bottom-[72px] z-10 grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={goDistribution}
          data-testid="btn-distribution"
          className="min-h-[48px] rounded-xl bg-white text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-200"
        >
          유통정보 보기
        </button>
        <button
          type="button"
          onClick={goSimulation}
          data-testid="btn-simulation"
          className="min-h-[48px] rounded-xl bg-[#0b1020] text-sm font-medium text-white"
        >
          이 채권으로 계산
        </button>
      </div>
    </div>
  );
}
