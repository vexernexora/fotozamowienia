import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 48, text: 'text-2xl' },
  }

  const { icon, text } = sizes[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Camera body */}
        <rect
          x="4"
          y="12"
          width="40"
          height="28"
          rx="4"
          className="fill-primary"
        />
        {/* Camera lens */}
        <circle cx="24" cy="26" r="10" className="fill-primary-foreground" />
        <circle cx="24" cy="26" r="7" className="fill-primary" />
        <circle cx="24" cy="26" r="4" className="fill-primary-foreground" />
        {/* Flash */}
        <rect x="14" y="8" width="10" height="6" rx="2" className="fill-primary" />
        {/* Shutter button */}
        <circle cx="38" cy="16" r="3" className="fill-primary-foreground" />
        {/* Photo corner accents */}
        <path
          d="M4 36L12 28L18 32L28 22L44 36"
          className="stroke-primary-foreground"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />
      </svg>
      {showText && (
        <span className={cn('font-bold tracking-tight', text)}>
          <span className="text-primary">Foto</span>
          <span className="text-foreground">Druk</span>
        </span>
      )}
    </div>
  )
}

export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="4" y="12" width="40" height="28" rx="4" className="fill-primary" />
      <circle cx="24" cy="26" r="10" className="fill-primary-foreground" />
      <circle cx="24" cy="26" r="7" className="fill-primary" />
      <circle cx="24" cy="26" r="4" className="fill-primary-foreground" />
      <rect x="14" y="8" width="10" height="6" rx="2" className="fill-primary" />
      <circle cx="38" cy="16" r="3" className="fill-primary-foreground" />
    </svg>
  )
}
