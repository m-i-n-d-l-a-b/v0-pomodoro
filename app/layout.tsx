import type { Metadata } from 'next'
import { Work_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const workSans = Work_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  title: 'POMOPULSE - Pomodoro Timer with Binaural Beats',
  description: 'A modern, immersive Pomodoro timer application that combines the classic productivity technique with scientifically-backed binaural beats and stunning visual animations to help users maintain focus and prevent burnout.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${workSans.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
