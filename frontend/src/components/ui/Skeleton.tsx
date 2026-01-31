interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
}: SkeletonProps) {
  const base = 'skeleton-shimmer rounded'
  const variantClass =
    variant === 'circular' ? 'rounded-full' : variant === 'text' ? 'rounded h-4' : ''
  return <div className={`${base} ${variantClass} ${className}`} aria-hidden />
}

/** Skeleton for a list item (avatar + lines). */
export function SkeletonListItem({ lines = 2 }: { lines?: number }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        {lines >= 2 && <Skeleton variant="text" className="w-1/2" />}
      </div>
    </div>
  )
}

/** Skeleton for chat message bubbles. */
export function SkeletonChatBubble({ sent = false }: { sent?: boolean }) {
  return (
    <div className={`flex ${sent ? 'justify-end' : 'justify-start'}`}>
      <Skeleton className="h-12 w-48 rounded-2xl" />
    </div>
  )
}
