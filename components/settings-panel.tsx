"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface PomodoroSettings {
  workTime: number
  shortBreak: number
  longBreak: number
  sessionsUntilLongBreak: number
}

type SettingsKey = keyof PomodoroSettings

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  settings: PomodoroSettings
  onSettingsChange: (settings: PomodoroSettings) => void
  onReset: () => void
}

export function SettingsPanel({ isOpen, onClose, settings, onSettingsChange, onReset }: SettingsPanelProps): JSX.Element | null {
  if (!isOpen) return null

  const handleSettingChange = (key: SettingsKey, value: number): void => {
    const clampedValue = Math.max(
      1,
      Math.min(value, key === "workTime" || key === "longBreak" ? 60 : key === "shortBreak" ? 30 : 8),
    )
    onSettingsChange({
      ...settings,
      [key]: clampedValue,
    })
  }

  const handleSave = (): void => {
    onReset()
    onClose()
  }

  return (
    <div className="fixed right-4 top-4 z-50">
      <div className="bg-black border border-white/20 shadow-2xl p-6 rounded-xl w-[320px]">
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
            <Label htmlFor="workTime" className="text-white">
              Work Time (minutes)
            </Label>
            <Input
              id="workTime"
              type="number"
              min="1"
              max="60"
              value={settings.workTime}
              onChange={(event) =>
                handleSettingChange("workTime", Number.parseInt(event.target.value, 10) || 25)
              }
              className="bg-black/50 border-white/20 text-white focus:border-white/40 focus:ring-white/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortBreak" className="text-white">
              Short Break (minutes)
            </Label>
            <Input
              id="shortBreak"
              type="number"
              min="1"
              max="30"
              value={settings.shortBreak}
              onChange={(event) =>
                handleSettingChange("shortBreak", Number.parseInt(event.target.value, 10) || 5)
              }
              className="bg-black/50 border-white/20 text-white focus:border-white/40 focus:ring-white/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longBreak" className="text-white">
              Long Break (minutes)
            </Label>
            <Input
              id="longBreak"
              type="number"
              min="1"
              max="60"
              value={settings.longBreak}
              onChange={(event) =>
                handleSettingChange("longBreak", Number.parseInt(event.target.value, 10) || 15)
              }
              className="bg-black/50 border-white/20 text-white focus:border-white/40 focus:ring-white/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessions" className="text-white">
              Sessions Until Long Break
            </Label>
            <Input
              id="sessions"
              type="number"
              min="2"
              max="8"
              value={settings.sessionsUntilLongBreak}
              onChange={(event) =>
                handleSettingChange(
                  "sessionsUntilLongBreak",
                  Number.parseInt(event.target.value, 10) || 4,
                )
              }
              className="bg-black/50 border-white/20 text-white focus:border-white/40 focus:ring-white/20"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            onClick={handleSave}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white"
            variant="outline"
          >
            Save & Reset
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="flex-1 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
