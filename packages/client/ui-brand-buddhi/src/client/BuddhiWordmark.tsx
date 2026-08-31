import type { HTMLAttributes } from 'react'
import { en } from './locales.ts'

export interface BuddhiWordmarkProps extends HTMLAttributes<HTMLDivElement> {
  includeMark?: boolean | undefined
  className?: string | undefined
}

/**
 * Typographic wordmark for BuddhiAI Harness.
 */
export function BuddhiWordmark({ className, ...props }: BuddhiWordmarkProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '6px',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        userSelect: 'none',
      }}
      className={className}
      {...props}
    >
      <span style={{ fontSize: '15px', color: 'currentColor' }}>{en.brandName}</span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '1px 5px',
          borderRadius: '4px',
          backgroundColor: 'var(--color-bg-base, #DD603C)',
          color: 'var(--color-bg-base, #121214)',
          opacity: 0.9,
        }}
      >
        {en.brandSuffix}
      </span>
    </div>
  )
}
