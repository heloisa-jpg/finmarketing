// Pessoas.js
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Pessoas() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', tipo: 'freela', documento: '', servico: '', chave_pix: '', valor_fixo: '', passagem: '', aprovador: 'ceo' })

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('pessoas').select('*').eq('ativo', true).order('nome')
    setDados(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)
    await supabase.from('pessoas').insert({
      ...form,
      valor_fixo: form.valor_fixo ? parseFloat(form.valor_fixo) : null,
      passagem: form.passagem ? parseFloat(form.passagem) : null,
    })
    setSalvando(false)
    setMostrarForm(false)
    setForm({ nome: '', tipo: 'freela', documento: '', servico: '', chave_pix: '', valor_fixo: '', passagem: '', aprovador: 'ceo' })
    load()
  }

  const fmt = (v) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—'
  const TIPO_CLS = { freela: 'badge-purple', pj: 'badge-blue', recorrente: 'badge-green' }

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Pessoas</h1>
        <button className="btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>{mostrarForm ? '← Fechar' : '+ Cadastrar'}</button>
      </div>

      {mostrarForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Cadastrar pessoa</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group"><label>Nome *</label><input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required /></div>
              <div className="form-group"><label>Tipo *</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="freela">Freela (CPF)</option><option value="pj">PJ (CNPJ)</option><option value="recorrente">Recorrente fixo</option>
                </select>
              </div>
              <div className="form-group"><label>CPF / CNPJ</label><input type="text" value={form.documento} onChange={e => setForm(f => ({ ...f, documento: e.target.value }))} /></div>
              <div className="form-group"><label>Serviço / Função</label><input type="text" value={form.servico} onChange={e => setForm(f => ({ ...f, servico: e.target.value }))} /></div>
              <div className="form-group"><label>Chave PIX</label><input type="text" value={form.chave_pix} onChange={e => setForm(f => ({ ...f, chave_pix: e.target.value }))} /></div>
              <div className="form-group"><label>Quem aprova</label>
                <select value={form.aprovador} onChange={e => setForm(f => ({ ...f, aprovador: e.target.value }))}>
                  <option value="ceo">CEO</option><option value="adm">ADM</option><option value="auto">Automático</option>
                </select>
              </div>
              {form.tipo === 'recorrente' && <>
                <div className="form-group"><label>Valor fixo (R$)</label><input type="number" step="0.01" value={form.valor_fixo} onChange={e => setForm(f => ({ ...f, valor_fixo: e.target.value }))} /></div>
                <div className="form-group"><label>Passagem (R$)</label><input type="number" step="0.01" value={form.passagem} onChange={e => setForm(f => ({ ...f, passagem: e.target.value }))} /></div>
              </>}
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
          : dados.length === 0 ? <div className="empty">Nenhuma pessoa cadastrada</div>
          : (
            <table>
              <thead><tr><th>Nome</th><th>Tipo</th><th>Serviço</th><th>Doc.</th><th>Chave PIX</th><th>Valor fixo</th><th>Passagem</th><th>Aprovação</th></tr></thead>
              <tbody>
                {dados.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.nome}</td>
                    <td><span className={`badge ${TIPO_CLS[p.tipo]}`}>{p.tipo}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{p.servico || '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text3)' }}>{p.documento || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{p.chave_pix || '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{fmt(p.valor_fixo)}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{fmt(p.passagem)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase' }}>{p.aprovador}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}
