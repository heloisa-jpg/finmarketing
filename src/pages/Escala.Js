import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TURNOS = {
  diurno: { label: 'Diurno', cor: '#378ADD', horario: '06:00–14:00' },
  tarde: { label: 'Tarde', cor: '#1D9E75', horario: '14:00–22:00' },
  noite: { label: 'Noite', cor: '#534AB7', horario: '22:00–06:00' },
  madrugada: { label: 'Madrugada', cor: '#D4537E', horario: '00:00–06:00' },
}

export default function Escala() {
  const { profile, isAdmin } = useAuth()
  const isLider = profile?.perfil === 'lider'
  const [aba, setAba] = useState(isLider ? 'gerenciar' : 'minha_escala')
  const [mes, setMes] = useState(format(new Date(), 'yyyy-MM'))
  const [colaboradores, setColaboradores] = useState([])
  const [escalas, setEscalas] = useState([])
  const [pontos, setPontos] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Form nova escala
  const [form, setForm] = useState({
    colaborador_id: '', data: format(new Date(), 'yyyy-MM-dd'),
    turno: 'diurno', hora_inicio: '06:00', hora_fim: '14:00', folga: false
  })

  useEffect(() => {
    if (isAdmin || isLider) {
      supabase.from('colaboradores').select('id, nome, turno').eq('status', 'ativo').order('nome').then(({ data }) => setColaboradores(data || []))
    }
    load()
  }, [mes])

  const load = async () => {
    setLoading(true)
    const inicio = mes + '-01'
    const fim = format(endOfMonth(new Date(mes + '-02')), 'yyyy-MM-dd')

    let escQuery = supabase.from('escalas').select('*, colaboradores(nome)').gte('data', inicio).lte('data', fim)
    let pontoQuery = supabase.from('pontos').select('*, colaboradores(nome)').gte('data', inicio).lte('data', fim)

    if (!isAdmin && !isLider) {
      // Colaborador vê só a própria escala
      const { data: colab } = await supabase.from('colaboradores').select('id').eq('usuario_id', profile.id).single()
      if (colab) {
        escQuery = escQuery.eq('colaborador_id', colab.id)
        pontoQuery = pontoQuery.eq('colaborador_id', colab.id)
      }
    }

    const [{ data: esc }, { data: pont }] = await Promise.all([escQuery, pontoQuery])
    setEscalas(esc || [])
    setPontos(pont || [])
    setLoading(false)
  }

  const salvarEscala = async (e) => {
    e.preventDefault()
    setSalvando(true)
    await supabase.from('escalas').upsert({
      ...form,
      criado_por: profile.id,
    }, { onConflict: 'colaborador_id,data' })
    setSalvando(false)
    load()
  }

  const excluirEscala = async (id) => {
    await supabase.from('escalas').delete().eq('id', id)
    load()
  }

  const baterPonto = async (colabId, tipo, pontoExistente) => {
    const agora = new Date().toISOString()
    const hoje = format(new Date(), 'yyyy-MM-dd')
    if (!pontoExistente) {
      await supabase.from('pontos').insert({ colaborador_id: colabId, data: hoje, entrada: agora })
    } else {
      const upd = {}
      if (tipo === 'pausa') upd.inicio_pausa = agora
      else if (tipo === 'retorno') upd.fim_pausa = agora
      else if (tipo === 'saida') {
        upd.saida = agora
        const pausaH = pontoExistente.inicio_pausa && pontoExistente.fim_pausa
          ? (new Date(pontoExistente.fim_pausa) - new Date(pontoExistente.inicio_pausa)) / 3600000 : 0
        const totalH = Math.round(((new Date(agora) - new Date(pontoExistente.entrada)) / 3600000 - pausaH) * 100) / 100
        upd.total_horas = totalH
        upd.banco_horas = Math.round((totalH - 6) * 100) / 100
      }
      await supabase.from('pontos').update(upd).eq('id', pontoExistente.id)
    }
    load()
  }

  const dias = eachDayOfInterval({
    start: new Date(mes + '-01'),
    end: endOfMonth(new Date(mes + '-02'))
  })

  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    return { val: format(d, 'yyyy-MM'), label: format(d, 'MMM/yy', { locale: ptBR }) }
  })

  const fH = (ts) => ts ? format(new Date(ts), 'HH:mm') : '—'
  const hoje = format(new Date(), 'yyyy-MM-dd')
  const pontoHoje = pontos.find(p => p.data === hoje)

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Escala e Ponto</h1>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        {!isAdmin && !isLider && (
          <button onClick={() => setAba('minha_escala')} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 'var(--radius)', background: aba === 'minha_escala' ? 'var(--accent)' : 'transparent', color: aba === 'minha_escala' ? '#0f0f0f' : 'var(--text2)', border: 'none', cursor: 'pointer', fontWeight: aba === 'minha_escala' ? 600 : 400 }}>
            Minha escala
          </button>
        )}
        {!isAdmin && !isLider && (
          <button onClick={() => setAba('ponto')} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 'var(--radius)', background: aba === 'ponto' ? 'var(--accent)' : 'transparent', color: aba === 'ponto' ? '#0f0f0f' : 'var(--text2)', border: 'none', cursor: 'pointer', fontWeight: aba === 'ponto' ? 600 : 400 }}>
            Bater ponto
          </button>
        )}
        {(isAdmin || isLider) && (
          <>
            <button onClick={() => setAba('gerenciar')} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 'var(--radius)', background: aba === 'gerenciar' ? 'var(--accent)' : 'transparent', color: aba === 'gerenciar' ? '#0f0f0f' : 'var(--text2)', border: 'none', cursor: 'pointer', fontWeight: aba === 'gerenciar' ? 600 : 400 }}>
              Gerenciar escalas
            </button>
            <button onClick={() => setAba('ponto_equipe')} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 'var(--radius)', background: aba === 'ponto_equipe' ? 'var(--accent)' : 'transparent', color: aba === 'ponto_equipe' ? '#0f0f0f' : 'var(--text2)', border: 'none', cursor: 'pointer', fontWeight: aba === 'ponto_equipe' ? 600 : 400 }}>
              Ponto da equipe
            </button>
          </>
        )}
      </div>

      {/* Seletor de mês */}
      <div className="tag-mes">
        {meses.map(m => (
          <button key={m.val} className={mes === m.val ? 'active' : ''} onClick={() => setMes(m.val)}>{m.label}</button>
        ))}
      </div>

      {/* MINHA ESCALA (colaborador) */}
      {aba === 'minha_escala' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
            : escalas.length === 0 ? <div className="empty">Nenhuma escala definida para este mês</div>
            : (
              <table>
                <thead><tr><th>Data</th><th>Dia</th><th>Turno</th><th>Horário</th><th>Status</th></tr></thead>
                <tbody>
                  {escalas.map(e => {
                    const ponto = pontos.find(p => p.data === e.data)
                    const turno = TURNOS[e.turno]
                    return (
                      <tr key={e.id}>
                        <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{format(parseISO(e.data), 'dd/MM')}</td>
                        <td style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'capitalize' }}>{format(parseISO(e.data), 'EEE', { locale: ptBR })}</td>
                        <td>{e.folga ? <span className="badge badge-gray">Folga</span> : <span className="badge" style={{ background: turno?.cor + '22', color: turno?.cor }}>{turno?.label}</span>}</td>
                        <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{e.folga ? '—' : `${e.hora_inicio} – ${e.hora_fim}`}</td>
                        <td>
                          {e.folga ? '—' : ponto?.saida ? <span className="badge badge-green">✓ {ponto.total_horas}h</span>
                            : ponto?.entrada ? <span className="badge badge-orange">Em andamento</span>
                            : e.data === hoje ? <span className="badge badge-orange">Pendente</span>
                            : e.data < hoje ? <span className="badge badge-red">Faltou</span>
                            : <span className="badge badge-gray">Futuro</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
        </div>
      )}

      {/* BATER PONTO (colaborador) */}
      {aba === 'ponto' && (
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          {/* Escala de hoje */}
          {(() => {
            const escalaHoje = escalas.find(e => e.data === hoje)
            if (escalaHoje) {
              const turno = TURNOS[escalaHoje.turno]
              return (
                <div style={{ background: turno?.cor + '18', border: `1px solid ${turno?.cor}44`, borderRadius: 'var(--radius)', padding: '.875rem 1rem', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: turno?.cor }}>Turno de hoje: {turno?.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{escalaHoje.hora_inicio} – {escalaHoje.hora_fim}</div>
                </div>
              )
            }
            return null
          })()}

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</div>
            <div style={{ fontSize: 48, fontWeight: 500, fontFamily: 'DM Mono', letterSpacing: 2, margin: '1rem 0' }} id="relogio-escala">
              {format(new Date(), 'HH:mm')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
              <span>1º: <b style={{ color: 'var(--text)' }}>{fH(pontoHoje?.entrada)}</b></span>
              <span>2º: <b style={{ color: 'var(--text)' }}>{fH(pontoHoje?.inicio_pausa)}</b></span>
              <span>3º: <b style={{ color: 'var(--text)' }}>{fH(pontoHoje?.fim_pausa)}</b></span>
              <span>4º: <b style={{ color: 'var(--text)' }}>{fH(pontoHoje?.saida)}</b></span>
            </div>

            {!pontoHoje?.entrada && <button className="btn-primary" style={{ width: '100%', padding: 12, fontSize: 15, marginBottom: 8 }} onClick={async () => { const { data: c } = await supabase.from('colaboradores').select('id').eq('usuario_id', profile.id).single(); baterPonto(c.id, 'entrada', null) }}>1º ponto — Entrada</button>}
            {pontoHoje?.entrada && !pontoHoje?.inicio_pausa && <button className="btn-ghost" style={{ width: '100%', padding: 10, fontSize: 14, marginBottom: 8 }} onClick={async () => { const { data: c } = await supabase.from('colaboradores').select('id').eq('usuario_id', profile.id).single(); baterPonto(c.id, 'pausa', pontoHoje) }}>2º ponto — Início pausa</button>}
            {pontoHoje?.inicio_pausa && !pontoHoje?.fim_pausa && <button className="btn-ghost" style={{ width: '100%', padding: 10, fontSize: 14, marginBottom: 8 }} onClick={async () => { const { data: c } = await supabase.from('colaboradores').select('id').eq('usuario_id', profile.id).single(); baterPonto(c.id, 'retorno', pontoHoje) }}>3º ponto — Retorno pausa</button>}
            {pontoHoje?.fim_pausa && !pontoHoje?.saida && <button className="btn-danger" style={{ width: '100%', padding: 10, fontSize: 14, marginBottom: 8 }} onClick={async () => { const { data: c } = await supabase.from('colaboradores').select('id').eq('usuario_id', profile.id).single(); baterPonto(c.id, 'saida', pontoHoje) }}>4º ponto — Saída</button>}
            {pontoHoje?.saida && <div style={{ background: 'rgba(62,207,142,.1)', border: '1px solid rgba(62,207,142,.3)', borderRadius: 'var(--radius)', padding: 12, color: 'var(--green)', fontWeight: 500 }}>✓ Jornada concluída — {pontoHoje.total_horas}h registradas</div>}
          </div>
        </div>
      )}

      {/* GERENCIAR ESCALAS (líder/ADM) */}
      {aba === 'gerenciar' && (
        <>
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Adicionar / editar escala</div>
            <form onSubmit={salvarEscala}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Colaborador *</label>
                  <select value={form.colaborador_id} onChange={e => setForm(f => ({ ...f, colaborador_id: e.target.value }))} required>
                    <option value="">Selecionar...</option>
                    {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Data *</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Turno</label>
                  <select value={form.turno} onChange={e => {
                    const t = { diurno: ['06:00','14:00'], tarde: ['14:00','22:00'], noite: ['22:00','06:00'], madrugada: ['00:00','06:00'] }
                    setForm(f => ({ ...f, turno: e.target.value, hora_inicio: t[e.target.value][0], hora_fim: t[e.target.value][1] }))
                  }}>
                    {Object.entries(TURNOS).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.horario})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Hora início</label>
                  <input type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Hora fim</label>
                  <input type="time" value={form.hora_fim} onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))} />
                </div>
                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <label>Folga?</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <input type="checkbox" checked={form.folga} onChange={e => setForm(f => ({ ...f, folga: e.target.checked }))} style={{ width: 'auto' }} />
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Sim</span>
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: 12 }} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar escala'}</button>
            </form>
          </div>

          {/* Calendário do mês */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead><tr><th>Colaborador</th>{dias.slice(0, 15).map(d => <th key={d.toISOString()} style={{ fontSize: 10, textAlign: 'center', minWidth: 32 }}>{format(d, 'dd')}<br /><span style={{ color: 'var(--text3)', fontSize: 9 }}>{format(d, 'EEE', { locale: ptBR })}</span></th>)}</tr></thead>
              <tbody>
                {colaboradores.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' }}>{c.nome}</td>
                    {dias.slice(0, 15).map(d => {
                      const dataStr = format(d, 'yyyy-MM-dd')
                      const esc = escalas.find(e => e.colaborador_id === c.id && e.data === dataStr)
                      const turno = esc ? TURNOS[esc.turno] : null
                      return (
                        <td key={dataStr} style={{ textAlign: 'center', padding: '4px 2px' }}>
                          {esc ? (
                            esc.folga
                              ? <span style={{ fontSize: 9, color: 'var(--text3)' }}>F</span>
                              : <span style={{ width: 20, height: 20, borderRadius: 4, background: turno?.cor + '33', color: turno?.cor, fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{esc.turno[0].toUpperCase()}</span>
                          ) : <span style={{ fontSize: 9, color: 'var(--border2)' }}>·</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PONTO DA EQUIPE (líder/ADM) */}
      {aba === 'ponto_equipe' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
            : (
              <table>
                <thead><tr><th>Colaborador</th><th>Data</th><th>1º Entrada</th><th>2º Pausa</th><th>3º Retorno</th><th>4º Saída</th><th>Total</th><th>Banco</th></tr></thead>
                <tbody>
                  {pontos.sort((a, b) => b.data.localeCompare(a.data)).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.colaboradores?.nome}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{format(parseISO(p.data), 'dd/MM')}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: p.entrada ? 'var(--green)' : 'var(--text3)' }}>{fH(p.entrada)}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)' }}>{fH(p.inicio_pausa)}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)' }}>{fH(p.fim_pausa)}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{fH(p.saida)}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{p.total_horas != null ? `${p.total_horas}h` : '—'}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: p.banco_horas > 0 ? 'var(--green)' : p.banco_horas < 0 ? 'var(--red)' : 'var(--text3)' }}>
                        {p.banco_horas != null ? `${p.banco_horas >= 0 ? '+' : ''}${p.banco_horas}h` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      )}
    </div>
  )
}
