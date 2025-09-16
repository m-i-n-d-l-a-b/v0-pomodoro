import * as React from 'react'

import { cn } from '@/lib/utils'

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(
  ({ className, children, onMouseDown, ...props }, ref): React.ReactElement => {
    const handleMouseDown = (event: React.MouseEvent<HTMLSelectElement>): void => {
      if (typeof onMouseDown === 'function') {
        onMouseDown(event)
      }

      const target = event.currentTarget
      // Proactively open the native picker if supported. Helps when some
      // environments suppress default select dropdown opening.
      // No-op if not supported.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const showPicker = (target as any)?.showPicker
      if (!target.disabled && typeof showPicker === 'function') {
        try {
          showPicker.call(target)
          event.preventDefault()
        } catch {
          // Ignore and fall back to default behavior
        }
      }
    }

    return (
      <select
        ref={ref}
        data-slot="select"
        onMouseDown={handleMouseDown}
        className={cn(
          'text-white placeholder:text-white/70 cursor-pointer selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)

export { Select }
