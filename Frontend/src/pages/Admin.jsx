import { useEffect, useState } from 'react'
import { SweetsAPI } from '../api/client'
import {
  Box, Button, Grid, IconButton, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Tooltip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import { useSnackbar } from 'notistack'

const empty = { name: '', description: '', price: '', category: '', imageUrl: '', quantity: '' }

export default function Admin() {
  const { enqueueSnackbar } = useSnackbar()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const { data } = await SweetsAPI.list()
    setItems(data.sweets)
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity) }
    try {
      setLoading(true)
      if (editing) {
        const { data } = await SweetsAPI.update(editing, payload)
        setItems(prev => prev.map(s => s._id === editing ? data.sweet : s))
        enqueueSnackbar('Sweet updated', { variant: 'success' })
      } else {
        const { data } = await SweetsAPI.create(payload)
        setItems(prev => [data.sweet, ...prev])
        enqueueSnackbar('Sweet created', { variant: 'success' })
      }
      setForm(empty); setEditing(null)
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || 'Save failed', { variant: 'error' })
    } finally { setLoading(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this sweet?')) return
    await SweetsAPI.remove(id)
    setItems(prev => prev.filter(s => s._id !== id))
    enqueueSnackbar('Deleted', { variant: 'info' })
  }

  const dec1 = async (id) => { const { data } = await SweetsAPI.purchase(id, 1); setItems(p => p.map(s => s._id === id ? data.sweet : s)) }
  const inc1 = async (id) => { const { data } = await SweetsAPI.restock(id, 1); setItems(p => p.map(s => s._id === id ? data.sweet : s)) }
  const restock = async (id) => {
    const qty = Number(prompt('Add quantity:'))
    if (!qty) return
    const { data } = await SweetsAPI.restock(id, qty)
    setItems(p => p.map(s => s._id === id ? data.sweet : s))
  }

  return (
    <Box sx={{ mx: 'auto', maxWidth: 1700, width: '100%', p: { xs: 1.5, md: 5 } }}>
      <Paper sx={{ p: { xs: 2, md: 7 }, mb: { xs: 2, md: 3 } }}>
        <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, textAlign: 'center' }}>
          {editing ? 'Edit Sweet' : 'Add Sweet'}
        </Typography>
        <form onSubmit={submit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required /></Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="number" label="Price" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required /></Grid>
            <Grid item xs={12} sm={6} md={4}><TextField fullWidth type="number" label="Quantity" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required /></Grid>
            <Grid item xs={12} sm={8} md={8}><TextField fullWidth label="Image URL" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="center">
                <Button type="submit" disabled={loading} variant="contained" size="large">{editing ? 'Update' : 'Create'}</Button>
                {editing && <Button variant="text" onClick={() => { setForm(empty); setEditing(null) }}>Cancel</Button>}
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>All Sweets</Typography>
        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(s => (
                <TableRow key={s._id} hover>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.category}</TableCell>
                  <TableCell>₹{s.price}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Decrease by 1"><IconButton size="small" onClick={() => dec1(s._id)}><RemoveIcon /></IconButton></Tooltip>
                    <Tooltip title="Increase by 1"><IconButton size="small" onClick={() => inc1(s._id)}><AddIcon /></IconButton></Tooltip>
                    <Tooltip title="Restock custom qty"><IconButton size="small" onClick={() => restock(s._id)}><Inventory2Icon /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditing(s._id); setForm({ name: s.name, description: s.description, price: s.price, category: s.category, imageUrl: s.imageUrl, quantity: s.quantity }) }}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => del(s._id)}><DeleteIcon /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">No sweets found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}
