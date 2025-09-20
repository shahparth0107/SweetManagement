import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import AuthShell from '../components/AuthShell';

export default function Register() {
  const { register } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Block registration if already logged in
    const saved = localStorage.getItem('auth:user');
    if (saved) {
      enqueueSnackbar('Already logged in. Please logout first.', { variant: 'error' });
      setBlocked(true);
      const user = JSON.parse(saved).user;
      setTimeout(() => nav(user.role === 'admin' ? '/admin' : '/user'), 1200);
    }
  }, [nav, enqueueSnackbar]);

  const submit = async (e) => {
    e.preventDefault();
    // Prevent register if already logged in
    const saved = localStorage.getItem('auth:user');
    if (saved) {
      enqueueSnackbar('Please logout before registering a new account.', { variant: 'error' });
      setBlocked(true);
      return;
    }
    setLoading(true);
    try {
      await register({ username, email, password });
      enqueueSnackbar('Registered! Please login.', { variant: 'success' });
      nav('/login', { replace: true });
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || 'Register failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="CREATE ACCOUNT" subtitle="SIGN UP">
      <form onSubmit={submit}>
        <Stack spacing={2}>
          <TextField label="Username" required value={username} onChange={(e) => setUsername(e.target.value)} disabled={blocked} />
          <TextField label="Email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={blocked} />
          <TextField label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={blocked} />
          <Button type="submit" disabled={loading || blocked} color="secondary" variant="contained" size="large">
            Register
          </Button>
          <Typography variant="body2">
            Already have an account? <Link to="/login">Login</Link>
          </Typography>
        </Stack>
      </form>
    </AuthShell>
  );
}
