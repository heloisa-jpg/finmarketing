// Cartoes.js
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
export default function Cartoes() {
  const [cartoes, setCartoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ final: '', responsavel: '', setor_id: '' })
  const [setores, setSetores] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  useEffect(() => {
    supabase.from('setores').select('*').then(({ data }) => setSetores(data || []))
    load()
  }, [])
  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('cartoes').select('*, setores(nome)').eq('ativo', true)
    if (data) {
      const withTotals = await Promise.all(data.map(async (c) => {
        const mes = new Date().toISOString().slice(0, 7)
        const { data: lanc } = await supabase.from('lancamentos').select('valor').eq('metodo', `Cartão ${c.final}`).gte('data', mes + '-01').lte('data', mes + '-31')
        const total = (lanc || []).reduce((s, l) => s + Number(l.valor), 0)
        return { ...c, total_mes: total }
      }))
      setCartoes(withTotals)
    }
    setLoading(false)
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)
    await supabase.from('cartoes').insert(form)
    setSalvando(false)
    setMostrarForm(false)
    setForm({ final: '', responsavel: '', setor_id: '' })
    load()
  }
  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Cartões corporativos</h1>
        <button className="btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>{mostrarForm ? '← Fechar' : '+ Cadastrar cartão'}</button>
      </div>
      {mostrarForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Cadastrar cartão</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group"><label>Final do cartão *</label><input type="text" placeholder="Ex: 2271" value={form.final} onChange={e => setForm(f => ({ ...f, final: e.target.value }))} required /></div>
              <div className="form-group"><label>Responsável</label><input type="text" placeholder="Nome ou setor" value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
              <div className="form-group"><label>Setor</label>
                <select value={form.setor_id} onChange={e => setForm(f => ({ ...f, setor_id: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              <button type="button" className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
          : cartoes.length === 0 ? <div className="empty">Nenhum cartão cadastrado</div>
          : <table>
            <thead><tr><th>Final</th><th>Setor</th><th>Responsável</th><th>Gasto este mês</th></tr></thead>
            <tbody>{cartoes.map(c => (
              <tr key={c.id}>
                <td style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>•••• {c.final}</td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{c.setores?.nome || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{c.responsavel || '—'}</td>
                <td style={{ fontFamily: 'DM Mono', fontWeight: 500, color: c.total_mes > 5000 ? 'var(--red)' : 'var(--text)' }}>{fmt(c.total_mes)}</td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
    </div>
  )
}
