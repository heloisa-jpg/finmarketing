import React, { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [modo, setModo] = useState('login')
  const [nome, setNome] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setLoading(false)
  }

  const handleCadastro = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error) { setErro(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        nome,
        email,
        perfil: 'colaborador',
      })
    }
    setErro('Conta criada! Faça login.')
    setModo('login')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '-1px',
          }}>
            FinMarketing
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
            Grupo APF — Controle de despesas
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text)' }}>
            {modo === 'login' ? 'Entrar na conta' : 'Criar conta'}
          </h2>

          <form onSubmit={modo === 'login' ? handleLogin : handleCadastro}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modo === 'cadastro' && (
                <div className="form-group">
                  <label>Nome completo</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  placeholder="email@grupoapf.com.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
              </div>

              {erro && (
                <div style={{
                  fontSize: 12,
                  color: erro.includes('criada') ? 'var(--green)' : 'var(--red)',
                  background: erro.includes('criada') ? 'rgba(62,207,142,.08)' : 'rgba(255,85,85,.08)',
                  border: `1px solid ${erro.includes('criada') ? 'rgba(62,207,142,.2)' : 'rgba(255,85,85,.2)'}`,
                  borderRadius: 'var(--radius)',
                  padding: '8px 12px',
                }}>
                  {erro}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ marginTop: 4, width: '100%' }}
              >
                {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setErro('') }}
              style={{ background: 'transparent', color: 'var(--text3)', fontSize: 12 }}
            >
              {modo === 'login' ? 'Não tem conta? Criar agora' : 'Já tenho conta'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: 11, color: 'var(--text3)' }}>
          Acesso restrito — somente equipe Grupo APF
        </div>
      </div>
    </div>
  )
}
