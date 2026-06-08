import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    const loginPath = role === 'teacher' ? '/login/teacher' : '/login/student'
    return <Navigate to={loginPath} replace />
  }

  if (role && user.role !== role) {
    // Redirect to the correct portal — students cannot access teacher routes and vice versa
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />
  }

  return children
}
