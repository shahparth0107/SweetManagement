import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'
import { AppBar, Toolbar, Button, Box } from '@mui/material'
import { useAuth } from './context/AuthContext'

function Nav() {
  const { user, logout } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Button onClick={() => nav(user ? (user.role === 'admin' ? '/admin' : '/user') : '/login')}
                color="primary" variant="text">Sweet Shop</Button>
        {user?.role === 'admin' && (
          <Button onClick={() => nav('/admin')}
                  color="primary" variant={loc.pathname.startsWith('/admin') ? 'contained' : 'text'}>
            Admin
          </Button>
        )}
        {user?.role === 'user' && (
          <Button onClick={() => nav('/user')}
                  color="primary" variant={loc.pathname.startsWith('/user') ? 'contained' : 'text'}>
            Dashboard
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {!user ? (
          <>
            <Button onClick={() => nav('/login')}>Login</Button>
            <Button onClick={() => nav('/register')} color="secondary" variant="contained">Register</Button>
          </>
        ) : (
          <>
            <Box sx={{ mr: 1, fontSize: 14, color: 'text.secondary' }}>{user.username} • {user.role}</Box>
            <Button onClick={logout}>Logout</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        {/* Landing goes to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User dashboard (requires any logged-in user) */}
        <Route path="/user" element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        } />

        {/* Admin dashboard */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <Admin />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}
