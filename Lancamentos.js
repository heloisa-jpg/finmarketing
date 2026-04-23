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

  useEffect(() => {
    supabase.from('categorias').select('*').then(({ data }) => setCategorias(data || []))
    supabase.from('setores').select('*').then(({ data }) => setSetores(data || []))
  }, [])

  useEffect(() => { load() }, [mes, filtCat, filtSetor, filtNF])

  const load = async () => {
    setLoading(true)
    let q = supabase
      .from('lancamentos')
      .select('*, categorias(nome,cor), setores(nome), profiles(nome)')
      .gte('data', mes + '-01')
      .lte('data', mes + '-31')
      .order('data', { ascending: false })

    if (filtCat) q = q.eq('categoria_id', filtCat)
    if (filtSetor) q = q.eq('setor_id', filtSetor)
    if (filtNF === 'sim') q = q.eq('tem_nf', true)
    if (filtNF === 'nao') q = q.eq('tem_nf', false)

    const { data } = await q
    setDados(data || [])
    setLoading(false)
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
          <button key={m.val} className={mes === m.val ? 'active' : ''} onClick={() => setMes(m.val)}>
            {m.label}
          </button>
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
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Setor</th>
                <th>Cartão</th>
                {isAdmin && <th>Usuário</th>}
                <th>Valor</th>
                <th>NF</th>
              </tr>
            </thead>
            <tbody>
              {dados.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {format(new Date(l.data + 'T12:00:00'), 'dd/MM/yy')}
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{l.descricao}</div>
                    {l.observacoes && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l.observacoes}</div>}
                  </td>
                  <td>
                    <span className="badge" style={{ background: (l.categorias?.cor || '#888') + '22', color: l.categorias?.cor || '#888' }}>
                      {l.categorias?.nome || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{l.setores?.nome || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{l.metodo || '—'}</td>
                  {isAdmin && <td style={{ fontSize: 12, color: 'var(--text3)' }}>{l.profiles?.nome || '—'}</td>}
                  <td style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{fmt(l.valor)}</td>
                  <td>
                    <span className={`badge ${l.tem_nf ? 'badge-green' : 'badge-orange'}`}>
                      {l.tem_nf ? '✓' : '✗ Falta'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {dados.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.75rem', padding: '0 4px' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{dados.length} registros</span>
          <span style={{ fontFamily: 'DM Mono', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            Total: {fmt(total)}
          </span>
        </div>
      )}
    </div>
  )
}
