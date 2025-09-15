'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

interface ExtendedThemeProviderProps extends ThemeProviderProps {
  /**
   * Child nodes that will receive theme context.
   */
  children: React.ReactNode
}

export function ThemeProvider({
  children,
  ...props
}: ExtendedThemeProviderProps): JSX.Element {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
