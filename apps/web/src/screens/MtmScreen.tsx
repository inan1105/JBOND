import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { MtmRate, TenorLabel } from '@jbond/shared-types';
import { Skeleton, BottomSheet, ValueTypeBadge, formatYield, formatBp } from '@jbond/ui';
import { dataService } from '../data/service.js';
import { useAppStore } from '../store/appStore.js';
import { AS_OF, MTM_ROWS, MTM_TENORS } from '../data/mock.js';
import { KV } from '../components/KV.js';

export function MtmScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const highlightTenor = params.get('tenor') as TenorLabel | null;
  const { pushContext } = useAppStore();

  const [rates, setRates] = useState<MtmRate[] | null>(null);
  const [showBp, setShowBp] = useState(false);
  const [selected, setSelected] = useState<{ row: (typeof MTM_ROWS)[number]; rate?: MtmRate } | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    setRates(null);
    dataService.getMtmMatrix(AS_OF).then((r) => alive && setRates(r));
    return () => {
      alive = false;
    };
  }, []);

  const lookup = useMemo(() => {
    const m = new Map<string, MtmRate>();
    (rates ?? []).forEach((r) => m.set(`${r.rowKey}:${r.tenorLabel}`, r));
    return m;
  }, [rates]);

  if (rates == null) {
    return <Skeleton className="h-[420px] w-full" />;
  }

  const goCurve = () => {
    if (!selected) return;
    pushContext({ sourceScreen: 'MTM', bondType: selected.row.curveId });
    navigate('/curve');
  };

  const goSim = () => {
    if (!selected?.rate?.yield) return;
    pushContext({
      sourceScreen: 'MTM',
      valuationDate: AS_OF,
      selectedYield: selected.rate.yield,
      yieldSource: 'CURVE',
      bondType: selected.row.curveId,
    });
    navigate('/simulation');
  };

  return (
    <div className="flex flex-col gap-3" data-testid="mtm-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">시가평가표</h2>
        <button
          type="button"
          onClick={() => setShowBp((v) => !v)}
          className="min-h-[36px] rounded-lg bg-white px-3 text-[12px] text-gray-700 ring-1 ring-gray-200"
        >
          {showBp ? '수익률 보기' : '전일대비 보기'}
        </button>
      </div>

      {/* Sticky 매트릭스 */}
      <div
        className="relative max-h-[70vh] overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100"
        data-testid="mtm-grid"
      >
        <table className="border-collapse text-[12px] tabular-nums">
          <thead>
            <tr>
              <th className="mtm-corner bg-gray-50 px-2 py-2 text-left text-[11px] font-medium text-gray-500 ring-1 ring-gray-100">
                종류 \ 만기
              </th>
              {MTM_TENORS.map((t) => (
                <th
                  key={t}
                  className={`mtm-col-head min-w-[64px] bg-gray-50 px-2 py-2 text-right text-[11px] font-medium ring-1 ring-gray-100 ${
                    highlightTenor === t ? 'text-bondgold' : 'text-gray-600'
                  }`}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MTM_ROWS.map((row) => (
              <tr key={row.key}>
                <th className="mtm-row-head min-w-[92px] bg-white px-2 py-2 text-left text-[11px] font-medium text-gray-700 ring-1 ring-gray-100">
                  {row.label}
                </th>
                {MTM_TENORS.map((t) => {
                  const rate = lookup.get(`${row.key}:${t}`);
                  const missing = !rate || rate.yield == null;
                  return (
                    <td
                      key={t}
                      onClick={() => setSelected({ row, rate })}
                      className={`cursor-pointer px-2 py-1.5 text-right ring-1 ring-gray-100 ${
                        highlightTenor === t ? 'bg-amber-50' : ''
                      }`}
                    >
                      {missing ? (
                        <span className="text-gray-300">—</span>
                      ) : showBp ? (
                        <span
                          className={
                            (rate!.changeBp ?? 0) > 0
                              ? 'text-red-600'
                              : (rate!.changeBp ?? 0) < 0
                                ? 'text-blue-600'
                                : 'text-gray-500'
                          }
                        >
                          {formatBp(rate!.changeBp)}
                        </span>
                      ) : (
                        <span className="font-medium text-gray-900">{formatYield(rate!.yield)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 px-1 text-[10px] text-gray-400">
        <span>배지: 최종호가 · 시가평가 · 실거래 · 보간</span>
        <span className="ml-auto">기준 {AS_OF} · 출처 Mock</span>
      </div>

      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.row.label}` : ''}
      >
        {selected?.rate && selected.rate.yield != null ? (
          <>
            <div className="mb-2 flex items-center gap-1.5">
              <ValueTypeBadge valueType={selected.rate.valueType} />
              <span className="text-[10px] text-gray-400">출처 {String(selected.rate.source)}</span>
            </div>
            <KV label="만기" value={selected.rate.tenorLabel} />
            <KV label="시가평가수익률" value={formatYield(selected.rate.yield)} />
            <KV label="전일대비" value={formatBp(selected.rate.changeBp)} />
            <KV label="기준일" value={selected.rate.valuationDate} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={goCurve}
                data-testid="btn-to-curve"
                className="min-h-[48px] rounded-xl bg-white text-sm font-medium text-gray-800 ring-1 ring-gray-200"
              >
                수익률곡선 비교
              </button>
              <button
                type="button"
                onClick={goSim}
                data-testid="btn-to-sim"
                className="min-h-[48px] rounded-xl bg-[#0b1020] text-sm font-medium text-white"
              >
                시뮬레이션 전달
              </button>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">해당 셀은 데이터가 없습니다(결측).</p>
        )}
      </BottomSheet>
    </div>
  );
}
