import { cn } from '@/lib/utils'

/**
 * 「今日の発見」「今日の余白」などを静かに見せる1ブロック。
 */
export function InsightBlock({
  label,
  children,
  emphasis = false,
  className,
}: {
  label: string
  children: React.ReactNode
  emphasis?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <p
        className={cn(
          'leading-relaxed text-card-foreground',
          emphasis
            ? 'font-serif text-lg font-light text-pretty'
            : 'text-[15px] text-pretty',
        )}
      >
        {children}
      </p>
    </div>
  )
}
