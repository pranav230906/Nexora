import React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { InputField } from '@/components/form/InputField'
import { Button } from '@/components/ui/Button'
import { PasswordStrength } from '../components/PasswordStrength'
import { useToastStore } from '@/store/useToastStore'
import { useAppStore } from '@/store/useAppStore'

export const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)
  const { isLoading, setLoading } = useAppStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordVal = watch('password', '')

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      addToast({
        type: 'success',
        title: 'Account created!',
        message: 'Please verify your email using the OTP sent to your mailbox.',
      })

      // Navigate to OTP page passing email in state
      navigate('/otp-verification', { state: { email: data.email } })
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Account creation failed.',
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
          Create Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join Last Minute Life Saver and escape productivity panic.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Full Name"
          type="text"
          placeholder="John Doe"
          error={errors.name?.message}
          disabled={isLoading}
          {...register('name', { required: 'Name is required' })}
        />

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

        <div className="space-y-1">
          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={isLoading}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            })}
          />
          {passwordVal && <PasswordStrength password={passwordVal} />}
        </div>

        <InputField
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          disabled={isLoading}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === passwordVal || 'Passwords do not match',
          })}
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign Up
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}

export default SignupPage
