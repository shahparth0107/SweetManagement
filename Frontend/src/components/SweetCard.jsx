import { Card, CardMedia, CardContent, CardActions, Typography, Button, Stack } from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { useState } from 'react'

export default function SweetCard({ sweet, onPurchase }) {
  const [loading, setLoading] = useState(false)
  const out = sweet.quantity <= 0

  return (
    <Card sx={{ height: '100%', display:'flex', flexDirection:'column' }} elevation={1}>
      <CardMedia component="img" height="160" image={sweet.imageUrl} alt={sweet.name} />
      <CardContent sx={{ flex: 1 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" noWrap>{sweet.name}</Typography>
          <Typography variant="body2" color="text.secondary">{sweet.category}</Typography>
          <Typography variant="body2">Price: ₹{sweet.price}</Typography>
          <Typography variant="body2" color={out ? 'error.main' : 'text.secondary'}>Stock: {sweet.quantity}</Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button fullWidth startIcon={<ShoppingCartIcon />} disabled={out || loading}
          onClick={async ()=>{ setLoading(true); try{ await onPurchase(sweet) } finally{ setLoading(false) } }}>
          {out ? 'Out of stock' : 'Purchase'}
        </Button>
      </CardActions>
    </Card>
  )
}
