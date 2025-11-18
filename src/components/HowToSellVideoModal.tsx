'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X, PlayCircle, Loader2, AlertCircle } from 'lucide-react'
import Hls from 'hls.js'

interface HowToSellVideoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HowToSellVideoModal({ isOpen, onClose }: HowToSellVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!isOpen || !videoRef.current) return

    const videoUrl = 'https://stream.mux.com/dtcED00t6ASUpGg012pU5bFNmOQNQtIu3YyoJr7myCusk.m3u8'
    const video = videoRef.current

    setLoading(true)
    setError(false)

    // Check if HLS is supported natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl
      video.addEventListener('loadeddata', () => setLoading(false))
      video.addEventListener('error', () => {
        setLoading(false)
        setError(true)
      })
    }
    // Check if HLS.js is supported
    else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })

      hls.loadSource(videoUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false)
        video.play().catch(err => console.log('Autoplay prevented:', err))
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setLoading(false)
          setError(true)
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error encountered, trying to recover...')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error encountered, trying to recover...')
              hls.recoverMediaError()
              break
            default:
              console.error('Fatal error encountered, destroying HLS instance')
              hls.destroy()
              break
          }
        }
      })

      hlsRef.current = hls
    } else {
      console.error('HLS is not supported in this browser')
      setLoading(false)
      setError(true)
    }

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Blue-Orange Gradient */}
        <div className="relative bg-gradient-to-r from-[#2c6ba8] via-[#4a8fcf] to-[#f5a623] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl shadow-lg">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-sm">
                  วิธีการขาย
                </h2>
                <p className="text-xs text-white/90 mt-0.5 drop-shadow-sm">
                  แนะนำการใช้งานระบบ
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 group backdrop-blur-sm"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white group-hover:rotate-90 transition-all duration-200 drop-shadow" />
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-sm text-gray-400">กำลังโหลดวิดีโอ...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center space-y-4 px-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-white mb-1">ไม่สามารถโหลดวิดีโอได้</p>
                  <p className="text-xs text-gray-400">กรุณาลองใหม่อีกครั้ง</p>
                </div>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            playsInline
            controlsList="nodownload"
          />
        </div>

        {/* Footer with info */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">
                คู่มือการใช้งานสำหรับผู้ขาย
              </p>
              <p className="text-xs text-gray-600">
                เรียนรู้วิธีการขาย จัดการทริป และเพิ่มยอดขายอย่างมีประสิทธิภาพผ่านระบบของเรา
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
