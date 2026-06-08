import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import PortalSelectPage from './pages/auth/PortalSelectPage'
import TeacherLoginPage from './pages/auth/TeacherLoginPage'
import StudentLoginPage from './pages/auth/StudentLoginPage'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import StudentManagement from './pages/teacher/StudentManagement'
import TeamManagement from './pages/teacher/TeamManagement'
import ProjectManagement from './pages/teacher/ProjectManagement'
import GuideManagement from './pages/teacher/GuideManagement'
import AllocationControl from './pages/teacher/AllocationControl'
import CSVUploadPage from './pages/teacher/CSVUploadPage'
import ReportsPage from './pages/teacher/ReportsPage'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfile from './pages/student/StudentProfile'
import TeamView from './pages/student/TeamView'
import AllocationView from './pages/student/AllocationView'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Portal selection */}
      <Route path="/login" element={
        user
          ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />
          : <PortalSelectPage />
      } />
      <Route path="/login/teacher" element={
        user?.role === 'teacher'
          ? <Navigate to="/teacher" replace />
          : user
            ? <Navigate to="/student" replace />
            : <TeacherLoginPage />
      } />
      <Route path="/login/student" element={
        user?.role === 'student'
          ? <Navigate to="/student" replace />
          : user
            ? <Navigate to="/teacher" replace />
            : <StudentLoginPage />
      } />

      {/* Teacher Routes — students are blocked automatically */}
      <Route path="/teacher" element={<ProtectedRoute role="teacher"><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="teams" element={<TeamManagement />} />
        <Route path="projects" element={<ProjectManagement />} />
        <Route path="guides" element={<GuideManagement />} />
        <Route path="allocation" element={<AllocationControl />} />
        <Route path="csv" element={<CSVUploadPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Student Routes — teachers are blocked automatically */}
      <Route path="/student" element={<ProtectedRoute role="student"><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="team" element={<TeamView />} />
        <Route path="allocation" element={<AllocationView />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
