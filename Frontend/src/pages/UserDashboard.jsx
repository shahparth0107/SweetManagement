import { useEffect, useState } from 'react'
import { SweetsAPI } from '../api/client'
import {
  Box, Grid, Paper, TextField, InputAdornment, IconButton, Typography
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SweetCard from '../components/SweetCard'
import { useSnackbar } from 'notistack'

export default function UserDashboard(){
  const { enqueueSnackbar } = useSnackbar()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await SweetsAPI.list()
      setItems(data.sweets)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const runSearch = async () => {
    if (!q.trim()) return load()
    setLoading(true)
    try {
      const { data } = await SweetsAPI.search({ q })
      setItems(data.sweets)
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || 'Search failed', { variant: 'error' })
    } finally { setLoading(false) }
  }

  const purchase = async (sweet) => {
    try {
      const { data } = await SweetsAPI.purchase(sweet._id, 1)
      setItems(prev => prev.map(s => s._id === sweet._id ? data.sweet : s))
      enqueueSnackbar('Purchased!', { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || 'Purchase failed', { variant: 'error' })
    }
  }

  return (
    <Box sx={{ mx: 'auto', maxWidth: 1200, p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
        Browse Sweets
      </Typography>

      <Paper sx={{ p: 2, mb: 3, mx: 'auto', maxWidth: 720 }}>
        <TextField
          fullWidth size="small" placeholder="Search sweets..."
          value={q} onChange={e=>setQ(e.target.value)}
          onKeyDown={(e)=> e.key==='Enter' && runSearch()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={runSearch}><SearchIcon /></IconButton>
              </InputAdornment>
            )
          }}
        />
      </Paper>

      <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center', color: 'text.secondary' }}>
        {loading ? 'Loading…' : `Showing ${items.length} item(s)`}
      </Typography>

      <Grid container spacing={2}>
        {items.map(s => (
          <Grid key={s._id} item xs={12} sm={6} md={4} lg={3}>
            <SweetCard sweet={s} onPurchase={purchase} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
