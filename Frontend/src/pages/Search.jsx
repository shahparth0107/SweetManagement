import { useState } from 'react'
import { SweetsAPI } from '../api/client'
import SweetCard from '../components/SweetCard'

export default function Search(){
  const [form, setForm] = useState({ q: '', category:'', minprice:'', maxprice:'', instock:false })
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)

  const run = async (e) => {
    e?.preventDefault()
    const params = {}
    if (form.q) params.q = form.q
    if (form.category) params.category = form.category
    if (form.minprice) params.minprice = form.minprice
    if (form.maxprice) params.maxprice = form.maxprice
    if (form.instock) params.instock = 1
    try{
      const { data } = await SweetsAPI.search(params) // { sweets, total, filter }
      setItems(data.sweets); setMeta({ total: data.total })
    }catch(err){
      alert(err.response?.data?.message || 'Search failed')
    }
  }

  return (
    <>
      <h2>Search Sweets</h2>
      <form onSubmit={run} style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:12}}>
        <input placeholder="keywords (comma separated)" value={form.q} onChange={e=>setForm(f=>({...f, q:e.target.value}))} />
        <input placeholder="category" value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))} />
        <input type="number" min="0" placeholder="min price" value={form.minprice} onChange={e=>setForm(f=>({...f, minprice:e.target.value}))} />
        <input type="number" min="0" placeholder="max price" value={form.maxprice} onChange={e=>setForm(f=>({...f, maxprice:e.target.value}))} />
        <label style={{display:'flex', alignItems:'center', gap:6}}>
          <input type="checkbox" checked={form.instock} onChange={e=>setForm(f=>({...f, instock:e.target.checked}))} />
          In stock
        </label>
        <button style={{gridColumn:'1/-1'}}>Search</button>
      </form>
      {meta && <div style={{marginBottom:8}}>Results: <b>{meta.total}</b></div>}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16}}>
        {items.map(s => <SweetCard key={s._id} sweet={s} />)}
      </div>
    </>
  )
}
