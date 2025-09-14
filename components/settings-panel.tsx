"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: {
    workTime: number
    shortBreak: number
    longBreak: number
    sessionsUntilLongBreak: number
  }
  onSettingsChange: (settings: any) => void
  onReset: () => void
}

export function SettingsPanel({ isOpen, onClose, settings, onSettingsChange, onReset }: SettingsPanelProps) {
  if (!isOpen) return null

  const handleSettingChange = (key: string, value: number) => {
    const clampedValue = Math.max(
      1,
      Math.min(value, key === "workTime" || key === "longBreak" ? 60 : key === "shortBreak" ? 30 : 8),
    )
    onSettingsChange({
      ...settings,
      [key]: clampedValue,
    })
  }

  const handleSave = () => {
    onReset()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="rounded-full w-8 h-8 p-0 text-white hover:bg-white/10"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workTime" className="text-sm font-medium text-white">
              Work Time (minutes)
            </Label>
            <Input
              id="workTime"
              type="number"
              min="1"
              max="60"
              value={settings.workTime}
              onChange={(e) => handleSettingChange("workTime", Number.parseInt(e.target.value) || 25)}
              className="rounded-lg bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortBreak" className="text-sm font-medium text-white">
              Short Break (minutes)
            </Label>
            <Input
              id="shortBreak"
              type="number"
              min="1"
              max="30"
              value={settings.shortBreak}
              onChange={(e) => handleSettingChange("shortBreak", Number.parseInt(e.target.value) || 5)}
              className="rounded-lg bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longBreak" className="text-sm font-medium text-white">
              Long Break (minutes)
            </Label>
            <Input
              id="longBreak"
              type="number"
              min="1"
              max="60"
              value={settings.longBreak}
              onChange={(e) => handleSettingChange("longBreak", Number.parseInt(e.target.value) || 15)}
              className="rounded-lg bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessions" className="text-sm font-medium text-white">
              Sessions Until Long Break
            </Label>
            <Input
              id="sessions"
              type="number"
              min="2"
              max="8"
              value={settings.sessionsUntilLongBreak}
              onChange={(e) => handleSettingChange("sessionsUntilLongBreak", Number.parseInt(e.target.value) || 4)}
              className="rounded-lg bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            onClick={handleSave}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm border border-white/20 transition-all duration-300"
          >
            Save & Reset
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-lg bg-white/5 hover:bg-white/10 border-white/20 text-white hover:text-white transition-all duration-300"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
