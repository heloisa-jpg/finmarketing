-- ============================================================
-- FINMARKETING — Script de criação do banco (Supabase)
-- Cole este SQL no Supabase > SQL Editor > New Query > Run
-- ============================================================

-- Perfis de usuário (vinculados ao auth do Supabase)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  email text not null,
  perfil text not null check (perfil in ('ceo','adm','financeiro','colaborador')),
  ativo boolean default true,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Usuário vê o próprio perfil" on profiles for select using (auth.uid() = id);
create policy "ADM vê todos" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and perfil in ('ceo','adm','financeiro'))
);
create policy "ADM atualiza todos" on profiles for all using (
  exists (select 1 from profiles where id = auth.uid() and perfil in ('ceo','adm','financeiro'))
);

-- Categorias de gasto
create table categorias (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  cor text default '#378ADD',
  created_at timestamptz default now()
);
insert into categorias (nome, cor) values
  ('Ferramenta', '#534AB7'),
  ('Transporte', '#378ADD'),
  ('Alimentação', '#1D9E75'),
  ('Compras', '#EF9F27'),
  ('Viagem', '#D4537E'),
  ('Outros', '#888780');

-- Centros de custo / setores
create table setores (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  created_at timestamptz default now()
);
insert into setores (nome) values ('Marketing'), ('Operação'), ('Escritório');

-- Cartões corporativos
create table cartoes (
  id uuid default gen_random_uuid() primary key,
  final text not null,
  setor_id uuid references setores,
  responsavel text,
  ativo boolean default true,
  created_at timestamptz default now()
);
insert into cartoes (final, responsavel) values ('2271', 'Marketing'), ('9968', 'Operação'), ('3275', 'Marketing');

-- Lançamentos de despesas
create table lancamentos (
  id uuid default gen_random_uuid() primary key,
  data date not null,
  descricao text not null,
  valor numeric(10,2) not null,
  categoria_id uuid references categorias,
  setor_id uuid references setores,
  cartao_id uuid references cartoes,
  metodo text,
  observacoes text,
  nf_url text,
  tem_nf boolean default false,
  usuario_id uuid references profiles,
  created_at timestamptz default now()
);
alter table lancamentos enable row level security;
create policy "ADM vê tudo" on lancamentos for all using (
  exists (select 1 from profiles where id = auth.uid() and perfil in ('ceo','adm','financeiro'))
);
create policy "Colaborador vê os próprios" on lancamentos for select using (usuario_id = auth.uid());
create policy "Colaborador insere" on lancamentos for insert with check (usuario_id = auth.uid());

-- Adiantamentos
create table adiantamentos (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references profiles,
  valor_total numeric(10,2) not null,
  valor_gasto numeric(10,2) default 0,
  setor_id uuid references setores,
  prazo date,
  observacoes text,
  status text default 'aberto' check (status in ('aberto','encerrado','estourado')),
  created_at timestamptz default now()
);
alter table adiantamentos enable row level security;
create policy "ADM vê tudo" on adiantamentos for all using (
  exists (select 1 from profiles where id = auth.uid() and perfil in ('ceo','adm','financeiro'))
);

-- Pessoas (freela, PJ, recorrente)
create table pessoas (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  tipo text not null check (tipo in ('freela','pj','recorrente')),
  documento text,
  servico text,
  chave_pix text,
  valor_fixo numeric(10,2),
  passagem numeric(10,2),
  aprovador text default 'ceo',
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Solicitações de pagamento
create table solicitacoes (
  id uuid default gen_random_uuid() primary key,
  pessoa_id uuid references pessoas,
  descricao text not null,
  valor numeric(10,2) not null,
  vencimento date,
  nf_url text,
  tem_nf boolean default false,
  status text default 'pendente' check (status in ('pendente','aguardando_ceo','aprovado','a_pagar','pago','recusado')),
  observacoes text,
  criado_por uuid references profiles,
  created_at timestamptz default now()
);
alter table solicitacoes enable row level security;
create policy "ADM vê tudo" on solicitacoes for all using (
  exists (select 1 from profiles where id = auth.uid() and perfil in ('ceo','adm','financeiro'))
);

-- Reembolsos
create table reembolsos (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references profiles,
  descricao text not null,
  valor numeric(10,2) not null,
  categoria_id uuid references categorias,
  nf_url text,
  tem_nf boolean default false,
  status text default 'aguardando' check (status in ('aguardando','aprovado','recusado','pago')),
  tipo text default 'manual' check (tipo in ('manual','auto_adiantamento')),
  adiantamento_id uuid references adiantamentos,
  observacoes text,
  created_at timestamptz default now()
);
alter table reembolsos enable row level security;
create policy "ADM vê tudo" on reembolsos for all using (
  exists (select 1 from profiles where id = auth.uid() and perfil in ('ceo','adm','financeiro'))
);
create policy "Colaborador vê os próprios" on reembolsos for select using (usuario_id = auth.uid());
create policy "Colaborador insere" on reembolsos for insert with check (usuario_id = auth.uid());

-- Storage bucket para NFs
insert into storage.buckets (id, name, public) values ('nfs', 'nfs', false);
create policy "Upload autenticado" on storage.objects for insert with check (auth.role() = 'authenticated');
create policy "Leitura autenticada" on storage.objects for select using (auth.role() = 'authenticated');
