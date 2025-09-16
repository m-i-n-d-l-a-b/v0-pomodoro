"use client"

import { useEffect, useRef } from "react"

/* ASSUMPTIONS: Waves are subtle, enabled only while the timer is active, and modulate dot opacity without altering base state. */

interface Dot {
  x: number
  y: number
  originalX: number
  originalY: number
  size: number
  opacity: number
  color: string
  baseSize: number
  baseOpacity: number
  phase: number
}

interface DynamicBackgroundProps {
  isActive?: boolean
  isBreak?: boolean
}

export function DynamicBackground({ isActive = false, isBreak = false }: DynamicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })
  const smoothedMouseRef = useRef({ x: 0, y: 0 })
  const dotsRef = useRef<Dot[]>([])
  const lastFrameTime = useRef(0)
  const scaleRef = useRef(0.9)
  const isPointerInsideRef = useRef(true)
  const isActiveRef = useRef<boolean>(isActive)
  const isBreakRef = useRef<boolean>(isBreak)
  const activeAmountRef = useRef(0)
  const previousTimeRef = useRef(0)

  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  useEffect(() => {
    isBreakRef.current = isBreak
  }, [isBreak])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const initDots = () => {
      const spacing = 18 // slightly fewer dots for performance
      const cols = Math.ceil(canvas.width / spacing) + 2
      const rows = Math.ceil(canvas.height / spacing) + 2

      const colors = [
        "#ffffff",
      ]

      // Clear existing dots to prevent memory leaks
      dotsRef.current.length = 0

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing - spacing
          const y = row * spacing - spacing

          const baseSize = Math.random() * 1.2 + 0.8
          const baseOpacity = Math.random() * 0.06 + 0.05
          dotsRef.current.push({
            x,
            y,
            originalX: x,
            originalY: y,
            size: baseSize,
            opacity: baseOpacity,
            color: colors[Math.floor(Math.random() * colors.length)],
            baseSize,
            baseOpacity,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    const resizeCanvas = () => {
      // Render at a slightly reduced internal resolution for performance
      const renderScale = window.innerWidth > 1400 ? 0.8 : 0.9
      scaleRef.current = renderScale
      canvas.width = Math.max(1, Math.floor(window.innerWidth * renderScale))
      canvas.height = Math.max(1, Math.floor(window.innerHeight * renderScale))
      initDots()
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const handleMouseMove = (e: MouseEvent) => {
      // Track target mouse position in canvas coordinate space (scaled)
      const s = scaleRef.current
      mouseRef.current = { x: e.clientX * s, y: e.clientY * s }
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    const handleMouseEnter = () => {
      isPointerInsideRef.current = true
    }
    const handleMouseLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        isPointerInsideRef.current = false
      }
    }
    const handleWindowBlur = () => {
      isPointerInsideRef.current = false
    }
    document.addEventListener("mouseenter", handleMouseEnter)
    document.addEventListener("mouseleave", handleMouseLeave as EventListener)
    window.addEventListener("blur", handleWindowBlur)

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
      const elapsedSeconds = currentTime * 0.001

      // Smoothly ease the activation amount when toggling the timer
      const prev = previousTimeRef.current || currentTime - 16
      const dt = Math.min(0.1, Math.max(0, (currentTime - prev) / 1000))
      previousTimeRef.current = currentTime
      const target = isActiveRef.current ? 1 : 0
      const speed = isActiveRef.current ? 3.0 : 4.0
      const alpha = 1 - Math.exp(-speed * dt)
      activeAmountRef.current += (target - activeAmountRef.current) * alpha
      const a = Math.max(0, Math.min(1, activeAmountRef.current))
      const easedActive = a * a * (3 - 2 * a)
      // Solid black background to avoid banding/stripes
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Smooth mouse movement to avoid abrupt force changes
      smoothedMouseRef.current.x += (mouseRef.current.x - smoothedMouseRef.current.x) * 0.15
      smoothedMouseRef.current.y += (mouseRef.current.y - smoothedMouseRef.current.y) * 0.15

      // Ensure normal compositing to keep background dark
      ctx.globalCompositeOperation = "source-over"

      const MIN_GLOBAL_ALPHA = 0.05
      // Disable pointer deflection while waves are active; re-enable when easedActive ~ 0
      const pointerActive = isPointerInsideRef.current && easedActive <= 0.05
      dotsRef.current.forEach((dot) => {
        const dx = smoothedMouseRef.current.x - dot.originalX
        const dy = smoothedMouseRef.current.y - dot.originalY
        const distanceSq = dx * dx + dy * dy
        const maxDistance = 120
        const maxDistanceSq = maxDistance * maxDistance

        if (pointerActive && distanceSq > 0 && distanceSq < maxDistanceSq) {
          const distance = Math.sqrt(distanceSq)
          const force = ((maxDistance - distance) / maxDistance) * 22
          const angle = Math.atan2(dy, dx)

          dot.x = dot.originalX - Math.cos(angle) * force
          dot.y = dot.originalY - Math.sin(angle) * force
          // keep size and opacity constant
        } else {
          const returnFactor = pointerActive ? 0.08 : 0.14
          dot.x += (dot.originalX - dot.x) * returnFactor
          dot.y += (dot.originalY - dot.y) * returnFactor
          // no breathing changes; maintain base size and opacity
          dot.size = dot.baseSize
          dot.opacity = dot.baseOpacity
        }

        dot.x += Math.sin(time + dot.originalX * 0.01) * 0.4
        dot.y += Math.cos(time + dot.originalY * 0.01) * 0.25

        // Radial wave modulation (from center to edges), eased by activation
        let waveNormalized = 0
        let opacity = dot.baseOpacity
        if (easedActive > 0.001) {
          const centerX = canvas.width * 0.5
          const centerY = canvas.height * 0.5
          const dxC = dot.x - centerX
          const dyC = dot.y - centerY
          const r = Math.sqrt(dxC * dxC + dyC * dyC)
          const wavelength = 100 // px between wave crests
          const waveSpeed = 60 // px per second (slightly slower)
          const k = (Math.PI * 2) / wavelength
          const phase = k * (r - waveSpeed * elapsedSeconds)
          waveNormalized = 0.5 + 0.5 * Math.sin(phase)
          const minFactor = 0.5
          const maxExtra = 1.3
          const activeFactor = minFactor + maxExtra * waveNormalized
          const mixedFactor = 1 + easedActive * (activeFactor - 1)
          opacity = dot.baseOpacity * mixedFactor
        }

        // Single-pass draw with conservative opacity to avoid brightening
        ctx.globalAlpha = Math.max(MIN_GLOBAL_ALPHA, Math.min(1, opacity))
        // Increase dot size and animate subtly with the wave, eased
        const baseSize = dot.baseSize
        const activeScale = 1.18 + 0.12 * waveNormalized
        const renderSize = baseSize * (1 + easedActive * (activeScale - 1))
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, renderSize, 0, Math.PI * 2)
        if (easedActive > 0.2) {
          const gradientRadius = renderSize * (1.0 + 1.3 * easedActive)
          const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, gradientRadius)
          const centerAlpha = Math.max(0, Math.min(1, easedActive))
          const r = isBreakRef.current ? 42 : 255
          const g = isBreakRef.current ? 157 : 225
          const b = isBreakRef.current ? 143 : 0
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${centerAlpha})`)
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`) 
          ctx.fillStyle = gradient
        } else {
          ctx.fillStyle = dot.color
        }
        ctx.fill()
      })

      // Composite mode already set; keep dark baseline
      ctx.globalCompositeOperation = "source-over"

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseenter", handleMouseEnter)
      document.removeEventListener("mouseleave", handleMouseLeave as EventListener)
      window.removeEventListener("blur", handleWindowBlur)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, transform: "translateZ(0)", willChange: "transform, opacity" }}
    />
  )
}
