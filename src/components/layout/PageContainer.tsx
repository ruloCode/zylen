import React from 'react';
import { cn } from '@/utils';

interface PageContainerProps {
  children: React.ReactNode;
  /**
   * Extra classes for the content column — e.g. `relative z-10` to sit above a
   * full-bleed background, or a per-page top/bottom inset. Horizontal rhythm
   * (gutter + width) is owned here and should NOT be overridden.
   */
  className?: string;
  /**
   * Content width. `md` (28rem / 448px) is the app-wide default that every
   * screen shares; `wide` (42rem) is reserved for the rare page that genuinely
   * needs more room (e.g. multi-column onboarding).
   */
  width?: 'md' | 'wide';
}

/**
 * PageContainer — single source of truth for a page's horizontal rhythm.
 *
 * Every route renders its content column through this primitive so the side
 * gutter (16px, `px-4`) and the max content width stay pixel-identical across
 * the whole app. This is what keeps the UI from feeling cramped or drifting
 * page-to-page: change the gutter here once and it moves everywhere.
 *
 * Vertical padding (top inset below the fixed header, bottom inset for the nav)
 * stays per-page via `className`, because it depends on whether the screen is
 * header'd, full-bleed with hero art, or immersive.
 */
export function PageContainer({ children, className, width = 'md' }: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4',
        width === 'wide' ? 'max-w-2xl' : 'max-w-md',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default PageContainer;
