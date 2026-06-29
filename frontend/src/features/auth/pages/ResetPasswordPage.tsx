import React from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { InputField } from '@/components/form/InputField'
import { Button } from '@/components/ui/Button'
import { PasswordStrength } from '../components/PasswordStrength'
import { useToastStore } from '@/store/useToastStore'
import { useAppStore } from '@/store/useAppStore'
import apiClient from '@/services/apiClient'

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const addToast = useToastStore((state) => state.addToast)
  const { isLoading, setLoading } = useAppStore()

  const email = location.state?.email || 'user@example.com'
  const token = location.state?.token || ''

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordVal = watch('password', '')

  const onSubmit = async (data: any) => {
    if (!token) {
      addToast({
        type: 'error',
        message: 'Password reset token is missing. Please start over.',
      })
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/auth/reset-password/', {
        token,
        password: data.password,
      })

      addToast({
        type: 'success',
        title: 'Password Reset',
        message: 'Your password has been successfully reset. Please login with your new credentials.',
      })

      navigate('/login')
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to reset password.',
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
          New Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new strong password for your account.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <InputField
            label="New Password"
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
          Reset Password
        </Button>
      </form>
    </div>
  )
}

export default ResetPasswordPage
