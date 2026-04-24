import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { format, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function Dashboard() {
  const { isAdmin, setPage } = useAuth()
  const [stats, setStats] = useState({ total: 0, ferramentas: 0, transporte: 0, sem_nf: 0 })
  const [recentes, setRecentes] = useState([])
  const [porCategoria, setPorCategoria] = useState([])
  const [mes, setMes] = useState(format(new Date(), 'yyyy-MM'))
  const [loading, setLoading] = useState(true)
  const [categorias, setCategorias] = useState({})
  const [setores, setSetores] = useState({})

  useEffect(() => {
    loadRefs()
  }, [])

  useEffect(() => {
    if (Object.keys(categorias).length > 0) load()
  }, [mes, categorias])

  const loadRefs = async () => {
    const { data: cats } = await supabase.from('categorias').select('*')
    const { data: sets } = await supabase.from('setores').select('*')
    const catMap = {}
    const setMap = {}
    if (cats) cats.forEach(c => catMap[c.id] = c)
    if (sets) sets.forEach(s => setMap[s.id] = s)
    setCategorias(catMap)
    setSetores(setMap)
  }

  const load = async () => {
    setLoading(true)
    const inicio = mes + '-01'
    const fim = format(endOfMonth(new Date(inicio + 'T12:00:00')), 'yyyy-MM-dd')

    const { data: lanc, error } = await supabase
      .from('lancamentos')
      .select('*')
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: false })

    if (lanc && lanc.length > 0) {
      const enriched = lanc.map(l => ({
        ...l,
        cat: categorias[l.categoria_id] || { nome: 'Outros', cor: '#888' },
        set: setores[l.setor_id] || { nome: '—' },
      }))

      const total = enriched.reduce((s, l) => s + Number(l.valor), 0)
      const sem_nf = enriched.filter(l => !l.tem_nf).length
      const ferr = enriched.filter(l => l.cat?.nome === 'Ferramenta').reduce((s, l) => s + Number(l.valor), 0)
      const transp = enriched.filter(l => l.cat?.nome === 'Transporte').reduce((s, l) => s + Number(l.valor), 0)
      setStats({ total, ferramentas: ferr, transporte: transp, sem_nf })

      const map = {}
      enriched.forEach(l => {
        const nome = l.cat?.nome || 'Outros'
        const cor = l.cat?.cor || '#888'
        if (!map[nome]) map[nome] = { nome, cor, total: 0 }
        map[nome].total += Number(l.valor)
      })
      const cats = Object.values(map).sort((a, b) => b.total - a.total)
      const maxVal = cats[0]?.total || 1
      setPorCategoria(cats.map(c => ({ ...c, pct: (c.total / maxVal) * 100 })))
      setRecentes(enriched.slice(0, 8))
    } else {
      setStats({ total: 0, ferramentas: 0, transporte: 0, sem_nf: 0 })
      setPorCategoria([])
      setRecentes([])
    }
    setLoading(false)
  }

  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return { val: format(d, 'yyyy-MM'), label: format(d, 'MMM/yy', { locale: ptBR }) }
  })

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Painel</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="tag-mes" style={{ margin: 0 }}>
            {meses.map(m => (
              <button key={m.val} className={mes === m.val ? 'active' : ''} onClick={() => setMes(m.val)}>
                {m.label}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setPage('novo_lancamento')}>+ Lançar</button>
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <>
          <div className="metric-grid">
            <div className="metric-card">
              <div className="label">Total gasto</div>
              <div className="value" style={{ color: stats.total > 10000 ? 'var(--red)' : 'var(--text)' }}>
                {fmt(stats.total)}
              </div>
              <div className="sub">{format(new Date(mes + '-02'), 'MMMM yyyy', { locale: ptBR })}</div>
            </div>
            <div className="metric-card">
              <div className="label">Ferramentas</div>
              <div className="value" style={{ color: 'var(--purple)' }}>{fmt(stats.ferramentas)}</div>
              <div className="sub">Assinaturas recorrentes</div>
            </div>
            <div className="metric-card">
              <div className="label">Transporte</div>
              <div className="value" style={{ color: 'var(--blue)' }}>{fmt(stats.transporte)}</div>
              <div className="sub">Uber e fretes</div>
            </div>
            <div className="metric-card">
              <div className="label">Sem NF</div>
              <div className="value" style={{ color: stats.sem_nf > 0 ? 'var(--orange)' : 'var(--green)' }}>
                {stats.sem_nf}
              </div>
              <div className="sub">Lançamentos pendentes</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: '1rem', color: 'var(--text2)' }}>
                Por categoria
              </div>
              {porCategoria.length === 0 ? (
                <div className="empty" style={{ padding: '1rem' }}>Sem lançamentos</div>
              ) : (
                porCategoria.map(c => (
                  <div key={c.nome} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{c.nome}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'DM Mono', color: 'var(--text)' }}>
                        {fmt(c.total)}
                      </span>
                    </div>
                    <div className="saldo-bar">
                      <div className="saldo-fill" style={{ width: `${c.pct}%`, background: c.cor }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: '1rem', color: 'var(--text2)' }}>
                Ações rápidas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Lançar gasto', sub: 'Registrar nova despesa', page: 'novo_lancamento', color: 'var(--accent)' },
                  { label: 'Pedir reembolso', sub: 'Solicitar devolução de valor', page: 'reembolsos', color: 'var(--blue)' },
                  isAdmin && { label: 'Solicitação de pagamento', sub: 'Freela, PJ ou recorrente', page: 'solicitacoes', color: 'var(--purple)' },
                  isAdmin && { label: 'Ver relatório completo', sub: 'Análise por período', page: 'relatorio', color: 'var(--green)' },
                ].filter(Boolean).map(a => (
                  <button
                    key={a.page}
                    onClick={() => setPage(a.page)}
                    style={{
                      background: 'var(--bg3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'var(--text)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{a.sub}</div>
                    </div>
                    <span style={{ color: a.color, fontSize: 16 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: '1rem', color: 'var(--text2)' }}>
              Últimos lançamentos
            </div>
            {recentes.length === 0 ? (
              <div className="empty">Nenhum lançamento neste mês</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Setor</th>
                    <th>Valor</th>
                    <th>NF</th>
                  </tr>
                </thead>
                <tbody>
                  {recentes.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)' }}>
                        {format(new Date(l.data + 'T12:00:00'), 'dd/MM')}
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {l.descricao}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gray" style={{ background: (l.cat?.cor || '#888') + '22', color: l.cat?.cor || '#888' }}>
                          {l.cat?.nome || '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{l.set?.nome || '—'}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 500 }}>{fmt(l.valor)}</td>
                      <td>
                        <span className={`badge ${l.tem_nf ? 'badge-green' : 'badge-orange'}`}>
                          {l.tem_nf ? '✓ NF' : '✗ Falta'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {recentes.length > 0 && (
              <button
                onClick={() => setPage('lancamentos')}
                style={{ background: 'transparent', color: 'var(--text3)', fontSize: 12, marginTop: '.75rem', padding: '4px 0' }}
              >
                Ver todos →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
