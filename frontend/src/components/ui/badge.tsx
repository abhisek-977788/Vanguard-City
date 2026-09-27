import { cn, getRiskBadgeClass } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'risk' | 'status' | 'category'
  level?: string
  className?: string
}

export function Badge({ children, variant = 'default', level = '', className }: BadgeProps) {
  if (variant === 'risk' && level) {
    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', getRiskBadgeClass(level), className)}>
        {children}
      </span>
    )
  }

  const statusColors: Record<string, string> = {
    open: 'bg-red-500/20 text-red-400 border border-red-500/30',
    under_review: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    resolved: 'bg-green-500/20 text-green-400 border border-green-500/30',
    pending_verification: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    verified_authorized: 'bg-green-500/20 text-green-400 border border-green-500/30',
  }

  if (variant === 'status' && level) {
    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[level] || statusColors.open, className)}>
        {children}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center rounded-full bg-blue-900/40 px-2.5 py-0.5 text-xs font-medium text-blue-300 border border-blue-800/50', className)}>
      {children}
    </span>
  )
}
