"use client"

import * as React from 'react'

import type { BinauralTrack } from '@/lib/audio-engine'
import type { UseBinauralBeatsResult } from '@/hooks/useBinauralBeats'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

interface AudioPlayerProps extends Pick<UseBinauralBeatsResult, 'currentTrack' | 'isPlaying' | 'toggle'> {
  tracks: ReadonlyArray<BinauralTrack>
  engineReady?: boolean
}

export function AudioPlayer({
  tracks,
  currentTrack,
  isPlaying,
  toggle,
  engineReady = true,
}: AudioPlayerProps): React.ReactElement {
  const [trackName, setTrackName] = React.useState<string>(currentTrack ?? '')

  React.useEffect(() => {
    if (!engineReady || trackName !== '') {
      return
    }

    const defaultTrack = tracks.find((track) => {
      if (typeof track?.name !== 'string') {
        return false
      }
      return track.name.trim() !== ''
    })

    if (typeof defaultTrack?.name === 'string' && defaultTrack.name.trim() !== '') {
      setTrackName(defaultTrack.name)
    }
  }, [engineReady, trackName, tracks])

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setTrackName(event.target.value)
  }

  const handleToggle = (): void => {
    if (trackName === '' || !engineReady) {
      return
    }
    void toggle(trackName).catch((error: unknown) => {
      const message = error instanceof Error && error.message ? error.message : 'Unknown error'
      console.error(`Unable to toggle binaural beats: ${message}`)
    })
  }

  const isCurrentTrack = isPlaying && currentTrack === trackName
  const controlsDisabled = !engineReady || trackName === ''

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <Select
        aria-label="Binaural track"
        value={trackName}
        onChange={handleChange}
        disabled={!engineReady}
        className="sm:w-48"
      >
        <option value="" disabled>
          Select track
        </option>
        {tracks.map((track) => {
          const name = track?.name ?? ''
          if (name === '') {
            return null
          }
          return (
            <option key={name} value={name}>
              {name}
            </option>
          )
        })}
      </Select>
      <Button
        type="button"
        aria-label={isCurrentTrack ? 'Pause track' : 'Play track'}
        onClick={handleToggle}
        disabled={controlsDisabled}
      >
        {isCurrentTrack ? 'Pause' : 'Play'}
      </Button>
    </div>
  )
}
