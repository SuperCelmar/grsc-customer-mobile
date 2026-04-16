import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export function OTPVerificationScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setDevSession } = useAuth()
  const phone = (location.state as { phone?: string })?.phone || ''
  const testPhone = import.meta.env.DEV ? import.meta.env.VITE_TEST_PHONE : undefined
  const testOtp = import.meta.env.DEV ? import.meta.env.VITE_TEST_OTP : undefined
  const isTestPhone = testPhone && phone === testPhone

  const [digits, setDigits] = useState<string[]>(() =>
    isTestPhone && testOtp ? testOtp.split('') : ['', '', '', '', '', '']
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!phone) navigate('/login', { replace: true })
  }, [phone, navigate])

  // Auto-submit for test phone
  useEffect(() => {
    if (isTestPhone && testOtp && testOtp.length === 6) {
      verify(testOtp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleDigit = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
    if (next.every(d => d) && val) verify(next.join(''))
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const verify = async (otp: string) => {
    if (!phone) { navigate('/login'); return }
    setLoading(true); setError('')
    try {
      // DEV bypass: skip Supabase verifyOtp when Twilio isn't configured.
      // Uses a mock session — authenticated API calls will return 401, but UI is testable.
      if (isTestPhone && testOtp && otp === testOtp) {
        setDevSession(phone)
        navigate('/dashboard', { replace: true })
        return
      }

      const { error } = await supabase.auth.verifyOtp({ phone: '+91' + phone, token: otp, type: 'sms' })
      if (error) {
        if (error.message.includes('expired')) setError('Code expired. Request a new one.')
        else if (error.message.includes('attempts') || error.message.includes('rate')) setError('Too many attempts. Try again in 5 minutes.')
        else setError('Invalid code. Please try again.')
        setDigits(['', '', '', '', '', ''])
        refs.current[0]?.focus()
      } else {
        navigate('/dashboard', { replace: true })
      }
    } finally { setLoading(false) }
  }

  const resend = async () => {
    await supabase.auth.signInWithOtp({ phone: '+91' + phone, options: { channel: 'sms' } })
    setCountdown(30); setCanResend(false); setDigits(['', '', '', '', '', '']); setError('')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-white">
      <button onClick={() => navigate('/login')} className="text-text-secondary text-sm mb-8 self-start">← Back</button>
      <h2 className="text-2xl font-semibold text-text-dark mb-1">Enter verification code</h2>
      <p className="text-text-secondary mb-8">Sent to +91 {phone}</p>
      <div className="flex gap-3 mb-4 justify-center">
        {digits.map((d: string, i: number) => (
          <input key={i} ref={el => { refs.current[i] = el }}
            type="tel" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="w-12 h-14 text-center text-xl font-semibold border-2 border-card rounded-md focus:border-primary focus:outline-none"
          />
        ))}
      </div>
      {error && <p className="text-error text-sm text-center mb-3">{error}</p>}
      <div className="text-center text-sm text-text-secondary mt-2">
        {canResend
          ? <button onClick={resend} className="text-primary font-medium">Resend OTP</button>
          : <span>Resend in 0:{String(countdown).padStart(2, '0')}</span>
        }
      </div>
      {loading && <p className="text-center text-text-secondary text-sm mt-4">Verifying...</p>}
    </div>
  )
}
