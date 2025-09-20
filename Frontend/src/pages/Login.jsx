import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import AuthShell from '../components/AuthShell';

export default function Login() {
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Check if already logged in
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
    // Prevent login if already logged in
    const saved = localStorage.getItem('auth:user');
    if (saved) {
      enqueueSnackbar('Please logout before logging in with a different account.', { variant: 'error' });
      setBlocked(true);
      return;
    }
    setLoading(true);
    try {
      const u = await login(email, password);
      enqueueSnackbar('Welcome!', { variant: 'success' });
      nav(u.role === 'admin' ? '/admin' : '/user', { replace: true });
    } catch (e) {
      enqueueSnackbar(
        e?.response?.data?.error || e?.response?.data?.message || e.message || 'Login failed',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-container">
      <AuthShell title="LOGIN" subtitle="LOGIN">
        <form onSubmit={submit}>
          <Stack spacing={2}>
            <TextField label="Email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={blocked} />
            <TextField label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={blocked} />
            <Button type="submit" disabled={loading || blocked} variant="contained" size="large">
              Login
            </Button>

            <Typography variant="body2" sx={{ mt: 1 }}>
              New here? <Link to="/register">Create an account</Link>
            </Typography>
          </Stack>
        </form>
      </AuthShell>
    </div>
  );
}
        // </form>
//       </AuthShell>
//     </div>
//   );
// }
