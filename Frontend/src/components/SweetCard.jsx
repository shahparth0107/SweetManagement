import { useState } from 'react'
import {
  Card, CardMedia, CardContent, CardActions,
  Typography, Button, Stack, Chip, Box
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop';

export default function SweetCard({ sweet, onPurchase }) {
  const [loading, setLoading] = useState(false)
  const out = sweet.quantity <= 0

  return (
    <Card
      elevation={1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        transition: 'transform .15s ease, box-shadow .15s ease',
        '&:hover': { transform: { md:'translateY(-2px)' }, boxShadow: 6 }
      }}
    >
      {/* responsive image (16:10) */}
      <Box sx={{ position: 'relative', pt: '62%', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          alt={sweet.name}
          src={sweet.imageUrl || FALLBACK_IMG}
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; e.currentTarget.onerror = null; }}
          sx={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
        />
        <Chip
          label={sweet.category}
          size="small"
          sx={{ position:'absolute', top:8, left:8, bgcolor:'rgba(255,255,255,.85)', backdropFilter:'blur(6px)' }}
        />
        {out && <Chip label="OUT OF STOCK" size="small" color="error" sx={{ position:'absolute', top:8, right:8 }} />}
      </Box>

      <CardContent sx={{ flex: 1 }}>
        <Stack spacing={0.75}>
          <Typography variant="h6" noWrap>{sweet.name}</Typography>
          <Typography variant="body2" color="text.secondary">Price: ₹{sweet.price}</Typography>
          <Typography variant="body2" color={out ? 'error.main' : 'text.secondary'}>Stock: {sweet.quantity}</Typography>
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          size="large"
          startIcon={<ShoppingCartIcon />}
          disabled={out || loading}
          onClick={async () => { setLoading(true); try { await onPurchase(sweet) } finally { setLoading(false) } }}
          variant="contained"
        >
          {out ? 'Out of stock' : 'Purchase'}
        </Button>
      </CardActions>
    </Card>
  )
}
