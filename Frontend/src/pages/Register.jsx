import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'

export default function Register(){
  const { register } = useAuth()
  const { enqueueSnackbar } = useSnackbar()
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register({ username, email, password }) // note: backend requires letters+numbers (no special chars unless you changed regex)
      enqueueSnackbar('Registered! Please login.', { variant: 'success' })
      nav('/login', { replace: true })
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || 'Register failed', { variant: 'error' })
    } finally { setLoading(false) }
  }

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      px: 2
    }}>
      <Paper elevation={1} sx={{ p: 3, width: '100%', maxWidth: 460 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Create account</Typography>
        <form onSubmit={submit}>
          <Stack spacing={2}>
            <TextField label="Username" required value={username} onChange={e=>setUsername(e.target.value)} />
            <TextField label="Email" required value={email} onChange={e=>setEmail(e.target.value)} />
            <TextField label="Password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} />
            <Button type="submit" disabled={loading} color="secondary" variant="contained" size="large">Register</Button>
            <Typography variant="body2">Already have an account? <Link to="/login">Login</Link></Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
