import React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { InputField } from '@/components/form/InputField'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { GoogleLoginButton } from '../components/GoogleLoginButton'
import { useToastStore } from '@/store/useToastStore'
import { useAppStore } from '@/store/useAppStore'
import apiClient from '@/services/apiClient'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)
  const { setUser, setLoading, isLoading } = useAppStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })


  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      // Request real token from Django
      const response = await apiClient.post('/auth/login/', {
        email: data.email,
        password: data.password
      })
      
      const { access, refresh } = response.data
      localStorage.setItem('auth_token', access)
      localStorage.setItem('refresh_token', refresh)
      
      // Retrieve user profile information
      const profileResponse = await apiClient.get('/auth/profile/')
      setUser(profileResponse.data)
      
      addToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have logged in successfully.',
      })
      navigate('/')
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Authentication Failed',
        message: err.message || 'Invalid email or password.',
      })
    } finally {
      setLoading(false)
    }
  }


  React.useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        window.location.hash = ''
        localStorage.setItem('auth_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        
        setLoading(true)
        apiClient.get('/auth/profile/')
          .then((profileResponse) => {
            setUser(profileResponse.data)
            addToast({
              type: 'success',
              title: 'Signed in with Google',
              message: 'Logged in successfully.',
            })
            navigate('/')
          })
          .catch((err) => {
            console.error('Failed to retrieve user profile:', err)
            addToast({
              type: 'error',
              title: 'Google Sign-In Failed',
              message: 'Could not fetch profile details.',
            })
          })
          .finally(() => {
            setLoading(false)
          })
      }
    }
  }, [navigate, setUser, setLoading, addToast])

  const handleGoogleLogin = () => {
    const clientId = '1023743274517-n5q4hviq6h0qdhh1nf3l7i1tmiv9h7tb.apps.googleusercontent.com'
    const redirectUri = window.location.origin.includes('localhost')
      ? 'http://localhost:8000/api/v1/auth/google/callback'
      : 'https://backend-869605153366.us-central1.run.app/api/v1/auth/google/callback'
    const scope = 'openid profile email'
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display font-bold text-3xl tracking-tight text-foreground">
          Sign In
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome to Nexora. Ready to complete tasks?
        </p>
      </div>

      {/* Social login */}
      <GoogleLoginButton onClick={handleGoogleLogin} isLoading={isLoading} />

      {/* Divider */}
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-border" />
        <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase font-bold tracking-wider">
          Or continue with
        </span>
        <div className="flex-grow border-t border-border" />
      </div>

      {/* Form login */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Email Address"
          type="email"
          placeholder="e.g. name@company.com"
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
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            disabled={isLoading}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('password', {
              required: 'Password is required',
            })}
          />
          {errors.password && (
            <span className="text-xs text-destructive font-medium">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Checkbox label="Remember Me" {...(register('rememberMe') as any)} />
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mt-4">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary font-semibold hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
}

export default LoginPage
