import React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { InputField } from '@/components/form/InputField'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'
import { useAppStore } from '@/store/useAppStore'

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)
  const { isLoading, setLoading } = useAppStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      addToast({
        type: 'success',
        title: 'OTP Code Sent',
        message: 'Check your email inbox for a 6-digit verification code.',
      })

      // Navigate to OTP page for resetting
      navigate('/otp-verification', { state: { email: data.email, action: 'reset' } })
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Something went wrong.',
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
          Recover Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send a code to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          disabled={isLoading}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Send Reset Code
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mt-4">
        Remember your password?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
