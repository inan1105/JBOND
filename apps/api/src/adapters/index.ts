import type { BondDataAdapter } from '@jbond/shared-types';
import { MockBondDataAdapter } from './MockBondDataAdapter.js';
import { SeibroAdapter } from './SeibroAdapter.js';
import { KofiaAdapter } from './KofiaAdapter.js';
import { KrxAdapter } from './KrxAdapter.js';

export { MockBondDataAdapter, SeibroAdapter, KofiaAdapter, KrxAdapter };

/**
 * 환경설정에 따라 기본 어댑터를 선택한다.
 * DATA_SOURCE_MODE=live 이고 SEIBRO_BASE_URL 이 설정된 경우에만 실원천을 시도한다.
 * (원천 미연동 상태에서는 Mock 이 기본값)
 */
export function createPrimaryAdapter(env: NodeJS.ProcessEnv): BondDataAdapter {
  const mode = env.DATA_SOURCE_MODE ?? 'mock';
  if (mode === 'live' && env.SEIBRO_BASE_URL) {
    return new SeibroAdapter(env.SEIBRO_BASE_URL, env.SEIBRO_API_KEY);
  }
  return new MockBondDataAdapter();
}

/** 보조 어댑터 레지스트리 (실거래·최종호가 보완용) */
export function createSecondaryAdapters(env: NodeJS.ProcessEnv): BondDataAdapter[] {
  const list: BondDataAdapter[] = [];
  if (env.KOFIA_BASE_URL) list.push(new KofiaAdapter(env.KOFIA_BASE_URL, env.KOFIA_API_KEY));
  if (env.KRX_BASE_URL) list.push(new KrxAdapter(env.KRX_BASE_URL, env.KRX_API_KEY));
  return list;
}
