import React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { InputField } from '@/components/form/InputField'
import { Button } from '@/components/ui/Button'
import { PasswordStrength } from '../components/PasswordStrength'
import { useToastStore } from '@/store/useToastStore'
import { useAppStore } from '@/store/useAppStore'

import apiClient from '@/services/apiClient'

export const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)
  const { isLoading, setLoading, setUser } = useAppStore()

  const {
    register,
    handleSubmit,
    watch,
    setError,
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
      // Call register API on Django
      await apiClient.post('/auth/register/', {
        username: data.name,
        email: data.email,
        password: data.password,
        password_confirm: data.confirmPassword,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      })

      addToast({
        type: 'success',
        title: 'Account created!',
        message: 'Please verify your email using the OTP sent to your mailbox.',
      })

      // Navigate to OTP page passing email in state
      navigate('/otp-verification', { state: { email: data.email, action: 'signup' } })
    } catch (err: any) {
      if (err.errors) {
        let hasUsernameError = false
        // Map Django backend validation errors back to react-hook-form fields
        Object.entries(err.errors).forEach(([field, messages]) => {
          const message = Array.isArray(messages) ? messages[0] : messages
          const formField = 
            field === 'username' ? 'name' : 
            field === 'password_confirm' ? 'confirmPassword' : 
            field
          
          setError(formField as any, {
            type: 'server',
            message: message as string,
          })

          if (field === 'username' && (message as string).toLowerCase().includes('exists')) {
            hasUsernameError = true
          }
        })

        if (hasUsernameError) {
          addToast({
            type: 'warning',
            title: 'Username Taken',
            message: 'A user with that username already exists. Please choose a different one.',
          })
        } else {
          addToast({
            type: 'error',
            title: 'Validation Failed',
            message: err.message || 'Please correct the highlighted errors.',
          })
        }
      } else {
        addToast({
          type: 'error',
          title: 'Signup Failed',
          message: err.message || 'Account creation failed. Please try again.',
        })
      }
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
          Join Nexora and escape productivity panic.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Username"
          type="text"
          placeholder="john_doe"
          error={errors.name?.message}
          disabled={isLoading}
          {...register('name', { 
            required: 'Username is required',
            minLength: {
              value: 3,
              message: 'Username must be at least 3 characters long',
            },
            pattern: {
              value: /^[\w@./+-]+$/,
              message: 'Enter a valid username. This value may contain only letters, numbers, and @/./+/-/_ characters.',
            }
          })}
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
