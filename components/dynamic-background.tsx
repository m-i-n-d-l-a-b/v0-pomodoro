"use client"

import { useEffect, useRef } from "react"

interface Dot {
  x: number
  y: number
  originalX: number
  originalY: number
  size: number
  opacity: number
  color: string
}

export function DynamicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })
  const dotsRef = useRef<Dot[]>([])
  const lastFrameTime = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const initDots = () => {
      const spacing = 15
      const cols = Math.ceil(canvas.width / spacing) + 2
      const rows = Math.ceil(canvas.height / spacing) + 2

      const colors = [
        "rgba(100, 100, 100, 0.4)",
        "rgba(120, 120, 120, 0.3)",
        "rgba(80, 80, 80, 0.5)",
        "rgba(140, 140, 140, 0.2)",
        "rgba(90, 90, 90, 0.4)",
        "rgba(110, 110, 110, 0.3)",
      ]

      // Clear existing dots to prevent memory leaks
      dotsRef.current.length = 0

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing - spacing
          const y = row * spacing - spacing

          dotsRef.current.push({
            x,
            y,
            originalX: x,
            originalY: y,
            size: Math.random() * 1.5 + 1,
            opacity: Math.random() * 0.3 + 0.1,
            color: colors[Math.floor(Math.random() * colors.length)],
          })
        }
      }
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initDots()
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    let mouseTimeout: NodeJS.Timeout
    const handleMouseMove = (e: MouseEvent) => {
      clearTimeout(mouseTimeout)
      mouseTimeout = setTimeout(() => {
        mouseRef.current = { x: e.clientX, y: e.clientY }
      }, 16) // ~60fps throttling
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    const animate = (currentTime: number) => {
      if (!ctx || !canvas) return

      if (currentTime - lastFrameTime.current < 16) {
        // ~60fps
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastFrameTime.current = currentTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const time = currentTime * 0.0008
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height),
      )
      gradient.addColorStop(0, `hsl(0, 0%, ${8 + Math.sin(time) * 2}%)`)
      gradient.addColorStop(0.5, `hsl(0, 0%, ${5 + Math.cos(time * 0.7) * 1.5}%)`)
      gradient.addColorStop(1, `hsl(0, 0%, ${2 + Math.sin(time * 1.2) * 1}%)`)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      dotsRef.current.forEach((dot) => {
        const dx = mouseRef.current.x - dot.originalX
        const dy = mouseRef.current.y - dot.originalY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = 120

        if (distance < maxDistance && distance > 0) {
          const force = ((maxDistance - distance) / maxDistance) * 25
          const angle = Math.atan2(dy, dx)

          dot.x = dot.originalX - Math.cos(angle) * force
          dot.y = dot.originalY - Math.sin(angle) * force
          dot.size = Math.min(4, 1 + (1 - distance / maxDistance) * 2)
          dot.opacity = Math.min(0.8, 0.1 + (1 - distance / maxDistance) * 0.5)
        } else {
          dot.x += (dot.originalX - dot.x) * 0.05
          dot.y += (dot.originalY - dot.y) * 0.05
          dot.size += (1 + Math.random() * 1 - dot.size) * 0.02
          dot.opacity += (0.1 + Math.random() * 0.2 - dot.opacity) * 0.02
        }

        dot.x += Math.sin(time + dot.originalX * 0.01) * 0.5
        dot.y += Math.cos(time + dot.originalY * 0.01) * 0.3

        // Optimized rendering
        ctx.save()
        ctx.shadowColor = dot.color
        ctx.shadowBlur = dot.size * 2
        ctx.globalAlpha = dot.opacity * 0.3
        ctx.fillStyle = dot.color
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size + 1, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0
        ctx.globalAlpha = dot.opacity
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      clearTimeout(mouseTimeout)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />
}
