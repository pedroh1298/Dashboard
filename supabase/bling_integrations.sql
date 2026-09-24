create table if not exists public.bling_integrations (
  owner_id text primary key,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text not null,
  expires_in integer not null check (expires_in >= 0),
  token_type text not null default 'Bearer',
  scope text,
  expires_at bigint not null check (expires_at > 0),
  connected_at bigint not null check (connected_at > 0),
  updated_at bigint not null check (updated_at > 0),
  status text not null default 'active'
    check (status in ('active', 'disconnected', 'expired'))
);

alter table public.bling_integrations enable row level security;

revoke all on table public.bling_integrations from public, anon, authenticated;
grant select, insert, update, delete on table public.bling_integrations to service_role;

comment on table public.bling_integrations is
  'Tokens OAuth do Bling criptografados pela aplicação; acesso exclusivo do backend.';