import type { ImgHTMLAttributes } from 'react'

export interface BuddhiLogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  size?: number | undefined
  className?: string | undefined
}

/**
 * BuddhiAI mark: renders the official BuddhiAI PNG logo mark.
 */
export function BuddhiLogo({ size = 24, className, style, ...props }: BuddhiLogoProps) {
  return (
    <img
      src="/buddhi-logo.png"
      alt="BuddhiAI"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: '4px',
        ...style,
      }}
      {...props}
    />
  )
}
