import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AS_OF } from '../data/mock.js';

export function TopBar({ title }: { title: string }) {
  const [kw, setKw] = useState('');
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(kw)}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b1020] px-4 pb-2 pt-3 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">
          <span className="text-bondgold">James Bond</span>{' '}
          <span className="text-xs font-normal text-gray-300">· {title}</span>
        </h1>
        <div className="flex items-center gap-1 text-[10px] text-gray-300">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          기준 {AS_OF}
        </div>
      </div>
      <form onSubmit={submit} className="mt-2 flex gap-2">
        <input
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="종목명 · 종목코드 · ISIN 검색"
          aria-label="종목검색"
          className="min-h-[40px] flex-1 rounded-lg bg-white/10 px-3 text-sm text-white placeholder-gray-400 outline-none focus:bg-white/20"
        />
        <button
          type="submit"
          className="min-h-[40px] rounded-lg bg-bondgold px-3 text-sm font-medium text-[#0b1020]"
        >
          검색
        </button>
      </form>
    </header>
  );
}
