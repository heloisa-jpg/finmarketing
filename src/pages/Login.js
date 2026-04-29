import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [modo, setModo] = useState('login') // login | cadastro | recuperar | nova_senha
  const [nome, setNome] = useState('')

  useEffect(() => {
    // Detectar se veio do link de recuperação de senha
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      setModo('nova_senha')
    }
    // Detectar token de recuperação nos parâmetros
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setModo('nova_senha')
      }
    })
  }, [])

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
      await supabase.from('profiles').insert({ id: data.user.id, nome, email, perfil: 'colaborador' })
    }
    setErro('Conta criada! Faça login.')
    setModo('login')
    setLoading(false)
  }

  const handleRecuperar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) setErro('Erro ao enviar e-mail. Verifique o endereço.')
    else setErro('E-mail enviado! Verifique sua caixa de entrada.')
    setLoading(false)
  }

  const handleNovaSenha = async (e) => {
    e.preventDefault()
    if (novaSenha !== confirmarSenha) { setErro('As senhas não conferem.'); return }
    if (novaSenha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) setErro('Erro ao atualizar senha. Tente novamente.')
    else {
      setErro('Senha atualizada com sucesso!')
      setTimeout(() => { setModo('login'); setNovaSenha(''); setConfirmarSenha('') }, 2000)
    }
    setLoading(false)
  }

  const TITULOS = {
    login: 'Entrar na conta',
    cadastro: 'Criar conta',
    recuperar: 'Recuperar senha',
    nova_senha: 'Criar nova senha',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-1px' }}>
            Central APF
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text)' }}>
            {TITULOS[modo]}
          </h2>

          {/* LOGIN */}
          {modo === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="form-group">
                  <label>E-mail</label>
                  <input type="email" placeholder="email@grupoapf.com.br" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Senha</label>
                  <input type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required />
                </div>
                <div style={{ textAlign: 'right', marginTop: -4 }}>
                  <button type="button" onClick={() => { setModo('recuperar'); setErro('') }}
                    style={{ background: 'transparent', color: 'var(--text3)', fontSize: 12, border: 'none', cursor: 'pointer' }}>
                    Esqueci minha senha
                  </button>
                </div>
                {erro && <MensagemErro texto={erro} />}
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, width: '100%' }}>
                  {loading ? 'Aguarde...' : 'Entrar'}
                </button>
              </div>
            </form>
          )}

          {/* CADASTRO */}
          {modo === 'cadastro' && (
            <form onSubmit={handleCadastro}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="form-group">
                  <label>Nome completo</label>
                  <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input type="email" placeholder="email@grupoapf.com.br" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Senha</label>
                  <input type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={e => setSenha(e.target.value)} required />
                </div>
                {erro && <MensagemErro texto={erro} />}
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, width: '100%' }}>
                  {loading ? 'Aguarde...' : 'Criar conta'}
                </button>
              </div>
            </form>
          )}

          {/* RECUPERAR SENHA */}
          {modo === 'recuperar' && (
            <form onSubmit={handleRecuperar}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                  Digite seu e-mail e enviaremos um link para você criar uma nova senha.
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input type="email" placeholder="email@grupoapf.com.br" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                {erro && <MensagemErro texto={erro} />}
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, width: '100%' }}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </div>
            </form>
          )}

          {/* NOVA SENHA */}
          {modo === 'nova_senha' && (
            <form onSubmit={handleNovaSenha}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                  Digite sua nova senha abaixo.
                </div>
                <div className="form-group">
                  <label>Nova senha</label>
                  <input type="password" placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Confirmar senha</label>
                  <input type="password" placeholder="Repita a senha" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} required />
                </div>
                {erro && <MensagemErro texto={erro} />}
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4, width: '100%' }}>
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </div>
            </form>
          )}

          {/* Links de navegação */}
          <div style={{ textAlign: 'center', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {modo !== 'login' && modo !== 'nova_senha' && (
              <button onClick={() => { setModo('login'); setErro('') }}
                style={{ background: 'transparent', color: 'var(--text3)', fontSize: 12, border: 'none', cursor: 'pointer' }}>
                ← Voltar para o login
              </button>
            )}
            {modo === 'login' && (
              <button onClick={() => { setModo('cadastro'); setErro('') }}
                style={{ background: 'transparent', color: 'var(--text3)', fontSize: 12, border: 'none', cursor: 'pointer' }}>
                Não tem conta? Criar agora
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: 11, color: 'var(--text3)' }}>
          Acesso restrito — somente equipe Grupo APF
        </div>
      </div>
    </div>
  )
}

function MensagemErro({ texto }) {
  const ok = texto.includes('criada') || texto.includes('enviado') || texto.includes('sucesso')
  return (
    <div style={{
      fontSize: 12,
      color: ok ? 'var(--green)' : 'var(--red)',
      background: ok ? 'rgba(62,207,142,.08)' : 'rgba(255,85,85,.08)',
      border: '1px solid ' + (ok ? 'rgba(62,207,142,.2)' : 'rgba(255,85,85,.2)'),
      borderRadius: 'var(--radius)', padding: '8px 12px',
    }}>
      {texto}
    </div>
  )
}
