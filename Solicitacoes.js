import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { format } from 'date-fns'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const STATUS = {
  pendente: { label: 'Pendente', cls: 'badge-gray' },
  aguardando_ceo: { label: 'Aguard. CEO', cls: 'badge-orange' },
  aprovado: { label: 'Aprovado', cls: 'badge-blue' },
  a_pagar: { label: 'A pagar', cls: 'badge-purple' },
  pago: { label: 'Pago', cls: 'badge-green' },
  recusado: { label: 'Recusado', cls: 'badge-red' },
}

export default function Solicitacoes() {
  const [dados, setDados] = useState([])
  const [pessoas, setPessoas] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nfFile, setNfFile] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ pessoa_id: '', descricao: '', valor: '', vencimento: '', observacoes: '' })

  useEffect(() => {
    supabase.from('pessoas').select('*').eq('ativo', true).then(({ data }) => setPessoas(data || []))
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('solicitacoes').select('*, pessoas(nome,tipo,chave_pix)').order('created_at', { ascending: false })
    setDados(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)
    const pessoa = pessoas.find(p => p.id === form.pessoa_id)
    const status = pessoa?.tipo === 'recorrente' ? 'a_pagar' : 'aguardando_ceo'
    let nf_url = null
    if (nfFile) {
      const path = `nfs/solicitacoes/${Date.now()}_${nfFile.name}`
      const { data } = await supabase.storage.from('nfs').upload(path, nfFile)
      if (data) nf_url = data.path
    }
    await supabase.from('solicitacoes').insert({
      ...form, valor: parseFloat(form.valor.replace(',', '.')),
      tem_nf: !!nfFile, nf_url, status,
    })
    setSalvando(false)
    setMostrarForm(false)
    setForm({ pessoa_id: '', descricao: '', valor: '', vencimento: '', observacoes: '' })
    setNfFile(null)
    load()
  }

  const atualizar = async (id, status) => {
    await supabase.from('solicitacoes').update({ status }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Solicitações de pagamento</h1>
        <button className="btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? '← Fechar' : '+ Nova solicitação'}
        </button>
      </div>

      {mostrarForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Nova solicitação</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full">
                <label>Pessoa *</label>
                <select value={form.pessoa_id} onChange={e => setForm(f => ({ ...f, pessoa_id: e.target.value }))} required>
                  <option value="">Selecionar...</option>
                  {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.tipo} — {p.servico}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <label>Descrição do serviço *</label>
                <input type="text" placeholder="Ex: Edição vídeos abril 2026..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Valor (R$) *</label>
                <input type="text" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Vencimento</label>
                <input type="date" value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))} />
              </div>
              <div className="form-group full">
                <label>Observações para o financeiro</label>
                <input type="text" placeholder="Ex: Fazer PIX na sexta..." value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
              <div className="form-group full">
                <label>Nota Fiscal (se já tiver)</label>
                <label className="upload-area" style={{ display: 'block' }}>
                  <p>{nfFile ? `✓ ${nfFile.name}` : 'Clique para anexar NF'}</p>
                  <span>PDF, JPG ou PNG — pode enviar depois também</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setNfFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Criando...' : 'Criar solicitação'}</button>
              <button type="button" className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
          : dados.length === 0 ? <div className="empty">Nenhuma solicitação</div>
          : (
            <table>
              <thead><tr><th>Pessoa</th><th>Tipo</th><th>Descrição</th><th>Vencimento</th><th>Valor</th><th>NF</th><th>Status</th><th>PIX</th><th>Ações</th></tr></thead>
              <tbody>
                {dados.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.pessoas?.nome}</td>
                    <td><span className={`badge ${s.pessoas?.tipo === 'freela' ? 'badge-purple' : s.pessoas?.tipo === 'pj' ? 'badge-blue' : 'badge-green'}`}>{s.pessoas?.tipo}</span></td>
                    <td style={{ fontSize: 12 }}>{s.descricao}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)' }}>{s.vencimento ? format(new Date(s.vencimento + 'T12:00:00'), 'dd/MM/yy') : '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontWeight: 500 }}>{fmt(s.valor)}</td>
                    <td><span className={`badge ${s.tem_nf ? 'badge-green' : 'badge-orange'}`}>{s.tem_nf ? '✓' : '✗'}</span></td>
                    <td><span className={`badge ${STATUS[s.status]?.cls}`}>{STATUS[s.status]?.label}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.pessoas?.chave_pix || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {s.status === 'aguardando_ceo' && <button className="btn-success" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => atualizar(s.id, 'a_pagar')}>Aprovar</button>}
                        {s.status === 'a_pagar' && <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => atualizar(s.id, 'pago')}>Marcar pago</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}
