import React from 'react';
import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/issue', label: '발행', icon: '📄' },
  { to: '/curve', label: '곡선', icon: '📈' },
  { to: '/distribution', label: '유통', icon: '🔁' },
  { to: '/simulation', label: '투자', icon: '🧮' },
  { to: '/mtm', label: '시가표', icon: '🗂️' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2 border-t border-gray-200 bg-white">
      <ul className="flex h-[64px] items-stretch">
        {ITEMS.map((it) => (
          <li key={it.to} className="flex-1">
            <NavLink
              to={it.to}
              className={({ isActive }) =>
                `flex h-full min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] ${
                  isActive ? 'text-bondgold' : 'text-gray-500'
                }`
              }
            >
              <span className="text-lg leading-none">{it.icon}</span>
              {it.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
