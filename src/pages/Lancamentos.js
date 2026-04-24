import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { format, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const MESES = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i)
  return { val: format(d, 'yyyy-MM'), label: format(d, 'MMM/yy', { locale: ptBR }) }
})

const CORES = ['#D4537E', '#378ADD', '#1D9E75', '#EF9F27', '#534AB7', '#E24B4A']

export default function Lancamentos() {
  const { isAdmin, setPage } = useAuth()
  const [dados, setDados] = useState([])
  const [projetos, setProjetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(format(new Date(), 'yyyy-MM'))
  const [filtCat, setFiltCat] = useState('')
  const [filtSetor, setFiltSetor] = useState('')
  const [filtNF, setFiltNF] = useState('')
  const [categorias, setCategorias] = useState([])
  const [setores, setSetores] = useState([])
  const [catMap, setCatMap] = useState({})
  const [setMap, setSetMap] = useState({})
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [projetoAberto, setProjetoAberto] = useState(null)
  const [mostrarFormProjeto, setMostrarFormProjeto] = useState(false)
  const [formProjeto, setFormProjeto] = useState({ nome: '', descricao: '', data_inicio: '', data_fim: '', orcamento: '', setor_id: '', cor: '#D4537E' })
  const [salvandoProjeto, setSalvandoProjeto] = useState(false)

  useEffect(() => {
    supabase.from('categorias').select('*').then(({ data }) => {
      setCategorias(data || [])
      const m = {}; (data || []).forEach(c => m[c.id] = c); setCatMap(m)
    })
    supabase.from('setores').select('*').then(({ data }) => {
      setSetores(data || [])
      const m = {}; (data || []).forEach(s => m[s.id] = s); setSetMap(m)
    })
    loadProjetos()
  }, [])

  useEffect(() => { load() }, [mes, filtCat, filtSetor, filtNF])

  const loadProjetos = async () => {
    const { data } = await supabase.from('projetos').select('*').order('created_at', { ascending: false })
    setProjetos(data || [])
  }

  const load = async () => {
    setLoading(true)
    const inicio = mes + '-01'
    const fim = format(endOfMonth(new Date(mes + '-02')), 'yyyy-MM-dd')
    let q = supabase.from('lancamentos').select('*')
      .gte('data', inicio).lte('data', fim)
      .order('data', { ascending: false })
    if (filtCat) q = q.eq('categoria_id', filtCat)
    if (filtSetor) q = q.eq('setor_id', filtSetor)
    if (filtNF === 'sim') q = q.eq('tem_nf', true)
    if (filtNF === 'nao') q = q.eq('tem_nf', false)
    const { data } = await q
    setDados(data || [])
    setLoading(false)
  }

  const abrirEdicao = (l) => {
    setEditando(l.id)
    setEditForm({ data: l.data, descricao: l.descricao, valor: String(l.valor), categoria_id: l.categoria_id || '', setor_id: l.setor_id || '', metodo: l.metodo || '', observacoes: l.observacoes || '', tem_nf: l.tem_nf || false })
  }

  const salvarEdicao = async (id) => {
    setSalvando(true)
    await supabase.from('lancamentos').update({ ...editForm, valor: parseFloat(editForm.valor.replace(',', '.')) }).eq('id', id)
    setSalvando(false); setEditando(null); load()
  }

  const excluir = async (id) => {
    if (window.confirm('Excluir este lançamento?')) { await supabase.from('lancamentos').delete().eq('id', id); load() }
  }

  const criarProjeto = async (e) => {
    e.preventDefault(); setSalvandoProjeto(true)
    await supabase.from('projetos').insert({ ...formProjeto, orcamento: formProjeto.orcamento ? parseFloat(formProjeto.orcamento) : null, setor_id: formProjeto.setor_id || null })
    setSalvandoProjeto(false); setMostrarFormProjeto(false)
    setFormProjeto({ nome: '', descricao: '', data_inicio: '', data_fim: '', orcamento: '', setor_id: '', cor: '#D4537E' })
    loadProjetos()
  }

  const lancsSemProjeto = dados.filter(l => !l.projeto_id)
  const total = dados.reduce((s, l) => s + Number(l.valor), 0)

  const LinhaEdicao = ({ l, cols }) => editando !== l.id ? null : (
    <tr>
      <td colSpan={cols} style={{ background: 'var(--bg3)', padding: '1rem' }}>
        <div className="form-grid">
          <div className="form-group"><label>Data</label><input type="date" value={editForm.data} onChange={e => setEditForm(f => ({ ...f, data: e.target.value }))} /></div>
          <div className="form-group"><label>Valor (R$)</label><input type="text" value={editForm.valor} onChange={e => setEditForm(f => ({ ...f, valor: e.target.value }))} /></div>
          <div className="form-group full"><label>Descrição</label><input type="text" value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} /></div>
          <div className="form-group"><label>Categoria</label><select value={editForm.categoria_id} onChange={e => setEditForm(f => ({ ...f, categoria_id: e.target.value }))}><option value="">—</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
          <div className="form-group"><label>Setor</label><select value={editForm.setor_id} onChange={e => setEditForm(f => ({ ...f, setor_id: e.target.value }))}><option value="">—</option>{setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>
          <div className="form-group"><label>Método</label><input type="text" value={editForm.metodo} onChange={e => setEditForm(f => ({ ...f, metodo: e.target.value }))} /></div>
          <div className="form-group"><label>Observações</label><input type="text" value={editForm.observacoes} onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          <div className="form-group"><label>NF?</label><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}><input type="checkbox" checked={editForm.tem_nf} onChange={e => setEditForm(f => ({ ...f, tem_nf: e.target.checked }))} style={{ width: 'auto' }} /><span style={{ fontSize: 12, color: 'var(--text3)' }}>Sim</span></div></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn-primary" onClick={() => salvarEdicao(l.id)} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
          <button className="btn-ghost" onClick={() => setEditando(null)}>Cancelar</button>
        </div>
      </td>
    </tr>
  )

  return (
    <div>
      {projetoAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ background: 'var(--bg2)', border: `1px solid ${projetoAberto.cor}44`, borderTop: `3px solid ${projetoAberto.cor}`, borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 960, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{projetoAberto.nome}</div>
                {projetoAberto.descricao && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{projetoAberto.descricao}</div>}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Total gasto</div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: 22, fontWeight: 700, color: projetoAberto.cor }}>
                    {fmt(dados.filter(l => l.projeto_id === projetoAberto.id).reduce((s, l) => s + Number(l.valor), 0))}
                  </div>
                  {projetoAberto.orcamento && <div style={{ fontSize: 11, color: 'var(--text3)' }}>de {fmt(projetoAberto.orcamento)} orçado</div>}
                </div>
                <button className="btn-ghost" onClick={() => setProjetoAberto(null)}>✕ Fechar</button>
              </div>
            </div>

            {(() => {
              const lancsProjeto = dados.filter(l => l.projeto_id === projetoAberto.id)
              const catTotais = {}
              lancsProjeto.forEach(l => {
                const nome = catMap[l.categoria_id]?.nome || 'Outros'
                const cor = catMap[l.categoria_id]?.cor || '#888'
                if (!catTotais[nome]) catTotais[nome] = { total: 0, cor }
                catTotais[nome].total += Number(l.valor)
              })
              const cats = Object.entries(catTotais).sort((a, b) => b[1].total - a[1].total)
              const maxVal = cats[0]?.[1].total || 1
              return cats.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 8, marginBottom: '1.25rem' }}>
                  {cats.map(([nome, { total, cor }]) => (
                    <div key={nome} style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '.75rem' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{nome}</div>
                      <div style={{ fontFamily: 'DM Mono', fontWeight: 600, color: cor, fontSize: 15 }}>{fmt(total)}</div>
                      <div style={{ height: 3, background: 'var(--bg2)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ height: 3, background: cor, width: `${(total / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            })()}

            <div style={{ overflow: 'hidden', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              {dados.filter(l => l.projeto_id === projetoAberto.id).length === 0
                ? <div className="empty">Nenhum lançamento neste mês para este projeto</div>
                : (
                  <table>
                    <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Método</th><th>Valor</th><th>NF</th><th>Ações</th></tr></thead>
                    <tbody>
                      {dados.filter(l => l.projeto_id === projetoAberto.id).map(l => (
                        <React.Fragment key={l.id}>
                          <tr>
                            <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)' }}>{format(new Date(l.data + 'T12:00:00'), 'dd/MM/yy')}</td>
                            <td><div>{l.descricao}</div>{l.observacoes && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l.observacoes}</div>}</td>
                            <td><span className="badge" style={{ background: (catMap[l.categoria_id]?.cor || '#888') + '22', color: catMap[l.categoria_id]?.cor || '#888' }}>{catMap[l.categoria_id]?.nome || '—'}</span></td>
                            <td style={{ fontSize: 12, color: 'var(--text3)' }}>{l.metodo || '—'}</td>
                            <td style={{ fontFamily: 'DM Mono', fontWeight: 500 }}>{fmt(l.valor)}</td>
                            <td><span className={`badge ${l.tem_nf ? 'badge-green' : 'badge-orange'}`}>{l.tem_nf ? '✓' : '✗'}</span></td>
                            <td><div style={{ display: 'flex', gap: 5 }}>
                              <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => editando === l.id ? setEditando(null) : abrirEdicao(l)}>{editando === l.id ? 'Fechar' : 'Editar'}</button>
                              <button className="btn-danger" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => excluir(l.id)}>Excluir</button>
                            </div></td>
                          </tr>
                          <LinhaEdicao l={l} cols={7} />
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </div>
        </div>
      )}

      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Despesas</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && <button className="btn-ghost" onClick={() => setMostrarFormProjeto(!mostrarFormProjeto)}>+ Projeto</button>}
          <button className="btn-primary" onClick={() => setPage('novo_lancamento')}>+ Lançar gasto</button>
        </div>
      </div>

      {mostrarFormProjeto && isAdmin && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Novo projeto / evento</div>
          <form onSubmit={criarProjeto}>
            <div className="form-grid">
              <div className="form-group full"><label>Nome *</label><input type="text" placeholder="Ex: Viagem Rio, Evento SP..." value={formProjeto.nome} onChange={e => setFormProjeto(f => ({ ...f, nome: e.target.value }))} required /></div>
              <div className="form-group full"><label>Descrição</label><input type="text" value={formProjeto.descricao} onChange={e => setFormProjeto(f => ({ ...f, descricao: e.target.value }))} /></div>
              <div className="form-group"><label>Data início</label><input type="date" value={formProjeto.data_inicio} onChange={e => setFormProjeto(f => ({ ...f, data_inicio: e.target.value }))} /></div>
              <div className="form-group"><label>Data fim</label><input type="date" value={formProjeto.data_fim} onChange={e => setFormProjeto(f => ({ ...f, data_fim: e.target.value }))} /></div>
              <div className="form-group"><label>Orçamento (R$)</label><input type="number" step="0.01" value={formProjeto.orcamento} onChange={e => setFormProjeto(f => ({ ...f, orcamento: e.target.value }))} /></div>
              <div className="form-group"><label>Setor</label><select value={formProjeto.setor_id} onChange={e => setFormProjeto(f => ({ ...f, setor_id: e.target.value }))}><option value="">—</option>{setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>
              <div className="form-group full"><label>Cor</label><div style={{ display: 'flex', gap: 8, marginTop: 4 }}>{CORES.map(cor => <button key={cor} type="button" onClick={() => setFormProjeto(f => ({ ...f, cor }))} style={{ width: 26, height: 26, borderRadius: '50%', background: cor, border: formProjeto.cor === cor ? '2px solid white' : '2px solid transparent' }} />)}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={salvandoProjeto}>{salvandoProjeto ? 'Criando...' : 'Criar projeto'}</button>
              <button type="button" className="btn-ghost" onClick={() => setMostrarFormProjeto(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="tag-mes">
        {MESES.map(m => <button key={m.val} className={mes === m.val ? 'active' : ''} onClick={() => setMes(m.val)}>{m.label}</button>)}
      </div>

      <div className="filters">
        <select value={filtCat} onChange={e => setFiltCat(e.target.value)}><option value="">Todas categorias</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        <select value={filtSetor} onChange={e => setFiltSetor(e.target.value)}><option value="">Todos setores</option>{setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
        <select value={filtNF} onChange={e => setFiltNF(e.target.value)}><option value="">Qualquer NF</option><option value="sim">Com NF</option><option value="nao">Sem NF</option></select>
      </div>

      {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div> : (
        <>
          {projetos.filter(p => dados.some(l => l.projeto_id === p.id)).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10, marginBottom: 12 }}>
              {projetos.filter(p => dados.some(l => l.projeto_id === p.id)).map(p => {
                const tot = dados.filter(l => l.projeto_id === p.id).reduce((s, l) => s + Number(l.valor), 0)
                const qtd = dados.filter(l => l.projeto_id === p.id).length
                const pct = p.orcamento ? Math.min((tot / p.orcamento) * 100, 100) : null
                return (
                  <div key={p.id} onClick={() => setProjetoAberto(p)} style={{ background: 'var(--bg2)', border: `1px solid ${p.cor}33`, borderLeft: `3px solid ${p.cor}`, borderRadius: 'var(--radius-lg)', padding: '1rem', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nome}</div>
                      <span style={{ color: 'var(--text3)' }}>→</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{qtd} lançamentos</div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 18, fontWeight: 700, color: p.cor, marginTop: 8 }}>{fmt(tot)}</div>
                    {pct !== null && (
                      <>
                        <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                          <div style={{ height: 3, background: p.cor, width: `${pct}%` }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{pct.toFixed(0)}% do orçamento</div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {lancsSemProjeto.length === 0 ? <div className="empty">Nenhum lançamento encontrado</div> : (
              <table>
                <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Setor</th><th>Método</th><th>Valor</th><th>NF</th><th>Ações</th></tr></thead>
                <tbody>
                  {lancsSemProjeto.map(l => (
                    <React.Fragment key={l.id}>
                      <tr>
                        <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{format(new Date(l.data + 'T12:00:00'), 'dd/MM/yy')}</td>
                        <td><div>{l.descricao}</div>{l.observacoes && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l.observacoes}</div>}</td>
                        <td><span className="badge" style={{ background: (catMap[l.categoria_id]?.cor || '#888') + '22', color: catMap[l.categoria_id]?.cor || '#888' }}>{catMap[l.categoria_id]?.nome || '—'}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text3)' }}>{setMap[l.setor_id]?.nome || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text3)' }}>{l.metodo || '—'}</td>
                        <td style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{fmt(l.valor)}</td>
                        <td><span className={`badge ${l.tem_nf ? 'badge-green' : 'badge-orange'}`}>{l.tem_nf ? '✓' : '✗'}</span></td>
                        <td><div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => editando === l.id ? setEditando(null) : abrirEdicao(l)}>{editando === l.id ? 'Fechar' : 'Editar'}</button>
                          <button className="btn-danger" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => excluir(l.id)}>Excluir</button>
                        </div></td>
                      </tr>
                      <LinhaEdicao l={l} cols={8} />
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.75rem', padding: '0 4px' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{dados.length} registros</span>
            <span style={{ fontFamily: 'DM Mono', fontSize: 14, fontWeight: 600 }}>Total: {fmt(total)}</span>
          </div>
        </>
      )}
    </div>
  )
}
