'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

interface CaptchaProps {
  onVerified: (isVerified: boolean) => void
  onReset?: () => void
}

export function Captcha({ onVerified, onReset }: CaptchaProps) {
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [answer, setAnswer] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1)
    setNum2(Math.floor(Math.random() * 10) + 1)
    setAnswer('')
    setIsVerified(false)
    setError('')
    onVerified(false)
    onReset?.()
  }

  useEffect(() => {
    generateCaptcha()
  }, [])

  const verifyCaptcha = () => {
    const userAnswer = parseInt(answer)
    const correctAnswer = num1 + num2

    if (isNaN(userAnswer)) {
      setError('Please enter a number')
      onVerified(false)
      return
    }

    if (userAnswer === correctAnswer) {
      setIsVerified(true)
      setError('')
      onVerified(true)
    } else {
      setError('Incorrect answer. Please try again.')
      setIsVerified(false)
      onVerified(false)
    }
  }

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value)
    if (isVerified) {
      setIsVerified(false)
      onVerified(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isVerified) {
        generateCaptcha()
      } else {
        verifyCaptcha()
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg">
          <span className="text-lg font-mono font-medium">
            {num1} + {num2} = ?
          </span>
        </div>
        <button
          type="button"
          onClick={generateCaptcha}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Get new challenge"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={answer}
          onChange={handleAnswerChange}
          onKeyPress={handleKeyPress}
          onBlur={verifyCaptcha}
          placeholder="Your answer"
          className={`flex-1 px-3 py-2 border rounded-md text-sm ${
            error ? 'border-red-500 focus:ring-red-500' :
            isVerified ? 'border-green-500 focus:ring-green-500' :
            'focus:ring-blue-500'
          }`}
        />
        {isVerified && (
          <div className="text-green-500 font-medium text-sm">✓ Verified</div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
