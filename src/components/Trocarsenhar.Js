import React, { useState } from 'react'
import { supabase } from '../supabase'

export default function TrocarSenha({ onFechar }) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (novaSenha !== confirmar) { setMsg('erro:As senhas não conferem.'); return }
    if (novaSenha.length < 6) { setMsg('erro:Mínimo 6 caracteres.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setLoading(false)
    if (error) setMsg('erro:Erro ao atualizar. Tente novamente.')
    else { setMsg('ok:Senha alterada com sucesso!'); setTimeout(() => onFechar && onFechar(), 2000) }
  }

  const isErro = msg.startsWith('erro:')
  const texto = msg.replace(/^(erro:|ok:)/, '')

  return (
    <div className="card">
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: '1rem' }}>Trocar senha</div>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group full">
            <label>Nova senha</label>
            <input type="password" placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required />
          </div>
          <div className="form-group full">
            <label>Confirmar nova senha</label>
            <input type="password" placeholder="Repita a nova senha" value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
          </div>
        </div>
        {msg && (
          <div style={{
            fontSize: 12, marginTop: 10,
            color: isErro ? 'var(--red)' : 'var(--green)',
            background: isErro ? 'rgba(255,85,85,.08)' : 'rgba(62,207,142,.08)',
            border: '1px solid ' + (isErro ? 'rgba(255,85,85,.2)' : 'rgba(62,207,142,.2)'),
            borderRadius: 'var(--radius)', padding: '8px 12px',
          }}>{texto}</div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar nova senha'}</button>
          {onFechar && <button type="button" className="btn-ghost" onClick={onFechar}>Cancelar</button>}
        </div>
      </form>
    </div>
  )
}
