import React from 'react';

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[480px] mx-auto rounded-t-2xl bg-white p-4 pb-6 shadow-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" />
        {title && <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
