import type { SVGProps } from 'react'

export interface BuddhiLogoProps extends SVGProps<SVGSVGElement> {
  size?: number | undefined
  className?: string | undefined
}

/**
 * BuddhiAI mark: a stylized intelligence node symbolizing wisdom ('Buddhi')
 * and interconnected neural agency.
 */
export function BuddhiLogo({ size = 24, className, ...props }: BuddhiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      {/* Central Wisdom Core */}
      <circle cx="16" cy="16" r="4.5" fill="currentColor" />
      {/* Surrounding Agency Petals / Synaptic Nodes */}
      <path
        d="M16 3.5C16 3.5 12 9 12 13C12 15.2091 13.7909 17 16 17C18.2091 17 20 15.2091 20 13C20 9 16 3.5 16 3.5Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <path
        d="M16 28.5C16 28.5 20 23 20 19C20 16.7909 18.2091 15 16 15C13.7909 15 12 16.7909 12 19C12 23 16 28.5 16 28.5Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <path
        d="M3.5 16C3.5 16 9 20 13 20C15.2091 20 17 18.2091 17 16C17 13.7909 15.2091 12 13 12C9 12 3.5 16 3.5 16Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <path
        d="M28.5 16C28.5 16 23 12 19 12C16.7909 12 15 13.7909 15 16C15 18.2091 16.7909 20 19 20C23 20 28.5 16 28.5 16Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
    </svg>
  )
}
