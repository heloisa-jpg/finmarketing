import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const PERFIS = ['ceo', 'adm', 'financeiro', 'colaborador']
const PERFIL_CLS = { ceo: 'badge-pink', adm: 'badge-blue', financeiro: 'badge-green', colaborador: 'badge-orange' }
const PERFIL_LABEL = { ceo: 'CEO', adm: 'ADM', financeiro: 'Financeiro', colaborador: 'Colaborador' }

export default function Usuarios() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('nome')
    setDados(data || [])
    setLoading(false)
  }

  const atualizarPerfil = async (id, perfil) => {
    setSalvando(id)
    await supabase.from('profiles').update({ perfil }).eq('id', id)
    setSalvando(null)
    load()
  }

  const toggleAtivo = async (id, ativo) => {
    setSalvando(id)
    await supabase.from('profiles').update({ ativo: !ativo }).eq('id', id)
    setSalvando(null)
    load()
  }

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title" style={{ margin: 0 }}>Usuários</h1>
      </div>

      <div className="card" style={{ marginBottom: 12, background: 'rgba(200,241,53,.04)', borderColor: 'rgba(200,241,53,.15)' }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent)' }}>Permissões:</strong> CEO, ADM e Financeiro têm acesso total ao sistema.
          Colaborador só vê os próprios lançamentos, pode pedir reembolso e subir NF.
          Novos usuários são criados como Colaborador automaticamente — você muda o perfil aqui.
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="empty"><div className="spinner" style={{ margin: '2rem auto' }} /></div>
          : dados.length === 0 ? <div className="empty">Nenhum usuário</div>
          : (
            <table>
              <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {dados.map(u => (
                  <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.5 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--accent)', color: '#0f0f0f',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                          {u.nome?.charAt(0) || '?'}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{u.nome}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{u.email}</td>
                    <td>
                      <select
                        value={u.perfil}
                        onChange={e => atualizarPerfil(u.id, e.target.value)}
                        disabled={salvando === u.id}
                        style={{
                          width: 'auto', fontSize: 12, padding: '4px 8px',
                          background: 'var(--bg3)', border: '1px solid var(--border2)',
                          borderRadius: 'var(--radius)', color: 'var(--text)',
                        }}
                      >
                        {PERFIS.map(p => <option key={p} value={p}>{PERFIL_LABEL[p]}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.ativo ? 'badge-green' : 'badge-red'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={u.ativo ? 'btn-danger' : 'btn-success'}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                        onClick={() => toggleAtivo(u.id, u.ativo)}
                        disabled={salvando === u.id}
                      >
                        {salvando === u.id ? '...' : u.ativo ? 'Desativar' : 'Reativar'}
                      </button>
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
