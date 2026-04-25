import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmtVal = (v) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—'
const TIPO_CLS = { clt: 'badge-green', pj: 'badge-blue', estagio: 'badge-orange', freela: 'badge-purple' }
const STATUS_CLS = { ativo: 'badge-green', inativo: 'badge-red', ferias: 'badge-blue', afastado: 'badge-orange' }
const STATUS_LABEL = { ativo: 'Ativo', inativo: 'Inativo', ferias: 'Férias', afastado: 'Afastado' }
const TURNO_LABEL = { diurno: 'Diurno', tarde: 'Tarde', noite: 'Noite', madrugada: 'Madrugada' }
const TIPO_BEN = { vt: 'Vale Transporte', vr: 'Vale Refeição', saude: 'Plano Saúde', odonto: 'Odonto', outros: 'Outros' }
const ETAPAS = ['Documentos entregues', 'Acesso ao sistema', 'Treinamento interno', 'Apresentação à equipe', 'Assinatura de contrato', 'Avaliação 30 dias']

function Avatar({ nome, size = 28 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent)', color: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0 }}>
      {nome?.charAt(0) || '?'}
    </div>
  )
}

export default function RH({ abaInicial = 'overview' }) {
  const { isAdmin, profile } = useAuth()
  const [aba, setAba] = useState(abaInicial)
  const [colaboradorAberto, setColaboradorAberto] = useState(null)

  useEffect(() => { setAba(abaInicial) }, [abaInicial])

  if (!isAdmin) {
    return <ColaboradorRH profile={profile} aba={abaInicial} />
  }

  return (
    <div>
      {colaboradorAberto ? (
        <PerfilColaborador colaborador={colaboradorAberto} onVoltar={() => setColaboradorAberto(null)} />
      ) : (
        <>
          {aba === 'overview' && <VisaoGeral onAbrirColab={setColaboradorAberto} />}
          {aba === 'ponto' && <Ponto />}
          {aba === 'ferias' && <Ferias />}
          {aba === 'desempenho' && <Desempenho />}
          {aba === 'onboarding' && <Onboarding />}
        </>
      )}
    </div>
  )
}

// ============================================================
// VISÃO GERAL (ADM)
// ============================================================
function VisaoGeral({ onAbrirColab }) {
  const [colaboradores, setColaboradores] = useState([])
  const [setores, setSetores] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtTipo, setFiltTipo] = useState('')
  const [form, setForm] = useState({
    nome: '', tipo: 'clt', status: 'ativo', cargo: '', setor_id: '',
    data_admissao: '', aniversario: '', cpf: '', rg: '', cnpj: '',
    email: '', telefone: '', chave_pix: '', endereco: '',
    turno: '', hora_entrada: '', hora_saida: '', carga_horaria_dia: '6'
  })
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.from('setores').select('*').then(({ data }) => setSetores(data || []))
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('colaboradores').select('*, setores(nome)').order('nome')
    setColaboradores(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSalvando(true)
    const payload = {}
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) payload[k] = v
    })
    payload.carga_horaria_dia = parseFloat(form.carga_horaria_dia) || 6
    payload.setor_id = form.setor_id || null
    payload.turno = form.turno || null
    payload.hora_entrada = form.hora_entrada || null
    payload.hora_saida = form.hora_saida || null

    await supabase.from('colaboradores').insert(payload)
    setSalvando(false); setMostrarForm(false)
    setForm({ nome: '', tipo: 'clt', status: 'ativo', cargo: '', setor_id: '', data_admissao: '', aniversario: '', cpf: '', rg: '', cnpj: '', email: '', telefone: '', chave_pix: '', endereco: '', turno: '', hora_entrada: '', hora_saida: '', carga_horaria_dia: '6' })
    load()
  }

  const mesAtual = new Date().getMonth()
  const aniversariantes = colaboradores.filter(c => c.aniversario && c.status === 'ativo' && parseISO(c.aniversario).getMonth() === mesAtual)
  const filtrados = colaboradores.filter(c =>
    (c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.cargo || '').toLowerCase().includes(busca.toLowerCase())) &&
    (!filtTipo || c.tipo === filtTipo)
  )

  return (
    <>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Recursos Humanos</h1>
        <button className="btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? '← Fechar' : '+ Novo colaborador'}
        </button>
      </div>

      {/* Métricas */}
      <div className="metric-grid">
        <div className="metric-card"><div className="label">Ativos</div><div className="value">{colaboradores.filter(c => c.status === 'ativo').length}</div></div>
        <div className="metric-card"><div className="label">CLT</div><div className="value">{colaboradores.filter(c => c.tipo === 'clt' && c.status === 'ativo').length}</div><div className="sub">Ponto + férias</div></div>
        <div className="metric-card"><div className="label">PJ</div><div className="value">{colaboradores.filter(c => c.tipo === 'pj' && c.status === 'ativo').length}</div></div>
        <div className="metric-card"><div className="label">Aniversários</div><div className="value" style={{ color: 'var(--accent)' }}>{aniversariantes.length}</div><div className="sub">Este mês</div></div>
      </div>

      {/* Aniversariantes */}
      {aniversariantes.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '.75rem' }}>🎂 Aniversariantes do mês</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {aniversariantes.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
                <Avatar nome={c.nome} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {format(parseISO(c.aniversario), "dd 'de' MMMM", { locale: ptBR })}
                    {parseISO(c.aniversario).getDate() === new Date().getDate() && <span style={{ color: 'var(--accent)', marginLeft: 6, fontWeight: 600 }}>Hoje! 🎉</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulário novo colaborador */}
      {mostrarForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Novo colaborador</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full"><label>Nome completo *</label><input type="text" value={form.nome} onChange={e => setF('nome', e.target.value)} required /></div>
              <div className="form-group"><label>Tipo *</label>
                <select value={form.tipo} onChange={e => setF('tipo', e.target.value)}>
                  <option value="clt">CLT</option><option value="pj">PJ</option><option value="estagio">Estágio</option><option value="freela">Freela</option>
                </select>
              </div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={e => setF('status', e.target.value)}>
                  <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="ferias">Férias</option><option value="afastado">Afastado</option>
                </select>
              </div>
              <div className="form-group"><label>Cargo</label><input type="text" value={form.cargo} onChange={e => setF('cargo', e.target.value)} /></div>
              <div className="form-group"><label>Setor</label>
                <select value={form.setor_id} onChange={e => setF('setor_id', e.target.value)}>
                  <option value="">Selecionar...</option>{setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Admissão</label><input type="date" value={form.data_admissao} onChange={e => setF('data_admissao', e.target.value)} /></div>
              <div className="form-group"><label>Aniversário</label><input type="date" value={form.aniversario} onChange={e => setF('aniversario', e.target.value)} /></div>
              <div className="form-group"><label>CPF</label><input type="text" placeholder="000.000.000-00" value={form.cpf} onChange={e => setF('cpf', e.target.value)} /></div>
              <div className="form-group"><label>RG</label><input type="text" value={form.rg} onChange={e => setF('rg', e.target.value)} /></div>
              {form.tipo === 'pj' && <div className="form-group"><label>CNPJ</label><input type="text" value={form.cnpj} onChange={e => setF('cnpj', e.target.value)} /></div>}
              <div className="form-group"><label>E-mail</label><input type="email" value={form.email} onChange={e => setF('email', e.target.value)} /></div>
              <div className="form-group"><label>Telefone</label><input type="text" value={form.telefone} onChange={e => setF('telefone', e.target.value)} /></div>
              <div className="form-group"><label>Chave PIX</label><input type="text" value={form.chave_pix} onChange={e => setF('chave_pix', e.target.value)} /></div>
              <div className="form-group full"><label>Endereço</label><input type="text" value={form.endereco} onChange={e => setF('endereco', e.target.value)} /></div>
              {form.tipo === 'clt' && <>
                <div className="form-group"><label>Turno</label>
                  <select value={form.turno} onChange={e => setF('turno', e.target.value)}>
                    <option value="">Selecionar...</option><option value="diurno">Diurno</option><option value="tarde">Tarde</option><option value="noite">Noite</option><option value="madrugada">Madrugada</option>
                  </select>
                </div>
                <div className="form-group"><label>Carga horária/dia (h)</label><input type="number" step="0.5" value={form.carga_horaria_dia} onChange={e => setF('carga_horaria_dia', e.target.value)} /></div>
                <div className="form-group"><label>Entrada padrão</label><input type="time" value={form.hora_entrada} onChange={e => setF('hora_entrada', e.target.value)} /></div>
                <div className="form-group"><label>Saída padrão</label><input type="time" value={form.hora_saida} onChange={e => setF('hora_saida', e.target.value)} /></div>
              </>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Cadastrar'}</button>
              <button type="button" className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="filters">
        <input type="text" placeholder="Buscar por nome ou cargo..." value={busca} onChange={e => setBusca(e.target.value)} style={{ maxWidth: 250 }} />
        <select value={filtTipo} onChange={e => setFiltTipo(e.target.value)}>
          <option value="">Todos os tipos</option><option value="clt">CLT</option><option value="pj">PJ</option><option value="estagio">Estágio</option><option value="freela">Freela</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
          : filtrados.length === 0 ? <div className="empty">Nenhum colaborador encontrado</div>
          : (
            <table>
              <thead><tr><th>Nome</th><th>Tipo</th><th>Cargo</th><th>Setor</th><th>Admissão</th><th>Aniversário</th><th>Turno</th><th>Status</th></tr></thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c.id} onClick={() => onAbrirColab(c)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar nome={c.nome} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{c.nome}</div>
                          {c.email && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${TIPO_CLS[c.tipo]}`}>{c.tipo.toUpperCase()}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{c.cargo || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{c.setores?.nome || '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)' }}>{c.data_admissao ? format(parseISO(c.data_admissao), 'dd/MM/yy') : '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--accent)' }}>{c.aniversario ? format(parseISO(c.aniversario), 'dd/MM') : '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{c.tipo === 'clt' ? (TURNO_LABEL[c.turno] || '—') : '—'}</td>
                    <td><span className={`badge ${STATUS_CLS[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </>
  )
}

// ============================================================
// PERFIL COMPLETO DO COLABORADOR (ADM clica na tabela)
// ============================================================
function PerfilColaborador({ colaborador: c, onVoltar }) {
  const [salarios, setSalarios] = useState([])
  const [beneficios, setBeneficios] = useState([])
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ ...c })
  const [salvando, setSalvando] = useState(false)
  const [formSal, setFormSal] = useState({ valor: '', data_vigencia: format(new Date(), 'yyyy-MM-dd'), percentual_reajuste: '', observacoes: '' })
  const [formBen, setFormBen] = useState({ tipo: 'vt', descricao: '', valor: '' })
  const [setores, setSetores] = useState([])

  useEffect(() => {
    supabase.from('setores').select('*').then(({ data }) => setSetores(data || []))
    supabase.from('salarios').select('*').eq('colaborador_id', c.id).order('data_vigencia', { ascending: false }).then(({ data }) => setSalarios(data || []))
    supabase.from('beneficios_rh').select('*').eq('colaborador_id', c.id).eq('ativo', true).then(({ data }) => setBeneficios(data || []))
  }, [c.id])

  const salvarDados = async (e) => {
    e.preventDefault(); setSalvando(true)
    const payload = {}
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '' && v !== undefined) payload[k] = v === null ? null : v
    })
    payload.hora_entrada = form.hora_entrada || null
    payload.hora_saida = form.hora_saida || null
    payload.setor_id = form.setor_id || null
    payload.turno = form.turno || null
    await supabase.from('colaboradores').update(payload).eq('id', c.id)
    setSalvando(false); setEditando(false)
  }

  const adicionarSalario = async (e) => {
    e.preventDefault()
    await supabase.from('salarios').insert({ ...formSal, colaborador_id: c.id, valor: parseFloat(formSal.valor), percentual_reajuste: parseFloat(formSal.percentual_reajuste) || null })
    setFormSal({ valor: '', data_vigencia: format(new Date(), 'yyyy-MM-dd'), percentual_reajuste: '', observacoes: '' })
    const { data } = await supabase.from('salarios').select('*').eq('colaborador_id', c.id).order('data_vigencia', { ascending: false })
    setSalarios(data || [])
  }

  const adicionarBeneficio = async (e) => {
    e.preventDefault()
    await supabase.from('beneficios_rh').insert({ ...formBen, colaborador_id: c.id, valor: parseFloat(formBen.valor) || null })
    setFormBen({ tipo: 'vt', descricao: '', valor: '' })
    const { data } = await supabase.from('beneficios_rh').select('*').eq('colaborador_id', c.id).eq('ativo', true)
    setBeneficios(data || [])
  }

  const removerBeneficio = async (id) => {
    await supabase.from('beneficios_rh').update({ ativo: false }).eq('id', id)
    setBeneficios(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost" onClick={onVoltar}>← Voltar</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar nome={c.nome} size={38} />
            <div>
              <h1 className="page-title" style={{ margin: 0, fontSize: 18 }}>{c.nome}</h1>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.cargo || '—'} · {c.tipo?.toUpperCase()}</div>
            </div>
          </div>
        </div>
        <button className="btn-ghost" onClick={() => setEditando(!editando)}>{editando ? '← Cancelar' : '✎ Editar dados'}</button>
      </div>

      {editando ? (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Editando dados</div>
          <form onSubmit={salvarDados}>
            <div className="form-grid">
              <div className="form-group full"><label>Nome completo</label><input type="text" value={form.nome || ''} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div className="form-group"><label>Tipo</label>
                <select value={form.tipo || 'clt'} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="clt">CLT</option><option value="pj">PJ</option><option value="estagio">Estágio</option><option value="freela">Freela</option>
                </select>
              </div>
              <div className="form-group"><label>Status</label>
                <select value={form.status || 'ativo'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="ferias">Férias</option><option value="afastado">Afastado</option>
                </select>
              </div>
              <div className="form-group"><label>Cargo</label><input type="text" value={form.cargo || ''} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} /></div>
              <div className="form-group"><label>Setor</label>
                <select value={form.setor_id || ''} onChange={e => setForm(f => ({ ...f, setor_id: e.target.value }))}>
                  <option value="">—</option>{setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Admissão</label><input type="date" value={form.data_admissao || ''} onChange={e => setForm(f => ({ ...f, data_admissao: e.target.value }))} /></div>
              <div className="form-group"><label>Desligamento</label><input type="date" value={form.data_desligamento || ''} onChange={e => setForm(f => ({ ...f, data_desligamento: e.target.value }))} /></div>
              <div className="form-group"><label>Aniversário</label><input type="date" value={form.aniversario || ''} onChange={e => setForm(f => ({ ...f, aniversario: e.target.value }))} /></div>
              <div className="form-group"><label>CPF</label><input type="text" value={form.cpf || ''} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} /></div>
              <div className="form-group"><label>RG</label><input type="text" value={form.rg || ''} onChange={e => setForm(f => ({ ...f, rg: e.target.value }))} /></div>
              <div className="form-group"><label>CNPJ</label><input type="text" value={form.cnpj || ''} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} /></div>
              <div className="form-group"><label>E-mail</label><input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-group"><label>Telefone</label><input type="text" value={form.telefone || ''} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
              <div className="form-group"><label>Chave PIX</label><input type="text" value={form.chave_pix || ''} onChange={e => setForm(f => ({ ...f, chave_pix: e.target.value }))} /></div>
              <div className="form-group full"><label>Endereço</label><input type="text" value={form.endereco || ''} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} /></div>
              {form.tipo === 'clt' && <>
                <div className="form-group"><label>Turno</label>
                  <select value={form.turno || ''} onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}>
                    <option value="">—</option><option value="diurno">Diurno</option><option value="tarde">Tarde</option><option value="noite">Noite</option><option value="madrugada">Madrugada</option>
                  </select>
                </div>
                <div className="form-group"><label>Carga horária/dia</label><input type="number" step="0.5" value={form.carga_horaria_dia || 6} onChange={e => setForm(f => ({ ...f, carga_horaria_dia: e.target.value }))} /></div>
                <div className="form-group"><label>Entrada padrão</label><input type="time" value={form.hora_entrada || ''} onChange={e => setForm(f => ({ ...f, hora_entrada: e.target.value }))} /></div>
                <div className="form-group"><label>Saída padrão</label><input type="time" value={form.hora_saida || ''} onChange={e => setForm(f => ({ ...f, hora_saida: e.target.value }))} /></div>
              </>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar alterações'}</button>
              <button type="button" className="btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '.75rem' }}>Dados pessoais</div>
            {[
              ['Admissão', c.data_admissao ? format(parseISO(c.data_admissao), 'dd/MM/yyyy') : '—'],
              ['Aniversário', c.aniversario ? format(parseISO(c.aniversario), 'dd/MM') : '—'],
              ['CPF', c.cpf || '—'], ['RG', c.rg || '—'],
              ['CNPJ', c.cnpj || '—'], ['E-mail', c.email || '—'],
              ['Telefone', c.telefone || '—'], ['Chave PIX', c.chave_pix || '—'],
              ['Endereço', c.endereco || '—'],
              ['Turno', c.tipo === 'clt' ? (TURNO_LABEL[c.turno] || '—') : '— PJ'],
            ].map(([label, valor]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text3)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{valor}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Salário</div>
              </div>
              {salarios.length > 0 ? (
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'DM Mono', marginBottom: 8 }}>{fmtVal(salarios[0].valor)}</div>
              ) : <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>Nenhum salário cadastrado</div>}
              <form onSubmit={adicionarSalario}>
                <div className="form-grid">
                  <div className="form-group"><label>Valor (R$) *</label><input type="number" step="0.01" value={formSal.valor} onChange={e => setFormSal(f => ({ ...f, valor: e.target.value }))} required /></div>
                  <div className="form-group"><label>% reajuste</label><input type="number" step="0.1" value={formSal.percentual_reajuste} onChange={e => setFormSal(f => ({ ...f, percentual_reajuste: e.target.value }))} placeholder="Ex: 12" /></div>
                  <div className="form-group"><label>Vigência</label><input type="date" value={formSal.data_vigencia} onChange={e => setFormSal(f => ({ ...f, data_vigencia: e.target.value }))} /></div>
                  <div className="form-group"><label>Observação</label><input type="text" value={formSal.observacoes} onChange={e => setFormSal(f => ({ ...f, observacoes: e.target.value }))} /></div>
                </div>
                <button type="submit" className="btn-ghost" style={{ marginTop: 8, fontSize: 12 }}>+ Registrar reajuste</button>
              </form>
              {salarios.length > 1 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Histórico</div>
                  {salarios.slice(1).map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', padding: '3px 0' }}>
                      <span>{s.data_vigencia ? format(parseISO(s.data_vigencia), 'MM/yyyy') : '—'}</span>
                      <span>{fmtVal(s.valor)} {s.percentual_reajuste ? `(+${s.percentual_reajuste}%)` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '.75rem' }}>Benefícios</div>
              {beneficios.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <div>
                    <span className="badge badge-blue" style={{ marginRight: 6 }}>{TIPO_BEN[b.tipo]}</span>
                    {b.descricao}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'DM Mono' }}>{fmtVal(b.valor)}</span>
                    <button onClick={() => removerBeneficio(b.id)} style={{ background: 'transparent', color: 'var(--red)', fontSize: 12, border: 'none', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
              <form onSubmit={adicionarBeneficio} style={{ marginTop: 10 }}>
                <div className="form-grid">
                  <div className="form-group"><label>Tipo</label>
                    <select value={formBen.tipo} onChange={e => setFormBen(f => ({ ...f, tipo: e.target.value }))}>
                      {Object.entries(TIPO_BEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" value={formBen.valor} onChange={e => setFormBen(f => ({ ...f, valor: e.target.value }))} /></div>
                  <div className="form-group full"><label>Descrição</label><input type="text" placeholder="Ex: Bradesco, R$35/dia..." value={formBen.descricao} onChange={e => setFormBen(f => ({ ...f, descricao: e.target.value }))} /></div>
                </div>
                <button type="submit" className="btn-ghost" style={{ marginTop: 8, fontSize: 12 }}>+ Adicionar benefício</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// PONTO (ADM — todos os CLTs)
// ============================================================
function Ponto() {
  const [colaboradores, setColaboradores] = useState([])
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const hoje = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    supabase.from('colaboradores').select('*').eq('tipo', 'clt').eq('status', 'ativo').order('nome').then(({ data }) => setColaboradores(data || []))
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('pontos').select('*').eq('data', hoje)
    setRegistros(data || [])
    setLoading(false)
  }

  const bater = async (colabId, tipo) => {
    const agora = new Date().toISOString()
    const reg = registros.find(r => r.colaborador_id === colabId)
    if (!reg) {
      await supabase.from('pontos').insert({ colaborador_id: colabId, data: hoje, entrada: agora })
    } else {
      const upd = {}
      if (tipo === 'pausa') upd.inicio_pausa = agora
      else if (tipo === 'retorno') upd.fim_pausa = agora
      else if (tipo === 'saida') {
        upd.saida = agora
        const colab = colaboradores.find(c => c.id === colabId)
        const pausaH = reg.inicio_pausa && reg.fim_pausa ? (new Date(reg.fim_pausa) - new Date(reg.inicio_pausa)) / 3600000 : 0
        const totalH = Math.round(((new Date(agora) - new Date(reg.entrada)) / 3600000 - pausaH) * 100) / 100
        const carga = colab?.carga_horaria_dia || 6
        upd.total_horas = totalH
        upd.banco_horas = Math.round((totalH - carga) * 100) / 100
      }
      await supabase.from('pontos').update(upd).eq('id', reg.id)
    }
    load()
  }

  const fH = (ts) => ts ? format(new Date(ts), 'HH:mm') : '—'

  return (
    <>
      <div className="topbar"><h1 className="page-title" style={{ margin: 0 }}>Ponto — {format(new Date(), "EEEE dd/MM/yyyy", { locale: ptBR })}</h1></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
          : colaboradores.length === 0 ? <div className="empty">Nenhum colaborador CLT ativo</div>
          : (
            <table>
              <thead><tr><th>Colaborador</th><th>Turno</th><th>Entrada</th><th>Pausa</th><th>Retorno</th><th>Saída</th><th>Total</th><th>Banco</th><th>Ação</th></tr></thead>
              <tbody>
                {colaboradores.map(c => {
                  const r = registros.find(x => x.colaborador_id === c.id)
                  return (
                    <tr key={c.id}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar nome={c.nome} size={26} /><span style={{ fontSize: 13, fontWeight: 500 }}>{c.nome}</span></div></td>
                      <td style={{ fontSize: 12, color: 'var(--text3)' }}>{TURNO_LABEL[c.turno] || '—'}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: r?.entrada ? 'var(--green)' : 'var(--text3)' }}>{fH(r?.entrada)}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)' }}>{fH(r?.inicio_pausa)}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text3)' }}>{fH(r?.fim_pausa)}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{fH(r?.saida)}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{r?.total_horas != null ? `${r.total_horas}h` : '—'}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: r?.banco_horas > 0 ? 'var(--green)' : r?.banco_horas < 0 ? 'var(--red)' : 'var(--text3)' }}>
                        {r?.banco_horas != null ? `${r.banco_horas >= 0 ? '+' : ''}${r.banco_horas}h` : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {!r?.entrada && <button className="btn-primary" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => bater(c.id, 'entrada')}>Entrada</button>}
                          {r?.entrada && !r?.inicio_pausa && !r?.saida && <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => bater(c.id, 'pausa')}>Pausa</button>}
                          {r?.inicio_pausa && !r?.fim_pausa && <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => bater(c.id, 'retorno')}>Retorno</button>}
                          {r?.entrada && r?.fim_pausa && !r?.saida && <button className="btn-danger" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => bater(c.id, 'saida')}>Saída</button>}
                          {r?.saida && <span className="badge badge-green">✓</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
      </div>
    </>
  )
}

// ============================================================
// FÉRIAS (ADM)
// ============================================================
function Ferias() {
  const [dados, setDados] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ colaborador_id: '', tipo: 'ferias', data_inicio: '', data_fim: '', observacoes: '' })
  const TIPO_L = { ferias: 'Férias', falta: 'Falta', atestado: 'Atestado', licenca: 'Licença', folga: 'Folga', falta_justificada: 'Falta justif.' }

  useEffect(() => {
    supabase.from('colaboradores').select('id,nome').eq('tipo', 'clt').eq('status', 'ativo').then(({ data }) => setColaboradores(data || []))
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('ferias_rh').select('*, colaboradores(nome)').order('created_at', { ascending: false })
    setDados(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSalvando(true)
    const d1 = new Date(form.data_inicio), d2 = form.data_fim ? new Date(form.data_fim) : d1
    await supabase.from('ferias_rh').insert({ ...form, dias: Math.round((d2 - d1) / 86400000) + 1, status: 'aprovado' })
    setSalvando(false); setMostrarForm(false); load()
  }

  const aprovar = async (id, status) => { await supabase.from('ferias_rh').update({ status }).eq('id', id); load() }

  return (
    <>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Férias e ausências</h1>
        <button className="btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>{mostrarForm ? '← Fechar' : '+ Registrar'}</button>
      </div>
      {mostrarForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group"><label>Colaborador *</label>
                <select value={form.colaborador_id} onChange={e => setForm(f => ({ ...f, colaborador_id: e.target.value }))} required>
                  <option value="">Selecionar...</option>{colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {Object.entries(TIPO_L).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Data início *</label><input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} required /></div>
              <div className="form-group"><label>Data fim</label><input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} /></div>
              <div className="form-group full"><label>Observações</label><input type="text" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar'}</button>
              <button type="button" className="btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
          : dados.length === 0 ? <div className="empty">Nenhum registro</div>
          : (
            <table>
              <thead><tr><th>Colaborador</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Dias</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {dados.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 500 }}>{f.colaboradores?.nome}</td>
                    <td><span className="badge badge-blue">{TIPO_L[f.tipo]}</span></td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{f.data_inicio ? format(parseISO(f.data_inicio), 'dd/MM/yy') : '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{f.data_fim ? format(parseISO(f.data_fim), 'dd/MM/yy') : '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{f.dias || 1}</td>
                    <td><span className={`badge ${f.status === 'aprovado' ? 'badge-green' : f.status === 'recusado' ? 'badge-red' : 'badge-orange'}`}>{f.status}</span></td>
                    <td>
                      {f.status === 'aguardando' && (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn-success" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => aprovar(f.id, 'aprovado')}>Aprovar</button>
                          <button className="btn-danger" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => aprovar(f.id, 'recusado')}>Recusar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </>
  )
}

// ============================================================
// DESEMPENHO (ADM)
// ============================================================
function Desempenho() {
  const [dados, setDados] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const cicloAtual = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`
  const [form, setForm] = useState({ colaborador_id: '', ciclo: cicloAtual, nota_gestor: '', nota_auto: '', pontos_fortes: '', pontos_desenvolvimento: '' })

  useEffect(() => {
    supabase.from('colaboradores').select('id,nome').eq('status', 'ativo').then(({ data }) => setColaboradores(data || []))
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('avaliacoes').select('*, colaboradores(nome)').order('created_at', { ascending: false })
    setDados(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSalvando(true)
    await supabase.from('avaliacoes').insert({ ...form, nota_gestor: parseFloat(form.nota_gestor) || null, nota_auto: parseFloat(form.nota_auto) || null, status: 'concluida' })
    setSalvando(false); setMostrarForm(false); load()
  }

  return (
    <>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Avaliação de desempenho</h1>
        <button className="btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>{mostrarForm ? '← Fechar' : '+ Nova avaliação'}</button>
      </div>
      {mostrarForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group"><label>Colaborador *</label>
                <select value={form.colaborador_id} onChange={e => setForm(f => ({ ...f, colaborador_id: e.target.value }))} required>
                  <option value="">Selecionar...</option>{colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Ciclo</label><input type="text" value={form.ciclo} onChange={e => setForm(f => ({ ...f, ciclo: e.target.value }))} /></div>
              <div className="form-group"><label>Nota gestor (0–10)</label><input type="number" step="0.1" min="0" max="10" value={form.nota_gestor} onChange={e => setForm(f => ({ ...f, nota_gestor: e.target.value }))} /></div>
              <div className="form-group"><label>Autoavaliação (0–10)</label><input type="number" step="0.1" min="0" max="10" value={form.nota_auto} onChange={e => setForm(f => ({ ...f, nota_auto: e.target.value }))} /></div>
              <div className="form-group full"><label>Pontos fortes</label><input type="text" value={form.pontos_fortes} onChange={e => setForm(f => ({ ...f, pontos_fortes: e.target.value }))} /></div>
              <div className="form-group full"><label>Pontos de desenvolvimento</label><input type="text" value={form.pontos_desenvolvimento} onChange={e => setForm(f => ({ ...f, pontos_desenvolvimento: e.target.value }))} /></div>
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
          : dados.length === 0 ? <div className="empty">Nenhuma avaliação</div>
          : (
            <table>
              <thead><tr><th>Colaborador</th><th>Ciclo</th><th>Nota gestor</th><th>Autoaval.</th><th>Pontos fortes</th><th>Desenvolvimento</th><th>Status</th></tr></thead>
              <tbody>
                {dados.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.colaboradores?.nome}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{a.ciclo}</td>
                    <td><span style={{ fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>{a.nota_gestor ?? '—'}</span></td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 13 }}>{a.nota_auto ?? '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{a.pontos_fortes || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{a.pontos_desenvolvimento || '—'}</td>
                    <td><span className={`badge ${a.status === 'concluida' ? 'badge-green' : 'badge-orange'}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </>
  )
}

// ============================================================
// ONBOARDING (ADM)
// ============================================================
function Onboarding() {
  const [dados, setDados] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    supabase.from('colaboradores').select('id,nome').eq('status', 'ativo').then(({ data }) => setColaboradores(data || []))
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('onboarding').select('*, colaboradores(nome)').order('ordem')
    setDados(data || [])
    setLoading(false)
  }

  const criar = async () => {
    if (!criando) return; setSalvando(true)
    await supabase.from('onboarding').insert(ETAPAS.map((etapa, i) => ({ colaborador_id: criando, etapa, ordem: i + 1, status: 'pendente' })))
    setSalvando(false); setCriando(''); load()
  }

  const toggle = async (id, status) => {
    await supabase.from('onboarding').update({ status: status === 'concluido' ? 'pendente' : 'concluido', data_conclusao: status === 'concluido' ? null : format(new Date(), 'yyyy-MM-dd') }).eq('id', id)
    load()
  }

  const colabs = [...new Set(dados.map(d => d.colaborador_id))]

  return (
    <>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Onboarding</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={criando} onChange={e => setCriando(e.target.value)} style={{ fontSize: 12 }}>
            <option value="">Selecionar colaborador...</option>
            {colaboradores.filter(c => !colabs.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {criando && <button className="btn-primary" onClick={criar} disabled={salvando}>{salvando ? '...' : '+ Criar'}</button>}
        </div>
      </div>
      {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
        : colabs.length === 0 ? <div className="card"><div className="empty">Nenhum onboarding em andamento</div></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {colabs.map(cId => {
              const etapas = dados.filter(d => d.colaborador_id === cId)
              const nome = etapas[0]?.colaboradores?.nome
              const pct = Math.round((etapas.filter(e => e.status === 'concluido').length / etapas.length) * 100)
              return (
                <div key={cId} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{nome}</div>
                    <span style={{ fontWeight: 700, color: pct === 100 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--orange)', fontSize: 13 }}>{pct}%</span>
                  </div>
                  <div className="saldo-bar"><div className="saldo-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)' }} /></div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {etapas.map(e => (
                      <div key={e.id} onClick={() => toggle(e.id, e.status)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${e.status === 'concluido' ? 'var(--green)' : 'var(--border2)'}`, background: e.status === 'concluido' ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {e.status === 'concluido' && <span style={{ color: '#0f0f0f', fontSize: 10, fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 12, color: e.status === 'concluido' ? 'var(--text3)' : 'var(--text)', textDecoration: e.status === 'concluido' ? 'line-through' : 'none' }}>{e.etapa}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </>
  )
}

// ============================================================
// RH DO COLABORADOR
// ============================================================
function ColaboradorRH({ profile, aba }) {
  const [colab, setColab] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadColab() }, [profile?.id])

  const loadColab = async () => {
    if (!profile?.id) return
    setLoading(true)
    const { data } = await supabase.from('colaboradores').select('*, setores(nome)').eq('usuario_id', profile.id).single()
    setColab(data)
    setLoading(false)
  }

  if (loading) return <div className="empty"><div className="spinner" style={{ margin: '4rem auto' }} /></div>

  if (!colab) return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Perfil não encontrado</div>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>Peça ao seu gestor para vincular seu perfil de colaborador.</div>
    </div>
  )

  return (
    <div>
      {aba === 'meu_perfil' && <MeuPerfil colab={colab} profile={profile} reloadColab={loadColab} />}
      {aba === 'ponto' && <MeuPonto colab={colab} />}
      {aba === 'desenvolvimento' && <MeuDesenvolvimento colab={colab} />}
      {aba === 'ferias' && <MinhasFerias colab={colab} />}
    </div>
  )
}

function MeuPerfil({ colab, profile, reloadColab }) {
  const [form, setForm] = useState({ telefone: colab.telefone || '', endereco: colab.endereco || '', chave_pix: colab.chave_pix || '', email: colab.email || '', cpf: colab.cpf || '', rg: colab.rg || '', cnpj: colab.cnpj || '' })
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const salvar = async (e) => {
    e.preventDefault(); setSalvando(true)
    const payload = {}
    Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== undefined) payload[k] = v })
    await supabase.from('colaboradores').update(payload).eq('id', colab.id)
    setSalvando(false); setSucesso(true)
    setTimeout(() => setSucesso(false), 2000)
    reloadColab()
  }

  return (
    <>
      <div className="topbar"><h1 className="page-title" style={{ margin: 0 }}>Meu perfil</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <Avatar nome={colab.nome} size={48} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{colab.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{colab.cargo || '—'} · {colab.setores?.nome || '—'}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <span className={`badge ${TIPO_CLS[colab.tipo]}`}>{colab.tipo?.toUpperCase()}</span>
                <span className={`badge ${STATUS_CLS[colab.status]}`}>{STATUS_LABEL[colab.status]}</span>
              </div>
            </div>
          </div>
          {[
            ['Admissão', colab.data_admissao ? format(parseISO(colab.data_admissao), 'dd/MM/yyyy') : '—'],
            ['Aniversário', colab.aniversario ? format(parseISO(colab.aniversario), 'dd/MM') : '—'],
            ['Turno', colab.tipo === 'clt' ? (TURNO_LABEL[colab.turno] || '—') : '—'],
          ].map(([label, valor]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text3)' }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{valor}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Meus dados — editar</div>
          {sucesso && <div style={{ background: 'rgba(62,207,142,.1)', border: '1px solid rgba(62,207,142,.3)', borderRadius: 'var(--radius)', padding: '8px 12px', color: 'var(--green)', fontSize: 13, marginBottom: 12 }}>✓ Salvo!</div>}
          <form onSubmit={salvar}>
            <div className="form-grid">
              <div className="form-group"><label>CPF</label><input type="text" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} /></div>
              <div className="form-group"><label>RG</label><input type="text" value={form.rg} onChange={e => setForm(f => ({ ...f, rg: e.target.value }))} /></div>
              {colab.tipo === 'pj' && <div className="form-group full"><label>CNPJ</label><input type="text" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} /></div>}
              <div className="form-group"><label>E-mail</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-group"><label>Telefone</label><input type="text" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
              <div className="form-group"><label>Chave PIX</label><input type="text" value={form.chave_pix} onChange={e => setForm(f => ({ ...f, chave_pix: e.target.value }))} /></div>
              <div className="form-group full"><label>Endereço</label><input type="text" value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} /></div>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 12 }} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
          </form>
        </div>
      </div>
    </>
  )
}

function MeuPonto({ colab }) {
  const [reg, setReg] = useState(null)
  const [loading, setLoading] = useState(true)
  const hoje = format(new Date(), 'yyyy-MM-dd')
  const [hora, setHora] = useState(new Date().toLocaleTimeString('pt-BR'))

  useEffect(() => {
    load()
    const t = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    return () => clearInterval(t)
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('pontos').select('*').eq('colaborador_id', colab.id).eq('data', hoje).single().catch(() => ({ data: null }))
    setReg(data)
    setLoading(false)
  }

  const bater = async (tipo) => {
    const agora = new Date().toISOString()
    if (!reg) {
      await supabase.from('pontos').insert({ colaborador_id: colab.id, data: hoje, entrada: agora })
    } else {
      const upd = {}
      if (tipo === 'pausa') upd.inicio_pausa = agora
      else if (tipo === 'retorno') upd.fim_pausa = agora
      else if (tipo === 'saida') {
        upd.saida = agora
        const pausaH = reg.inicio_pausa && reg.fim_pausa ? (new Date(reg.fim_pausa) - new Date(reg.inicio_pausa)) / 3600000 : 0
        const totalH = Math.round(((new Date(agora) - new Date(reg.entrada)) / 3600000 - pausaH) * 100) / 100
        const carga = colab.carga_horaria_dia || 6
        upd.total_horas = totalH
        upd.banco_horas = Math.round((totalH - carga) * 100) / 100
      }
      await supabase.from('pontos').update(upd).eq('id', reg.id)
    }
    load()
  }

  const fH = (ts) => ts ? format(new Date(ts), 'HH:mm') : '—'
  const carga = colab.carga_horaria_dia || 6
  const horasFeitas = reg?.entrada && !reg?.saida ? Math.max(0, (new Date() - new Date(reg.entrada)) / 3600000 - (reg.inicio_pausa && reg.fim_pausa ? (new Date(reg.fim_pausa) - new Date(reg.inicio_pausa)) / 3600000 : 0)) : reg?.total_horas || 0
  const pct = Math.min((horasFeitas / carga) * 100, 100)

  return (
    <>
      <div className="topbar"><h1 className="page-title" style={{ margin: 0 }}>Meu ponto</h1></div>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</div>
          <div style={{ fontSize: 48, fontWeight: 500, fontFamily: 'DM Mono', letterSpacing: 2, color: 'var(--text)', margin: '1rem 0' }}>{hora}</div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
            <span>Entrada: <b style={{ color: 'var(--text)' }}>{fH(reg?.entrada)}</b></span>
            <span>Pausa: <b style={{ color: 'var(--text)' }}>{fH(reg?.inicio_pausa)}</b></span>
            <span>Saída: <b style={{ color: 'var(--text)' }}>{fH(reg?.saida)}</b></span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{horasFeitas.toFixed(1)}h de {carga}h</div>
          <div className="saldo-bar" style={{ height: 8, marginBottom: 16 }}><div className="saldo-fill" style={{ width: `${pct}%`, height: 8, background: pct >= 100 ? 'var(--green)' : 'var(--accent)' }} /></div>
          {!reg?.entrada && <button className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 15, marginBottom: 8 }} onClick={() => bater('entrada')}>Registrar entrada</button>}
          {reg?.entrada && !reg?.inicio_pausa && !reg?.saida && <button className="btn-ghost" style={{ width: '100%', padding: '10px', fontSize: 14, marginBottom: 8 }} onClick={() => bater('pausa')}>Iniciar pausa</button>}
          {reg?.inicio_pausa && !reg?.fim_pausa && <button className="btn-ghost" style={{ width: '100%', padding: '10px', fontSize: 14, marginBottom: 8 }} onClick={() => bater('retorno')}>Retornar da pausa</button>}
          {reg?.entrada && reg?.fim_pausa && !reg?.saida && <button className="btn-danger" style={{ width: '100%', padding: '10px', fontSize: 14, marginBottom: 8 }} onClick={() => bater('saida')}>Registrar saída</button>}
          {reg?.saida && <div style={{ background: 'rgba(62,207,142,.1)', border: '1px solid rgba(62,207,142,.3)', borderRadius: 'var(--radius)', padding: '12px', color: 'var(--green)', fontWeight: 500 }}>✓ Jornada concluída — {reg.total_horas}h</div>}
          {reg?.banco_horas != null && <div style={{ fontSize: 12, color: reg.banco_horas >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 8 }}>Banco de horas: {reg.banco_horas >= 0 ? '+' : ''}{reg.banco_horas}h</div>}
        </div>
      </div>
    </>
  )
}

function MinhasFerias({ colab }) {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ tipo: 'ferias', data_inicio: '', data_fim: '', observacoes: '' })
  const TIPO_L = { ferias: 'Férias', falta: 'Falta', atestado: 'Atestado', licenca: 'Licença', folga: 'Folga', falta_justificada: 'Falta justif.' }

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('ferias_rh').select('*').eq('colaborador_id', colab.id).order('created_at', { ascending: false })
    setDados(data || [])
    setLoading(false)
  }
  const handleSubmit = async (e) => {
    e.preventDefault(); setSalvando(true)
    const d1 = new Date(form.data_inicio), d2 = form.data_fim ? new Date(form.data_fim) : d1
    await supabase.from('ferias_rh').insert({ ...form, colaborador_id: colab.id, dias: Math.round((d2 - d1) / 86400000) + 1, status: 'aguardando' })
    setSalvando(false); setMostrarForm(false); load()
  }

  return (
    <>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Férias e ausências</h1>
        <button className="btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>{mostrarForm ? '← Fechar' : '+ Solicitar'}</button>
      </div>
      {mostrarForm && (
        <div className="card" style={{ marginBottom: 12 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group"><label>Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {Object.entries(TIPO_L).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Data início *</label><input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} required /></div>
              <div className="form-group"><label>Data fim</label><input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} /></div>
              <div className="form-group"><label>Observações</label><input type="text" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Enviando...' : 'Enviar solicitação'}</button>
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
              <thead><tr><th>Tipo</th><th>Início</th><th>Fim</th><th>Dias</th><th>Status</th></tr></thead>
              <tbody>
                {dados.map(f => (
                  <tr key={f.id}>
                    <td><span className="badge badge-blue">{TIPO_L[f.tipo]}</span></td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{f.data_inicio ? format(parseISO(f.data_inicio), 'dd/MM/yy') : '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{f.data_fim ? format(parseISO(f.data_fim), 'dd/MM/yy') : '—'}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{f.dias || 1}</td>
                    <td><span className={`badge ${f.status === 'aprovado' ? 'badge-green' : f.status === 'recusado' ? 'badge-red' : 'badge-orange'}`}>{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </>
  )
}

function MeuDesenvolvimento({ colab }) {
  const [avaliacoes, setAvaliacoes] = useState([])
  const [etapas, setEtapas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  const load = async () => {
    setLoading(true)
    const [{ data: aval }, { data: etap }] = await Promise.all([
      supabase.from('avaliacoes').select('*').eq('colaborador_id', colab.id).order('created_at', { ascending: false }),
      supabase.from('onboarding').select('*').eq('colaborador_id', colab.id).order('ordem'),
    ])
    setAvaliacoes(aval || [])
    setEtapas(etap || [])
    setLoading(false)
  }

  if (loading) return <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>

  const pct = etapas.length ? Math.round((etapas.filter(e => e.status === 'concluido').length / etapas.length) * 100) : 0

  return (
    <>
      <div className="topbar"><h1 className="page-title" style={{ margin: 0 }}>Meu desenvolvimento</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Onboarding */}
        {etapas.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Onboarding</div>
              <span style={{ fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--accent)', fontSize: 13 }}>{pct}%</span>
            </div>
            <div className="saldo-bar"><div className="saldo-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)' }} /></div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {etapas.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${e.status === 'concluido' ? 'var(--green)' : 'var(--border2)'}`, background: e.status === 'concluido' ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {e.status === 'concluido' && <span style={{ color: '#0f0f0f', fontSize: 10, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 12, color: e.status === 'concluido' ? 'var(--text3)' : 'var(--text)', textDecoration: e.status === 'concluido' ? 'line-through' : 'none' }}>{e.etapa}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avaliações */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Minhas avaliações</div>
          {avaliacoes.length === 0 ? <div className="empty" style={{ padding: '1rem' }}>Nenhuma avaliação ainda</div> : avaliacoes.map(a => (
            <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{a.ciclo}</span>
                <span style={{ fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>{a.nota_gestor ?? '—'}</span>
              </div>
              {a.pontos_fortes && <div style={{ fontSize: 12, color: 'var(--text3)' }}>✓ {a.pontos_fortes}</div>}
              {a.pontos_desenvolvimento && <div style={{ fontSize: 12, color: 'var(--text3)' }}>→ {a.pontos_desenvolvimento}</div>}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
