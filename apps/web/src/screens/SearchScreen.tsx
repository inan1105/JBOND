import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { BondMaster } from '@jbond/shared-types';
import { Skeleton, EmptyState } from '@jbond/ui';
import { dataService } from '../data/service.js';
import { useAppStore } from '../store/appStore.js';

const CATEGORY_LABEL: Record<string, string> = {
  GOVERNMENT: '국채',
  MONETARY: '통안채',
  LOCAL: '지방채',
  SPECIAL: '특수채',
  BANK: '은행채',
  FINANCIAL: '금융채',
  CARD: '카드채',
  CAPITAL: '캐피탈채',
  CORPORATE: '회사채',
};

export function SearchScreen() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const [results, setResults] = useState<BondMaster[] | null>(null);
  const navigate = useNavigate();
  const { recents, watchlist } = useAppStore();

  useEffect(() => {
    let alive = true;
    setResults(null);
    dataService.search(q).then((r) => alive && setResults(r));
    return () => {
      alive = false;
    };
  }, [q]);

  const open = (bondId: string) => navigate(`/issue/${bondId}`);

  return (
    <div className="flex flex-col gap-4">
      {q === '' && (recents.length > 0 || watchlist.length > 0) && (
        <section className="flex flex-col gap-2">
          {watchlist.length > 0 && (
            <QuickList title="관심채권" ids={watchlist} onOpen={open} />
          )}
          {recents.length > 0 && <QuickList title="최근 조회" ids={recents} onOpen={open} />}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-medium text-gray-500">
          {q ? `‘${q}’ 검색결과` : '전체 종목'}
        </h2>
        {results == null ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : results.length === 0 ? (
          <EmptyState message="검색 결과가 없습니다" />
        ) : (
          <ul className="flex flex-col gap-2" data-testid="search-results">
            {results.map((m) => (
              <li key={m.bondId}>
                <button
                  type="button"
                  onClick={() => open(m.bondId)}
                  className="w-full rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{m.bondName}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                      {CATEGORY_LABEL[m.category] ?? m.category}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3 text-[11px] text-gray-500">
                    <span>{m.issueCode}</span>
                    <span>{m.isin}</span>
                    {m.creditRating && <span>등급 {m.creditRating}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-[10px] text-gray-400">
        데이터 출처: SEIBro(기본)·KOFIA·KRX · 현재 Mock 모드
      </p>
    </div>
  );
}

function QuickList({
  title,
  ids,
  onOpen,
}: {
  title: string;
  ids: string[];
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-medium text-gray-500">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => {
          const m = dataService.getMaster(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onOpen(id)}
              className="rounded-full bg-white px-3 py-1.5 text-[11px] text-gray-700 shadow-sm ring-1 ring-gray-100"
            >
              {m?.bondName ?? id}
            </button>
          );
        })}
      </div>
    </div>
  );
}
