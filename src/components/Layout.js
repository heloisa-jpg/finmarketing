import React, { useState } from 'react'
import { useAuth } from '../App'
import { supabase } from '../supabase'

const NAV = [
  { key: 'dashboard', label: 'Painel', icon: '◼', group: 'financeiro' },
  { key: 'lancamentos', label: 'Despesas', icon: '≡', group: 'financeiro' },
  { key: 'novo_lancamento', label: 'Lançar gasto', icon: '+', group: 'financeiro' },
  { key: 'reembolsos', label: 'Reembolsos', icon: '↩', group: 'financeiro' },
  { key: 'solicitacoes', label: 'Pagamentos', icon: '◎', group: 'financeiro', adminOnly: true },
  { key: 'pessoas', label: 'Pessoas', icon: '⊙', group: 'financeiro', adminOnly: true },
  { key: 'adiantamentos', label: 'Adiantamentos', icon: '◈', group: 'financeiro', adminOnly: true },
  { key: 'cartoes', label: 'Cartões', icon: '▣', group: 'financeiro', adminOnly: true },
  { key: 'relatorio', label: 'Relatórios', icon: '▦', group: 'financeiro', adminOnly: true },
  { key: 'rh', label: 'Recursos Humanos', icon: '⊙', group: 'rh', adminOnly: true },
  { key: 'usuarios', label: 'Usuários', icon: '⊕', group: 'config', adminOnly: true },
]

const GROUPS = {
  financeiro: 'Financeiro',
  rh: 'RH',
  config: 'Configurações',
}

export default function Layout({ children, page, setPage }) {
  const { profile, isAdmin } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const visibleNav = NAV.filter(n => !n.adminOnly || isAdmin)
  const groups = [...new Set(visibleNav.map(n => n.group))]

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: collapsed ? 56 : 210,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .2s',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: collapsed ? '1.25rem .875rem' : '1.25rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)', letterSpacing: '-.3px' }}>
                Central APF
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Grupo APF</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'transparent', color: 'var(--text3)', fontSize: 16, padding: 4, lineHeight: 1, flexShrink: 0 }}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
          {groups.map(group => (
            <div key={group}>
              {!collapsed && (
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '10px 1.25rem 4px' }}>
                  {GROUPS[group]}
                </div>
              )}
              {visibleNav.filter(n => n.group === group).map(n => (
                <button
                  key={n.key}
                  onClick={() => setPage(n.key)}
                  title={collapsed ? n.label : ''}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: collapsed ? '9px 0' : '8px 1.25rem',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: page === n.key ? 'rgba(255,199,0,.08)' : 'transparent',
                    color: page === n.key ? 'var(--accent)' : 'var(--text2)',
                    borderLeft: page === n.key ? '2px solid var(--accent)' : '2px solid transparent',
                    fontSize: 13,
                    fontWeight: page === n.key ? 500 : 400,
                    transition: 'all .1s',
                  }}
                  onMouseEnter={e => { if (page !== n.key) e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { if (page !== n.key) e.currentTarget.style.color = 'var(--text2)' }}
                >
                  <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{n.icon}</span>
                  {!collapsed && <span>{n.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div style={{
          padding: collapsed ? '.75rem .5rem' : '.75rem 1.25rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {profile?.nome?.charAt(0) || '?'}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.nome || 'Usuário'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize' }}>{profile?.perfil}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} title="Sair" style={{ background: 'transparent', color: 'var(--text3)', fontSize: 14, padding: 2 }}>⏻</button>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
