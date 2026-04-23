# ================================================
# FINMARKETING — GRUPO APF
# Guia completo de instalação (sem precisar de dev)
# ================================================

## O QUE VOCÊ PRECISA (tudo gratuito)
- Conta no GitHub: https://github.com
- Conta no Supabase: https://supabase.com
- Conta na Vercel: https://vercel.com

Tempo estimado: 30–40 minutos

---

## PASSO 1 — Criar projeto no Supabase

1. Acesse https://supabase.com e clique em "Start your project"
2. Faça login com o Google
3. Clique em "New project"
4. Preencha:
   - Nome: finmarketing
   - Senha do banco: escolha uma senha forte (guarde!)
   - Região: South America (São Paulo)
5. Aguarde criar (1-2 minutos)

---

## PASSO 2 — Criar as tabelas

1. No painel do Supabase, clique em "SQL Editor" no menu lateral
2. Clique em "New query"
3. Abra o arquivo `supabase_schema.sql` deste projeto
4. Copie TODO o conteúdo e cole no editor
5. Clique em "Run" (botão verde)
6. Aguarde — deve mostrar "Success" em verde

---

## PASSO 3 — Pegar as chaves do Supabase

1. No menu lateral do Supabase, clique em "Project Settings" (ícone de engrenagem)
2. Clique em "API"
3. Copie dois valores:
   - **Project URL** (parece com: https://xyzxyz.supabase.co)
   - **anon public** (chave longa que começa com "eyJ...")

---

## PASSO 4 — Subir o código no GitHub

1. Acesse https://github.com e faça login (ou crie conta)
2. Clique em "+" > "New repository"
3. Nome: finmarketing
4. Clique em "Create repository"
5. Clique em "uploading an existing file"
6. Arraste a pasta inteira do projeto para o campo
7. Clique em "Commit changes"

---

## PASSO 5 — Criar o arquivo de configuração

1. No seu repositório GitHub, clique em "Add file" > "Create new file"
2. Nome do arquivo: `.env`
3. Conteúdo (substitua pelos seus valores do Passo 3):

```
REACT_APP_SUPABASE_URL=https://SEU_PROJETO.supabase.co
REACT_APP_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI
```

4. Clique em "Commit new file"

---

## PASSO 6 — Hospedar na Vercel (gratuito)

1. Acesse https://vercel.com e clique em "Sign up"
2. Faça login com o GitHub (recomendado)
3. Clique em "Add New Project"
4. Selecione o repositório "finmarketing"
5. Em "Environment Variables", adicione:
   - `REACT_APP_SUPABASE_URL` = sua URL do Supabase
   - `REACT_APP_SUPABASE_ANON_KEY` = sua chave anon
6. Clique em "Deploy"
7. Aguarde 2-3 minutos

Pronto! A Vercel vai te dar um link como: https://finmarketing.vercel.app

---

## PASSO 7 — Criar o primeiro usuário (ADM)

1. Acesse o link do seu app
2. Clique em "Criar conta"
3. Preencha seu nome, e-mail e senha
4. Após criar, vá no Supabase > Table Editor > profiles
5. Encontre seu usuário e mude o campo "perfil" de "colaborador" para "adm"
6. Salve — agora você tem acesso total!

---

## FUNCIONALIDADES DO APP

✅ Login com e-mail e senha
✅ Painel com totais por mês
✅ Lançar gastos com categoria, setor e cartão
✅ Upload de nota fiscal
✅ Filtros por mês, categoria, setor, NF
✅ Reembolsos (solicitar, aprovar, marcar pago)
✅ Adiantamentos com controle de saldo
✅ Cartões corporativos
✅ Solicitações de pagamento (freela, PJ, recorrente — Sônia)
✅ Cadastro de pessoas com chave PIX
✅ Relatórios por categoria e setor
✅ Controle de usuários e perfis (CEO/ADM/Financeiro = tudo / Colaborador = restrito)

---

## DÚVIDAS?

Se travar em algum passo, anote exatamente onde travou e pergunte para o Claude — 
ele consegue te ajudar a resolver qualquer etapa com instruções mais detalhadas.
