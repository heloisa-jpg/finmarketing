// Reembolsos.js
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { format } from 'date-fns'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export function Reembolsos() {
  const { profile, isAdmin } = useAuth()
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ descricao: '', valor: '', categoria_id: '', observacoes: '', tem_nf: false })
  const [nfFile, setNfFile] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    supabase.from('categorias').select('*').then(({ data }) => setCategorias(data || []))
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    let q = supabase.from('reembolsos').select('*, categorias(nome,cor), profiles(nome)').order('created_at', { ascending: false })
    if (!isAdmin) q = q.eq('usuario_id', profile.id)
    const { data } = await q
    setDados(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)
    let nf_url = null
    if (nfFile) {
      const path = `nfs/reembolsos/${Date.now()}_${nfFile.name}`
      const { data } = await supabase.storage.from('nfs').upload(path, nfFile)
      if (data) nf_url = data.path
    }
    await supabase.from('reembolsos').insert({
      ...form, valor: parseFloat(form.valor.replace(',', '.')),
      tem_nf: !!nfFile || form.tem_nf, nf_url, usuario_id: profile.id, status: 'aguardando',
    })
    setSalvando(false)
    setMostrarForm(false)
    setForm({ descricao: '', valor: '', categoria_id: '', observacoes: '', tem_nf: false })
    setNfFile(null)
    load()
  }

  const atualizar = async (id, status) => {
    await supabase.from('reembolsos').update({ status }).eq('id', id)
    load()
  }

  const STATUS = {
    aguardando: { label: 'Aguardando', cls: 'badge-orange' },
    aprovado: { label: 'Aprovado', cls: 'badge-green' },
    recusado: { label: 'Recusado', cls: 'badge-red' },
    pago: { label: 'Pago', cls: 'badge-blue' },
  }

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Reembolsos</h1>
        <button className="btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? '← Fechar' : '+ Nova solicitação'}
        </button>
      </div>

      {mostrarForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Nova solicitação de reembolso</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full">
                <label>Descrição *</label>
                <input type="text" placeholder="Ex: Uber reunião, almoço com cliente..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Valor (R$) *</label>
                <input type="text" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <label>Observações</label>
                <input type="text" placeholder="Detalhes adicionais..." value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
              <div className="form-group full">
                <label>Comprovante / NF</label>
                <label className="upload-area" style={{ display: 'block' }}>
                  <p>{nfFile ? `✓ ${nfFile.name}` : 'Clique para anexar'}</p>
                  <span>PDF, JPG ou PNG</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setNfFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Enviando...' : 'Enviar solicitação'}</button>
              <button type="button" className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
          : dados.length === 0 ? <div className="empty">Nenhuma solicitação encontrada</div>
          : (
            <table>
              <thead><tr><th>Data</th><th>Descrição</th>{isAdmin && <th>Solicitante</th>}<th>Categoria</th><th>Valor</th><th>NF</th><th>Status</th>{isAdmin && <th>Ações</th>}</tr></thead>
              <tbody>
                {dados.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)' }}>{format(new Date(r.created_at), 'dd/MM/yy')}</td>
                    <td>{r.descricao}{r.observacoes && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.observacoes}</div>}</td>
                    {isAdmin && <td style={{ fontSize: 12, color: 'var(--text3)' }}>{r.profiles?.nome}</td>}
                    <td><span className="badge badge-gray" style={{ background: (r.categorias?.cor || '#888') + '22', color: r.categorias?.cor || '#888' }}>{r.categorias?.nome || '—'}</span></td>
                    <td style={{ fontFamily: 'DM Mono', fontWeight: 500 }}>{fmt(r.valor)}</td>
                    <td><span className={`badge ${r.tem_nf ? 'badge-green' : 'badge-orange'}`}>{r.tem_nf ? '✓' : '✗'}</span></td>
                    <td><span className={`badge ${STATUS[r.status]?.cls}`}>{STATUS[r.status]?.label}</span></td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {r.status === 'aguardando' && <>
                            <button className="btn-success" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => atualizar(r.id, 'aprovado')}>Aprovar</button>
                            <button className="btn-danger" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => atualizar(r.id, 'recusado')}>Recusar</button>
                          </>}
                          {r.status === 'aprovado' && <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => atualizar(r.id, 'pago')}>Marcar pago</button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}

export default Reembolsos
