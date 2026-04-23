import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function Adiantamentos() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [setores, setSetores] = useState([])
  const [form, setForm] = useState({ usuario_id: '', valor_total: '', setor_id: '', prazo: '', observacoes: '' })

  useEffect(() => {
    supabase.from('profiles').select('*').eq('ativo', true).then(({ data }) => setUsuarios(data || []))
    supabase.from('setores').select('*').then(({ data }) => setSetores(data || []))
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('adiantamentos').select('*, profiles(nome), setores(nome)').order('created_at', { ascending: false })
    setDados(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)
    await supabase.from('adiantamentos').insert({ ...form, valor_total: parseFloat(form.valor_total), status: 'aberto' })
    setSalvando(false)
    setMostrarForm(false)
    setForm({ usuario_id: '', valor_total: '', setor_id: '', prazo: '', observacoes: '' })
    load()
  }

  const STATUS = { aberto: { label: 'Aberto', cls: 'badge-blue' }, encerrado: { label: 'Encerrado', cls: 'badge-gray' }, estourado: { label: 'Estourado', cls: 'badge-red' } }

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Adiantamentos</h1>
        <button className="btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>{mostrarForm ? '← Fechar' : '+ Novo adiantamento'}</button>
      </div>

      {mostrarForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Novo adiantamento</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group"><label>Colaborador *</label>
                <select value={form.usuario_id} onChange={e => setForm(f => ({ ...f, usuario_id: e.target.value }))} required>
                  <option value="">Selecionar...</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Valor (R$) *</label><input type="number" step="0.01" value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))} required /></div>
              <div className="form-group"><label>Centro de custo</label>
                <select value={form.setor_id} onChange={e => setForm(f => ({ ...f, setor_id: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Prazo de prestação de contas</label><input type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} /></div>
              <div className="form-group full"><label>Observação</label><input type="text" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar'}</button>
              <button type="button" className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
          : dados.length === 0 ? <div className="empty card">Nenhum adiantamento</div>
          : dados.map(a => {
            const gasto = Number(a.valor_gasto)
            const total = Number(a.valor_total)
            const pct = Math.min((gasto / total) * 100, 100)
            const cor = pct > 90 ? '#ff5555' : pct > 60 ? '#ff9f43' : '#3ecf8e'
            return (
              <div key={a.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{a.profiles?.nome}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>{a.setores?.nome}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Recebeu</div>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 500 }}>{fmt(total)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Gastou</div>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--red)' }}>{fmt(gasto)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Saldo</div>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 600, color: total - gasto < 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(total - gasto)}</div>
                    </div>
                    <span className={`badge ${STATUS[a.status]?.cls}`}>{STATUS[a.status]?.label}</span>
                  </div>
                </div>
                <div className="saldo-bar"><div className="saldo-fill" style={{ width: `${pct}%`, background: cor }} /></div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{pct.toFixed(0)}% utilizado{a.prazo ? ` · prazo: ${a.prazo}` : ''}{a.observacoes ? ` · ${a.observacoes}` : ''}</div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
