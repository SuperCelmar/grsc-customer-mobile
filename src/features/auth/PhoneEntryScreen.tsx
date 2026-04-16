import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function PhoneEntryScreen() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validatePhone = (p: string) => /^[6-9]\d{9}$/.test(p)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number')
      return
    }
    setLoading(true)
    try {
      // DEV bypass: skip Supabase OTP when Twilio isn't configured
      const testPhone = import.meta.env.DEV ? import.meta.env.VITE_TEST_PHONE : undefined
      if (testPhone && phone === testPhone) {
        navigate('/otp', { state: { phone } })
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: '+91' + phone,
        options: { channel: 'sms' }
      })
      if (error) {
        if (error.message.includes('rate') || error.message.includes('limit')) {
          setError('SMS limit reached. Try again in an hour.')
        } else {
          setError(error.message)
        }
        return
      }
      navigate('/otp', { state: { phone } })
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-white">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold text-primary mb-1">GoldRush</h1>
        <p className="text-text-secondary text-sm">Sports Coffee</p>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-text-dark mb-1">Welcome back</h2>
        <p className="text-text-secondary">Enter your phone number to continue</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex mb-1">
          <span className="flex items-center px-3 bg-muted border border-r-0 border-card rounded-l-md text-text-secondary text-sm font-medium">+91</span>
          <input
            type="tel" inputMode="numeric" maxLength={10}
            value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="9876543210"
            className="flex-1 h-11 px-3 border border-card rounded-r-md text-text-dark placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
          />
        </div>
        {error && <p className="text-error text-sm mt-1 mb-3">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full h-11 mt-4 bg-primary text-white font-semibold rounded-md text-base disabled:opacity-60 active:scale-95 transition-transform">
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </form>
    </div>
  )
}
