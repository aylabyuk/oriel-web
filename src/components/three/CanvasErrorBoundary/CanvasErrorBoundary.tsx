import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

type CanvasErrorBoundaryProps = {
  children: ReactNode;
};

type CanvasErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Error boundary that wraps the R3F Canvas to prevent WebGL / Three.js
 * errors from unmounting the entire React tree. When an error occurs the
 * boundary renders nothing (the HTML overlay UI continues to function).
 */
export class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[CanvasErrorBoundary] R3F canvas error:', error, info);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
