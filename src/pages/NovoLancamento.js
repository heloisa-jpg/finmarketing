import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { format, addMonths, setDate } from 'date-fns'

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
  const [recorrente, setRecorrente] = useState(false)
  const [recForm, setRecForm] = useState({
    dia_vencimento: new Date().getDate(),
    data_inicio: format(new Date(), 'yyyy-MM'),
    data_fim: '',
  })
  const [nfFile, setNfFile] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [setores, setSetores] = useState([])
  const [cartoes, setCartoes] = useState([])
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  // Lista de recorrentes cadastrados
  const [listaRec, setListaRec] = useState([])
  const [loadingRec, setLoadingRec] = useState(false)
  const [aba, setAba] = useState('novo') // 'novo' | 'recorrentes'

  useEffect(() => {
    supabase.from('categorias').select('*').then(({ data }) => setCategorias(data || []))
    supabase.from('setores').select('*').then(({ data }) => setSetores(data || []))
    supabase.from('cartoes').select('*').eq('ativo', true).then(({ data }) => setCartoes(data || []))
    loadRecorrentes()
  }, [])

  const loadRecorrentes = async () => {
    setLoadingRec(true)
    const { data } = await supabase.from('recorrentes').select('*, categorias(nome,cor), setores(nome)').eq('ativo', true).order('descricao')
    setListaRec(data || [])
    setLoadingRec(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setRec = (k, v) => setRecForm(f => ({ ...f, [k]: v }))

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

    const payload = {
      ...form,
      valor: parseFloat(form.valor.replace(',', '.')),
      tem_nf: !!nfFile || form.tem_nf,
      nf_url,
      usuario_id: profile.id,
    }

    const { error } = await supabase.from('lancamentos').insert(payload)

    // Se for recorrente, salva na tabela de recorrentes também
    if (!error && recorrente) {
      const dataInicio = recForm.data_inicio + '-' + String(recForm.dia_vencimento).padStart(2, '0')
      await supabase.from('recorrentes').insert({
        descricao: form.descricao,
        valor: parseFloat(form.valor.replace(',', '.')),
        categoria_id: form.categoria_id || null,
        setor_id: form.setor_id || null,
        metodo: form.metodo,
        observacoes: form.observacoes,
        dia_vencimento: parseInt(recForm.dia_vencimento),
        data_inicio: dataInicio,
        data_fim: recForm.data_fim ? recForm.data_fim + '-01' : null,
        usuario_id: profile.id,
      })
    }

    setLoading(false)
    if (!error) {
      setSucesso(true)
      setTimeout(() => { setSucesso(false); setPage('lancamentos') }, 1500)
    }
  }

  const gerarPendentes = async () => {
    // Gera lançamentos pendentes do mês atual para todos os recorrentes
    setLoadingRec(true)
    const hoje = new Date()
    const mesAtual = format(hoje, 'yyyy-MM')

    for (const rec of listaRec) {
      const dataLanc = `${mesAtual}-${String(rec.dia_vencimento).padStart(2, '0')}`

      // Verificar se já existe lançamento para este recorrente neste mês
      const { data: existe } = await supabase
        .from('lancamentos')
        .select('id')
        .eq('descricao', rec.descricao)
        .gte('data', mesAtual + '-01')
        .lte('data', mesAtual + '-31')

      if (!existe || existe.length === 0) {
        await supabase.from('lancamentos').insert({
          data: dataLanc,
          descricao: rec.descricao,
          valor: rec.valor,
          categoria_id: rec.categoria_id,
          setor_id: rec.setor_id,
          metodo: rec.metodo,
          observacoes: rec.observacoes + ' [recorrente — confirme e anexe a NF]',
          tem_nf: false,
          usuario_id: profile.id,
        })
      }
    }
    setLoadingRec(false)
    alert(`✓ Lançamentos pendentes gerados para ${format(hoje, 'MM/yyyy')}!`)
    setPage('lancamentos')
  }

  const excluirRecorrente = async (id) => {
    if (window.confirm('Desativar este recorrente?')) {
      await supabase.from('recorrentes').update({ ativo: false }).eq('id', id)
      loadRecorrentes()
    }
  }

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Lançamentos</h1>
        <button className="btn-ghost" onClick={() => setPage('lancamentos')}>← Voltar</button>
      </div>

      {/* Abas */}
      <div className="tag-mes" style={{ marginBottom: '1rem' }}>
        <button className={aba === 'novo' ? 'active' : ''} onClick={() => setAba('novo')}>Novo lançamento</button>
        <button className={aba === 'recorrentes' ? 'active' : ''} onClick={() => setAba('recorrentes')}>
          Recorrentes ({listaRec.length})
        </button>
      </div>

      {/* NOVO LANÇAMENTO */}
      {aba === 'novo' && (
        <>
          {sucesso && (
            <div style={{
              background: 'rgba(62,207,142,.1)', border: '1px solid rgba(62,207,142,.3)',
              borderRadius: 'var(--radius)', padding: '.875rem 1rem',
              color: 'var(--green)', fontSize: 13, marginBottom: 12, fontWeight: 500,
            }}>
              ✓ Lançamento salvo com sucesso!
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Dados do gasto</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Data *</label>
                  <input type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Valor (R$) *</label>
                  <input type="text" placeholder="0,00" value={form.valor} onChange={e => set('valor', e.target.value)} required />
                </div>
                <div className="form-group full">
                  <label>Descrição *</label>
                  <input type="text" placeholder="Ex: Adobe Creative Cloud, Uber gravação..." value={form.descricao} onChange={e => set('descricao', e.target.value)} required />
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
                  <label>Cartão / Método</label>
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
                  <input type="text" placeholder="Ex: Mensal, gravação, reunião cliente..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Toggle recorrente */}
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: recorrente ? '1rem' : 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Este gasto é recorrente?</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>O sistema vai gerar automaticamente nos próximos meses</div>
                </div>
                <button
                  type="button"
                  onClick={() => setRecorrente(!recorrente)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: recorrente ? 'var(--accent)' : 'var(--bg3)',
                    border: '1px solid var(--border2)',
                    position: 'relative', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: recorrente ? 22 : 2,
                    transition: 'left .15s',
                  }} />
                </button>
              </div>

              {recorrente && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Dia do vencimento todo mês</label>
                    <input
                      type="number"
                      min="1" max="31"
                      value={recForm.dia_vencimento}
                      onChange={e => setRec('dia_vencimento', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Vigência até (mês/ano)</label>
                    <input
                      type="month"
                      value={recForm.data_fim}
                      onChange={e => setRec('data_fim', e.target.value)}
                      placeholder="Deixe vazio para indeterminado"
                    />
                  </div>
                  <div className="form-group full">
                    <div style={{
                      background: 'rgba(200,241,53,.07)', border: '1px solid rgba(200,241,53,.2)',
                      borderRadius: 'var(--radius)', padding: '.75rem 1rem', fontSize: 12, color: 'var(--accent)',
                    }}>
                      ✓ Todo dia <b>{recForm.dia_vencimento}</b> de cada mês vai aparecer um lançamento pendente esperando a NF
                      {recForm.data_fim ? ` até ${recForm.data_fim}` : ' por tempo indeterminado'}.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NF */}
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Nota Fiscal / Comprovante</div>
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
                  <button className="btn-ghost" onClick={() => setNfFile(null)} type="button" style={{ fontSize: 12 }}>Remover</button>
                </div>
              ) : (
                <label className="upload-area" style={{ display: 'block' }}>
                  <p>Clique ou arraste o arquivo aqui</p>
                  <span>PDF, JPG ou PNG — máx. 10MB</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setNfFile(e.target.files?.[0] || null)} />
                </label>
              )}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="tem_nf" checked={form.tem_nf} onChange={e => set('tem_nf', e.target.checked)} style={{ width: 'auto' }} />
                <label htmlFor="tem_nf" style={{ fontSize: 12, color: 'var(--text3)', cursor: 'pointer' }}>Tenho a NF mas vou anexar depois</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar lançamento'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setPage('lancamentos')}>Cancelar</button>
            </div>
          </form>
        </>
      )}

      {/* RECORRENTES */}
      {aba === 'recorrentes' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{listaRec.length} recorrentes ativos</span>
            <button className="btn-primary" onClick={gerarPendentes} disabled={loadingRec}>
              {loadingRec ? 'Gerando...' : '⟳ Gerar pendentes deste mês'}
            </button>
          </div>

          {listaRec.length === 0 ? (
            <div className="card">
              <div className="empty">
                <div style={{ fontSize: 20, marginBottom: 8 }}>🔁</div>
                <div style={{ fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>Nenhum recorrente cadastrado</div>
                <div style={{ fontSize: 12 }}>Ao lançar um gasto, ative a opção "Este gasto é recorrente"</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {listaRec.map(r => (
                <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{r.descricao}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      Todo dia {r.dia_vencimento} · {r.metodo || '—'}
                      {r.data_fim ? ` · até ${format(new Date(r.data_fim), 'MM/yyyy')}` : ' · indeterminado'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'DM Mono', fontWeight: 600, fontSize: 14 }}>
                      {fmt(r.valor)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {r.categorias?.nome || '—'} · {r.setores?.nome || '—'}
                    </div>
                  </div>
                  <button
                    className="btn-danger"
                    style={{ padding: '4px 10px', fontSize: 11, flexShrink: 0 }}
                    onClick={() => excluirRecorrente(r.id)}
                  >
                    Desativar
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
