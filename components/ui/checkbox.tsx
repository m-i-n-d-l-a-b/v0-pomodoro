import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(
  (
    { className, ...props },
    ref,
  ): JSX.Element => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer size-5 shrink-0 rounded-md border border-white/40 bg-white/5 text-primary shadow-xs transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
