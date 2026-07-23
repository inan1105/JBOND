import { create } from 'zustand';
import type { BondContext } from '@jbond/shared-types';

const RECENTS_KEY = 'jbond.recents.v1';
const WATCH_KEY = 'jbond.watchlist.v1';

function loadList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveList(key: string, list: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

interface AppState {
  /** 화면 간 전달되는 공통 상태 객체 (PRD §2.2) */
  context: BondContext;
  recents: string[]; // 최근 조회 bondId
  watchlist: string[]; // 관심채권 bondId

  /** 다른 화면으로 전달할 컨텍스트 병합 */
  pushContext: (patch: Partial<BondContext>) => void;
  clearContext: () => void;

  addRecent: (bondId: string) => void;
  toggleWatch: (bondId: string) => void;
  isWatched: (bondId: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  context: {},
  recents: loadList(RECENTS_KEY),
  watchlist: loadList(WATCH_KEY),

  pushContext: (patch) => set((s) => ({ context: { ...s.context, ...patch } })),
  clearContext: () => set({ context: {} }),

  addRecent: (bondId) =>
    set((s) => {
      const next = [bondId, ...s.recents.filter((x) => x !== bondId)].slice(0, 10);
      saveList(RECENTS_KEY, next);
      return { recents: next };
    }),

  toggleWatch: (bondId) =>
    set((s) => {
      const next = s.watchlist.includes(bondId)
        ? s.watchlist.filter((x) => x !== bondId)
        : [bondId, ...s.watchlist];
      saveList(WATCH_KEY, next);
      return { watchlist: next };
    }),

  isWatched: (bondId) => get().watchlist.includes(bondId),
}));
