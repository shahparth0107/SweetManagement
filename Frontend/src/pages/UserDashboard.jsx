import { useEffect, useState } from 'react'
import { SweetsAPI } from '../api/client'
import {
    Box, Container, Paper, TextField,
    InputAdornment, IconButton, Typography, Skeleton
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SweetCard from '../components/SweetCard'
import { useSnackbar } from 'notistack'

export default function UserDashboard() {
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
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 12 } }}>
            <Typography variant="h3" sx={{ fontWeight: 900, textAlign: 'center', mb: { xs: 1.5, md: 5 } }}>
                Browse Sweets
            </Typography>

            {/* CENTERED search */}
            <Container maxWidth="md" disableGutters sx={{ mb: { xs: 1.5, md: 2 } }}>
                <Paper sx={{ p: { xs: 1, sm: 1.5 }, borderRadius: 4 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        placeholder="Search sweets..."
                        value={q}
                        onChange={(e) => {
                            const v = e.target.value
                            setQ(v)
                            // ★ Auto-reset when cleared (no Enter needed)
                            if (v.trim() === '') load()
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={runSearch}><SearchIcon /></IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Paper>
            </Container>

            <Typography variant="subtitle2" sx={{ mb: { xs: 1.5, md: 8 }, textAlign: 'center', color: 'text.secondary' }}>
                {loading ? 'Loading…' : `Showing ${items.length} item(s)`}
            </Typography>

            {/* Responsive centered grid */}
            <Box
                sx={{
                    mx: 'auto',
                    display: 'grid',
                    gap: { xs: 1.5, sm: 15 },
                    justifyItems: 'stretch',
                    gridTemplateColumns: {
                        xs: '3fr',
                        sm: 'repeat(2, 3fr)',
                        md: 'repeat(3, 3fr)',
                        lg: 'repeat(4, 3fr)',
                    }
                }}
            >
                {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <Paper key={i} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                            <Skeleton variant="rectangular" height={180} />
                            <Box sx={{ p: 2 }}>
                                <Skeleton width="70%" />
                                <Skeleton width="40%" />
                                <Skeleton width="50%" />
                                <Skeleton width="100%" height={36} sx={{ mt: 1, borderRadius: 1 }} />
                            </Box>
                        </Paper>
                    ))
                    : items.map(s => (
                        <Box key={s._id}>
                            <SweetCard sweet={s} onPurchase={purchase} />
                        </Box>
                    ))
                }
            </Box>
        </Container>
    )
}
