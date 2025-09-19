import { useEffect, useMemo, useState } from 'react'
import { SweetsAPI } from '../api/client'
import SweetCard from '../components/SweetCard'
import { Box, Container, Grid, TextField, InputAdornment, IconButton, Typography, Paper } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useSnackbar } from 'notistack'
import { useAuth } from '../context/AuthContext'

export default function Home(){
  const { enqueueSnackbar } = useSnackbar()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')

  const loadAll = async () => {
    setLoading(true)
    try {
      const { data } = await SweetsAPI.list() // { sweets }
      setItems(data.sweets)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const search = async () => {
    if (!q.trim()) return loadAll()
    setLoading(true)
    try {
      const { data } = await SweetsAPI.search({ q })
      setItems(data.sweets)
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || 'Search failed', { variant: 'error' })
    } finally { setLoading(false) }
  }

  const purchase = async (sweet) => {
    if (!user) { enqueueSnackbar('Please login to purchase', { variant: 'info' }); return; }
    const { data } = await SweetsAPI.purchase(sweet._id, 1) // reduce by 1
    setItems(prev => prev.map(s => s._id === sweet._id ? data.sweet : s))
    enqueueSnackbar('Purchased!', { variant: 'success' })
  }

  return (
    <div className="home-center-container">
      <Container
        maxWidth={false}
        sx={{
          mt: 2,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2
        }}
      >
        <Typography variant="h3" align="center" sx={{ mb: 2, fontWeight: 700 }}>
          Browse Sweets
        </Typography>
        <Paper sx={{ p: 2, mb: 3, width: '100%', maxWidth: 700, mx: 'auto', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth size="small" placeholder="Search sweets..."
            value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={(e)=> e.key==='Enter' && search()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={search}><SearchIcon /></IconButton>
                </InputAdornment>
              )
            }}
          />
        </Paper>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {loading ? 'Loading…' : `Showing ${items.length} item(s)`}
        </Typography>

        <Grid
          container
          spacing={3}
          justifyContent="center"
          sx={{
            maxWidth: '100px', // Set your desired max width for the grid
            margin: '0 auto'
          }}
        >
          {items.map(s => (
            <Grid key={s._id} item xs={12} sm={6} md={4} lg={3}>
              <SweetCard sweet={s} onPurchase={purchase} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </div>
  )
}
