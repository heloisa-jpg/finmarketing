import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { format } from 'date-fns'

export default function NovoLancamento() {
  const { profile, setPage } = useAuth()
  const [form, setForm] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    descricao: '',
    valor: '',
    categoria_id: '',
    setor_id: '',
    metodo: '',
    observacoes: '',
    tem_nf: false,
  })
  const [nfFile, setNfFile] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [setores, setSetores] = useState([])
  const [cartoes, setCartoes] = useState([])
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    supabase.from('categorias').select('*').then(({ data }) => setCategorias(data || []))
    supabase.from('setores').select('*').then(({ data }) => setSetores(data || []))
    supabase.from('cartoes').select('*').eq('ativo', true).then(({ data }) => setCartoes(data || []))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    let nf_url = null
    if (nfFile) {
      const ext = nfFile.name.split('.').pop()
      const path = `nfs/${profile.id}/${Date.now()}.${ext}`
      const { data: upload } = await supabase.storage.from('nfs').upload(path, nfFile)
      if (upload) nf_url = upload.path
    }

    const { error } = await supabase.from('lancamentos').insert({
      ...form,
      valor: parseFloat(form.valor.replace(',', '.')),
      tem_nf: !!nfFile || form.tem_nf,
      nf_url,
      usuario_id: profile.id,
    })

    setLoading(false)
    if (!error) {
      setSucesso(true)
      setTimeout(() => { setSucesso(false); setPage('lancamentos') }, 1500)
    }
  }

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Lançar gasto</h1>
        <button className="btn-ghost" onClick={() => setPage('lancamentos')}>← Voltar</button>
      </div>

      {sucesso && (
        <div style={{
          background: 'rgba(62,207,142,.1)', border: '1px solid rgba(62,207,142,.3)',
          borderRadius: 'var(--radius)', padding: '.875rem 1rem',
          color: 'var(--green)', fontSize: 13, marginBottom: 1, fontWeight: 500,
        }}>
          ✓ Lançamento salvo com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>
            Dados do gasto
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Data *</label>
              <input type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Valor (R$) *</label>
              <input
                type="text"
                placeholder="0,00"
                value={form.valor}
                onChange={e => set('valor', e.target.value)}
                required
              />
            </div>
            <div className="form-group full">
              <label>Descrição *</label>
              <input
                type="text"
                placeholder="Ex: Adobe Creative Cloud, Uber gravação..."
                value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Categoria *</label>
              <select value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} required>
                <option value="">Selecionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Setor *</label>
              <select value={form.setor_id} onChange={e => set('setor_id', e.target.value)} required>
                <option value="">Selecionar...</option>
                {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cartão / Método de pagamento</label>
              <select value={form.metodo} onChange={e => set('metodo', e.target.value)}>
                <option value="">Selecionar...</option>
                {cartoes.map(c => <option key={c.id} value={`Cartão ${c.final}`}>Cartão final {c.final}</option>)}
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Adiantamento">Adiantamento</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>
            <div className="form-group">
              <label>Observações</label>
              <input
                type="text"
                placeholder="Ex: Mensal, gravação, reunião cliente..."
                value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>
            Nota Fiscal / Comprovante
          </div>
          {nfFile ? (
            <div style={{
              background: 'rgba(62,207,142,.08)', border: '1px solid rgba(62,207,142,.2)',
              borderRadius: 'var(--radius)', padding: '.875rem 1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--green)' }}>✓ {nfFile.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{(nfFile.size / 1024).toFixed(0)} KB</div>
              </div>
              <button className="btn-ghost" onClick={() => setNfFile(null)} type="button" style={{ fontSize: 12 }}>
                Remover
              </button>
            </div>
          ) : (
            <label className="upload-area" style={{ display: 'block' }}>
              <p>Clique ou arraste o arquivo aqui</p>
              <span>PDF, JPG ou PNG — máx. 10MB</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={e => setNfFile(e.target.files?.[0] || null)}
              />
            </label>
          )}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="tem_nf"
              checked={form.tem_nf}
              onChange={e => set('tem_nf', e.target.checked)}
              style={{ width: 'auto' }}
            />
            <label htmlFor="tem_nf" style={{ fontSize: 12, color: 'var(--text3)', cursor: 'pointer' }}>
              Tenho a NF mas vou anexar depois
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar lançamento'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setPage('lancamentos')}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
