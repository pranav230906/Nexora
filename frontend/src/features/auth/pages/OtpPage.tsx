import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'
import { useAppStore } from '@/store/useAppStore'

export const OtpPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const addToast = useToastStore((state) => state.addToast)
  const { isLoading, setLoading } = useAppStore()

  const email = location.state?.email || 'user@example.com'
  const action = location.state?.action || 'signup' // 'signup' or 'reset'

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''))
  const [timer, setTimer] = useState(30)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Resend Timer Countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, '')
    if (!value) return

    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    // Focus next input box
    if (index < 5 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)

      // Focus previous input box
      if (index > 0 && inputsRef.current[index - 1]) {
        inputsRef.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (pastedText.length === 6) {
      const newOtp = pastedText.split('')
      setOtp(newOtp)
      inputsRef.current[5]?.focus()
    }
  }

  const handleResend = async () => {
    setTimer(30)
    addToast({
      type: 'info',
      message: 'A new 6-digit code has been sent to your email.',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) {
      addToast({
        type: 'warning',
        message: 'Please enter all 6 digits.',
      })
      return
    }

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (code === '123456') {
        addToast({
          type: 'success',
          title: 'Code Verified',
          message: 'Verification successful.',
        })

        if (action === 'reset') {
          navigate('/reset-password', { state: { email } })
        } else {
          // Complete signup redirect
          navigate('/login')
        }
      } else {
        throw new Error('Invalid code. Use 123456 for testing.')
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.message || 'OTP check failed.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display font-bold text-3xl tracking-tight text-foreground">
          Verify Code
        </h1>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between gap-2 max-w-xs mx-auto">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              ref={(el) => { inputsRef.current[idx] = el }}
              onChange={(e) => handleChange(e.target, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPaste={handlePaste}
              disabled={isLoading}
              className="w-12 h-12 text-center text-xl font-bold bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          ))}
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Verify OTP
        </Button>
      </form>

      {/* Footer Timer */}
      <div className="text-center text-sm text-muted-foreground">
        {timer > 0 ? (
          <span>Resend code in <span className="font-semibold text-foreground">{timer}s</span></span>
        ) : (
          <button
            onClick={handleResend}
            className="text-primary font-semibold hover:underline cursor-pointer"
          >
            Resend Verification Code
          </button>
        )}
      </div>
    </div>
  )
}

export default OtpPage
