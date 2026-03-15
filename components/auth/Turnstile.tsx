'use client'

import { useEffect, useRef, useState } from 'react'

interface TurnstileProps {
  siteKey: string
  onSuccess: (token: string) => void
  onError?: () => void
  onExpire?: () => void
}

export function Turnstile({ siteKey, onSuccess, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Load Turnstile script
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    document.body.appendChild(script)

    return () => {
      // Clean up
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) return

    // Initialize Turnstile
    const id = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => {
        onSuccess(token)
      },
      'error-callback': () => {
        onError?.()
      },
      'expired-callback': () => {
        onExpire?.()
      },
      theme: 'light',
    })

    widgetIdRef.current = id
  }, [isLoaded, siteKey, onSuccess, onError, onExpire])

  return <div ref={containerRef} />
}

// Declare Turnstile on window
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
        theme?: string
      }) => string
      remove: (id: string) => void
      reset: (id?: string) => void
      getResponse: (id?: string) => string
    }
  }
}
