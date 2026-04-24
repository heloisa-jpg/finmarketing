import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const MESES = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i)
  return { val: format(d, 'yyyy-MM'), label: format(d, 'MMM/yy', { locale: ptBR }) }
})

export default function Lancamentos() {
  const { isAdmin, setPage } = useAuth()
  const [dados, setDados] = useState([])
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

  useEffect(() => {
    supabase.from('categorias').select('*').then(({ data }) => {
      setCategorias(data || [])
      const m = {}; (data || []).forEach(c => m[c.id] = c); setCatMap(m)
    })
    supabase.from('setores').select('*').then(({ data }) => {
      setSetores(data || [])
      const m = {}; (data || []).forEach(s => m[s.id] = s); setSetMap(m)
    })
  }, [])

  useEffect(() => { load() }, [mes, filtCat, filtSetor, filtNF])

  const load = async () => {
    setLoading(true)
    let q = supabase.from('lancamentos').select('*')
      .gte('data', mes + '-01').lte('data', mes + '-31')
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
    setEditForm({
      data: l.data, descricao: l.descricao, valor: String(l.valor),
      categoria_id: l.categoria_id || '', setor_id: l.setor_id || '',
      metodo: l.metodo || '', observacoes: l.observacoes || '', tem_nf: l.tem_nf || false,
    })
  }

  const salvarEdicao = async (id) => {
    setSalvando(true)
    await supabase.from('lancamentos').update({
      ...editForm, valor: parseFloat(editForm.valor.replace(',', '.')),
    }).eq('id', id)
    setSalvando(false)
    setEditando(null)
    load()
  }

  const excluir = async (id) => {
    if (window.confirm('Excluir este lançamento?')) {
      await supabase.from('lancamentos').delete().eq('id', id)
      load()
    }
  }

  const total = dados.reduce((s, l) => s + Number(l.valor), 0)

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Despesas</h1>
        <button className="btn-primary" onClick={() => setPage('novo_lancamento')}>+ Lançar gasto</button>
      </div>

      <div className="tag-mes">
        {MESES.map(m => (
          <button key={m.val} className={mes === m.val ? 'active' : ''} onClick={() => setMes(m.val)}>{m.label}</button>
        ))}
      </div>

      <div className="filters">
        <select value={filtCat} onChange={e => setFiltCat(e.target.value)}>
          <option value="">Todas categorias</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select value={filtSetor} onChange={e => setFiltSetor(e.target.value)}>
          <option value="">Todos setores</option>
          {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <select value={filtNF} onChange={e => setFiltNF(e.target.value)}>
          <option value="">Qualquer NF</option>
          <option value="sim">Com NF</option>
          <option value="nao">Sem NF</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
        ) : dados.length === 0 ? (
          <div className="empty">Nenhum lançamento encontrado</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th><th>Descrição</th><th>Categoria</th><th>Setor</th>
                <th>Método</th><th>Valor</th><th>NF</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dados.map(l => (
                <React.Fragment key={l.id}>
                  <tr>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {format(new Date(l.data + 'T12:00:00'), 'dd/MM/yy')}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{l.descricao}</div>
                      {l.observacoes && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l.observacoes}</div>}
                    </td>
                    <td>
                      <span className="badge" style={{ background: (catMap[l.categoria_id]?.cor || '#888') + '22', color: catMap[l.categoria_id]?.cor || '#888' }}>
                        {catMap[l.categoria_id]?.nome || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{setMap[l.setor_id]?.nome || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{l.metodo || '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{fmt(l.valor)}</td>
                    <td><span className={`badge ${l.tem_nf ? 'badge-green' : 'badge-orange'}`}>{l.tem_nf ? '✓' : '✗ Falta'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }}
                          onClick={() => editando === l.id ? setEditando(null) : abrirEdicao(l)}>
                          {editando === l.id ? 'Fechar' : 'Editar'}
                        </button>
                        <button className="btn-danger" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => excluir(l.id)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editando === l.id && (
                    <tr>
                      <td colSpan={8} style={{ background: 'var(--bg3)', padding: '1rem' }}>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Data</label>
                            <input type="date" value={editForm.data} onChange={e => setEditForm(f => ({ ...f, data: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>Valor (R$)</label>
                            <input type="text" value={editForm.valor} onChange={e => setEditForm(f => ({ ...f, valor: e.target.value }))} />
                          </div>
                          <div className="form-group full">
                            <label>Descrição</label>
                            <input type="text" value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>Categoria</label>
                            <select value={editForm.categoria_id} onChange={e => setEditForm(f => ({ ...f, categoria_id: e.target.value }))}>
                              <option value="">—</option>
                              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Setor</label>
                            <select value={editForm.setor_id} onChange={e => setEditForm(f => ({ ...f, setor_id: e.target.value }))}>
                              <option value="">—</option>
                              {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Método</label>
                            <input type="text" value={editForm.metodo} onChange={e => setEditForm(f => ({ ...f, metodo: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>Observações</label>
                            <input type="text" value={editForm.observacoes} onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>NF anexada?</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <input type="checkbox" checked={editForm.tem_nf} onChange={e => setEditForm(f => ({ ...f, tem_nf: e.target.checked }))} style={{ width: 'auto' }} />
                              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Sim</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button className="btn-primary" onClick={() => salvarEdicao(l.id)} disabled={salvando}>
                            {salvando ? 'Salvando...' : 'Salvar alterações'}
                          </button>
                          <button className="btn-ghost" onClick={() => setEditando(null)}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {dados.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.75rem', padding: '0 4px' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{dados.length} registros</span>
          <span style={{ fontFamily: 'DM Mono', fontSize: 14, fontWeight: 600 }}>Total: {fmt(total)}</span>
        </div>
      )}
    </div>
  )
}
        </div>
      )}
    </div>
  )
}
