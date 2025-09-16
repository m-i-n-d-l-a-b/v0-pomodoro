"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Headphones, Clock, Zap } from "lucide-react"

interface IntroductionPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function IntroductionPopup({ isOpen, onClose }: IntroductionPopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Small delay for smooth animation
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div 
        className={`relative w-full max-w-sm bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="relative p-3 border-b border-white/10">
          <h2 className="text-sm font-bold text-white text-center w-full">Welcome to POMOPULSE</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-full w-6 h-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-3 items-stretch">
            {/* Left Column */}
            <div className="space-y-3 h-full">
              {/* Pomodoro Explanation */}
              <div className="bg-white/5 rounded-lg p-2 border border-white/10 h-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-white/80" />
                    <h3 className="text-xs font-semibold text-white">Pomodoro Technique</h3>
                  </div>
                  <p className="text-white/80 text-xs leading-relaxed">
                    Work in focused 25-minute sessions followed by short breaks. This technique 
                    helps maintain concentration and prevents burnout. You can customize work,
                    short break, and long break durations in Settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3 h-full">
              {/* Brainwave Entrainment Explanation */}
              <div className="bg-white/5 rounded-lg p-2 border border-white/10 h-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-white/80" />
                    <h3 className="text-xs font-semibold text-white">Brainwave Types</h3>
                  </div>
                  <p className="text-white/80 text-xs leading-relaxed">
                    Binaural beats synchronize your brainwaves to specific frequencies:
                  </p>
                  <ul className="space-y-1">
                    <li className="flex items-start gap-2 text-white/70 text-xs">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mt-1"></span>
                      <span className="flex-1"><span className="text-white">Alpha (8-13 Hz):</span> relaxed focus, creativity, and flow state.</span>
                    </li>
                    <li className="flex items-start gap-2 text-white/70 text-xs">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400 mt-1"></span>
                      <span className="flex-1"><span className="text-white">Beta (13-30 Hz):</span> active concentration and problem-solving.</span>
                    </li>
                    <li className="flex items-start gap-2 text-white/70 text-xs">
                      <span className="inline-block w-2 h-2 rounded-full bg-purple-400 mt-1"></span>
                      <span className="flex-1"><span className="text-white">Gamma (30+ Hz):</span> peak performance and memory formation.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {/* Best Results - full width */}
          <div className="mt-3 bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-2 border border-white/10">
            <div className="flex items-start gap-2">
              <Headphones className="w-3 h-3 text-white/80 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white text-xs mb-1">For Best Results</h4>
                <p className="text-white/70 text-xs leading-relaxed">
                  Use stereo headphones or earbuds to experience the full binaural beat effect. The left and right
                  channels create the frequency difference that entrains your brainwaves.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pt-0">
          <Button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg py-2 text-xs transition-all duration-200"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}
