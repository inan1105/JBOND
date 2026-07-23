import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { BondMarketObservation } from '@jbond/shared-types';

export function PriceYieldChart({
  observations,
  onPick,
}: {
  observations: BondMarketObservation[];
  onPick?: (o: BondMarketObservation) => void;
}) {
  const dates = observations.map((o) => o.valuationDate);
  const yields = observations.map((o) => (o.yield == null ? null : o.yield));
  const prices = observations.map((o) => (o.cleanPrice == null ? null : o.cleanPrice));
  const volumes = observations.map((o) => (o.tradeVolume == null ? 0 : o.tradeVolume));

  const option = {
    grid: [
      { left: 48, right: 48, top: 24, height: '55%' },
      { left: 48, right: 48, top: '72%', height: '16%' },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: { data: ['수익률(%)', '가격'], top: 0, textStyle: { fontSize: 10 } },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    xAxis: [
      { type: 'category', data: dates, boundaryGap: false, axisLabel: { fontSize: 9 } },
      { type: 'category', gridIndex: 1, data: dates, axisLabel: { show: false } },
    ],
    yAxis: [
      {
        type: 'value',
        scale: true,
        position: 'left',
        name: '수익률%',
        nameTextStyle: { fontSize: 9 },
        axisLabel: { fontSize: 9 },
      },
      {
        type: 'value',
        scale: true,
        position: 'right',
        name: '가격',
        nameTextStyle: { fontSize: 9 },
        axisLabel: { fontSize: 9 },
      },
      { type: 'value', gridIndex: 1, axisLabel: { show: false } },
    ],
    series: [
      {
        name: '수익률(%)',
        type: 'line',
        yAxisIndex: 0,
        data: yields,
        connectNulls: false, // 결측은 잇지 않음
        showSymbol: false,
        lineStyle: { color: '#dc2626', width: 1.5 },
        itemStyle: { color: '#dc2626' },
      },
      {
        name: '가격',
        type: 'line',
        yAxisIndex: 1,
        data: prices,
        connectNulls: false,
        showSymbol: false,
        lineStyle: { color: '#2563eb', width: 1.5 },
        itemStyle: { color: '#2563eb' },
      },
      {
        name: '거래량',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 2,
        data: volumes,
        itemStyle: { color: '#cbd5e1' },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 300, width: '100%' }}
      onEvents={{
        click: (e: { dataIndex?: number }) => {
          if (onPick && typeof e.dataIndex === 'number') onPick(observations[e.dataIndex]);
        },
      }}
    />
  );
}
