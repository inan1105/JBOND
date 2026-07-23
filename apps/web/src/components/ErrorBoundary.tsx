import React from 'react';

interface Props {
  children: React.ReactNode;
  name?: string;
}
interface State {
  error: Error | null;
}

/** 라우트별 Error Boundary */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${this.props.name ?? 'root'}]`, error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm font-medium text-gray-800">화면을 표시할 수 없습니다</p>
          <p className="max-w-[280px] text-[11px] text-gray-500">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="min-h-[44px] rounded-lg bg-gray-900 px-4 text-sm font-medium text-white"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
