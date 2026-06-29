import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactElement
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('auth_token')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
