import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
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
    <AppBar position="sticky" elevation={0}
      sx={{ bgcolor:'background.paper', color:'text.primary', borderBottom:1, borderColor:'divider' }}>
      <Toolbar
        sx={{
          px: { xs: 1.5, sm: 2 },
          gap: 1,
          minHeight: { xs: 56, sm: 60 },
        }}
      >
        {/* LEFT: Brand */}
        <Button
          onClick={() => nav(user ? (user.role === 'admin' ? '/admin' : '/user') : '/login')}
          color="primary" variant="text"
          sx={{ fontWeight: 700, letterSpacing: .4 }}
        >
          SWEET SHOP
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {/* RIGHT: shortcuts + auth (trim on small screens) */}
        <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
          {!!user && (
            <Button
              onClick={() => nav(user.role === 'admin' ? '/admin' : '/user')}
              color="primary"
              variant={loc.pathname.startsWith(`/${user.role === 'admin' ? 'admin' : 'user'}`) ? 'contained' : 'text'}
              sx={{ px: { xs: 1.25, sm: 2 } }}
            >
              Dashboard
            </Button>
          )}

          {!user ? (
            <>
              <Button onClick={() => nav('/login')} sx={{ display: { xs:'none', sm:'inline-flex' } }}>
                Login
              </Button>
              <Button onClick={() => nav('/register')} color="secondary" variant="contained" size="small">
                Register
              </Button>
            </>
          ) : (
            <>
              <Box sx={{ fontSize: 13, color:'text.secondary', display:{ xs:'none', md:'block' } }}>
                {user.username} • {user.role}
              </Box>
              <Button onClick={logout} size="small">Logout</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

/** Shared centered frame for app pages (not used for Login/Register) */
function MainFrame() {
  return (
    <main style={{
      display:'flex',
      justifyContent:'center',
      padding:'8px 16px'
    }}>
      <div style={{ width:'100%', maxWidth:1200 }}>
        <Outlet />
      </div>
    </main>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        {/* Auth pages: full-bleed so the card can center perfectly */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Everything else uses the centered frame */}
        <Route element={<MainFrame />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/user" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </>
  )
}
