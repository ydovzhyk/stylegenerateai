'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

function formatAudioTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/** Compact h-10 music preview — matches Select / secondary Button height. */
export default function CompactAudioPlayer({ src }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [src])

  if (!src) return null

  const togglePlayback = async () => {
    const node = audioRef.current
    if (!node) return
    if (node.paused) {
      try {
        await node.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
      return
    }
    node.pause()
    setIsPlaying(false)
  }

  return (
    <div className="flex h-10 w-full items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-2.5">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onLoadedMetadata={(event) => {
          setDuration(Number(event.currentTarget.duration) || 0)
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(Number(event.currentTarget.currentTime) || 0)
        }}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition hover:bg-white/[0.14]"
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
      </button>

      <input
        type="range"
        min="0"
        max={duration > 0 ? duration : 1}
        step="0.1"
        value={Math.min(currentTime, duration || 0)}
        aria-label="Music position"
        onChange={(event) => {
          const next = Number(event.target.value)
          const node = audioRef.current
          if (node && Number.isFinite(next)) {
            node.currentTime = next
          }
          setCurrentTime(next)
        }}
        className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-white [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      />

      <span className="shrink-0 tabular-nums text-[11px] text-white/55">
        {formatAudioTime(currentTime)}
        {duration > 0 ? ` / ${formatAudioTime(duration)}` : ''}
      </span>
    </div>
  )
}
