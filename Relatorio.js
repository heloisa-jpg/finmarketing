// Relatorio.js
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const MESES = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i)
  return { val: format(d, 'yyyy-MM'), label: format(d, 'MMM/yy', { locale: ptBR }) }
})

export default function Relatorio() {
  const [mes, setMes] = useState(format(new Date(), 'yyyy-MM'))
  const [dados, setDados] = useState([])
  const [porCat, setPorCat] = useState([])
  const [porSetor, setPorSetor] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [mes])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('lancamentos').select('*, categorias(nome,cor), setores(nome)')
      .gte('data', mes + '-01').lte('data', mes + '-31')
    if (data) {
      setDados(data)
      const catMap = {}, setorMap = {}
      data.forEach(l => {
        const c = l.categorias?.nome || 'Outros'; const cor = l.categorias?.cor || '#888'
        if (!catMap[c]) catMap[c] = { nome: c, cor, total: 0, qtd: 0 }
        catMap[c].total += Number(l.valor); catMap[c].qtd++
        const s = l.setores?.nome || 'Outros'
        if (!setorMap[s]) setorMap[s] = { nome: s, total: 0, qtd: 0 }
        setorMap[s].total += Number(l.valor); setorMap[s].qtd++
      })
      const cats = Object.values(catMap).sort((a, b) => b.total - a.total)
      const sets = Object.values(setorMap).sort((a, b) => b.total - a.total)
      const maxCat = cats[0]?.total || 1; const maxSet = sets[0]?.total || 1
      setPorCat(cats.map(c => ({ ...c, pct: (c.total / maxCat) * 100 })))
      setPorSetor(sets.map(s => ({ ...s, pct: (s.total / maxSet) * 100 })))
    }
    setLoading(false)
  }

  const total = dados.reduce((s, l) => s + Number(l.valor), 0)
  const semNF = dados.filter(l => !l.tem_nf).length

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Relatório</h1>
      </div>
      <div className="tag-mes">
        {MESES.map(m => <button key={m.val} className={mes === m.val ? 'active' : ''} onClick={() => setMes(m.val)}>{m.label}</button>)}
      </div>
      {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div> : (
        <>
          <div className="metric-grid">
            <div className="metric-card"><div className="label">Total gasto</div><div className="value">{fmt(total)}</div></div>
            <div className="metric-card"><div className="label">Lançamentos</div><div className="value">{dados.length}</div></div>
            <div className="metric-card"><div className="label">Sem NF</div><div className="value" style={{ color: semNF > 0 ? 'var(--orange)' : 'var(--green)' }}>{semNF}</div></div>
            <div className="metric-card"><div className="label">Ticket médio</div><div className="value">{fmt(dados.length ? total / dados.length : 0)}</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Por categoria</div>
              {porCat.map(c => (
                <div key={c.nome} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{c.nome} <span style={{ color: 'var(--text3)', fontSize: 11 }}>({c.qtd}x)</span></span>
                    <span style={{ fontSize: 12, fontFamily: 'DM Mono', fontWeight: 500 }}>{fmt(c.total)}</span>
                  </div>
                  <div className="saldo-bar"><div className="saldo-fill" style={{ width: `${c.pct}%`, background: c.cor }} /></div>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Por setor</div>
              {porSetor.map(s => (
                <div key={s.nome} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.nome} <span style={{ color: 'var(--text3)', fontSize: 11 }}>({s.qtd}x)</span></span>
                    <span style={{ fontSize: 12, fontFamily: 'DM Mono', fontWeight: 500 }}>{fmt(s.total)}</span>
                  </div>
                  <div className="saldo-bar"><div className="saldo-fill" style={{ width: `${s.pct}%`, background: '#a78bfa' }} /></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
