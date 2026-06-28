import React from 'react'
import { Button } from '@/components/ui/Button'

interface GoogleLoginButtonProps {
  onClick: () => void
  isLoading?: boolean
  label?: string
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onClick,
  isLoading = false,
  label = 'Continue with Google',
}) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      isLoading={isLoading}
      className="w-full h-10 flex items-center justify-center gap-2 border border-border bg-card hover:bg-secondary text-sm font-semibold transition-all shadow-sm rounded-md"
      leftIcon={
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.745 1.059 15.014 0 12 0 7.354 0 3.373 2.664 1.455 6.545l3.81 3.22z"
          />
          <path
            fill="#4285F4"
            d="M23.455 12.273c0-.818-.082-1.609-.227-2.364H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.525-5.17 3.525-8.706z"
          />
          <path
            fill="#FBBC05"
            d="M5.266 14.235A7.16 7.16 0 014.91 12c0-.79.13-1.55.356-2.265L1.455 6.516A11.96 11.96 0 000 12c0 1.927.455 3.755 1.255 5.39l4.01-3.155z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.1 1.16-3.164 0-5.836-2.136-6.79-5.027l-3.99 3.09C3.127 21.036 7.218 24 12 24z"
          />
        </svg>
      }
    >
      {label}
    </Button>
  )
}

export default GoogleLoginButton
