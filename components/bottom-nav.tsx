'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PenLine, BookOpen, CalendarRange } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/record', label: '記録', icon: PenLine },
  { href: '/records', label: '一覧', icon: BookOpen },
  { href: '/weekly', label: '週', icon: CalendarRange },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="メインナビゲーション"
      className="sticky bottom-0 z-20 border-t border-border bg-card/85 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {ITEMS.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] tracking-wide transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2 : 1.5}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
