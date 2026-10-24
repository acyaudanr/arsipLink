-- ARSIP: Excel archive schema
-- Sudah diterapkan ke project Supabase "arsip" (inihperbuyixywinoxzq) via MCP.
-- File ini disimpan sebagai dokumentasi / untuk setup ulang.
--
-- Cara jadi Admin pertama:
--   1. Daftar akun lewat halaman /login di website
--   2. Jalankan di SQL Editor Supabase:
--      update public.profiles set role = 'admin' where email = 'email-kamu@contoh.com';

create type public.user_role as enum ('admin','viewer');
create type public.source_type as enum ('upload','drive');
create type public.doc_status as enum ('processing','ready','error');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create table public.excel_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_name text,
  source_type public.source_type not null,
  drive_file_id text,
  drive_url text,
  drive_modified_time timestamptz,
  file_size bigint,
  status public.doc_status not null default 'processing',
  error_message text,
  sheet_count int not null default 0,
  total_rows int not null default 0,
  uploaded_by uuid references public.profiles(id) on delete set null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sheets (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.excel_documents(id) on delete cascade,
  sheet_name text not null,
  sheet_index int not null,
  row_count int not null default 0,
  column_count int not null default 0,
  headers jsonb not null default '[]'::jsonb,
  merges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(document_id, sheet_index)
);

create table public.sheet_rows (
  id bigint generated always as identity primary key,
  sheet_id uuid not null references public.sheets(id) on delete cascade,
  row_index int not null,
  data jsonb not null default '{}'::jsonb,
  search_text text not null default ''
);

create index sheet_rows_sheet_row_idx on public.sheet_rows(sheet_id, row_index);
create index sheet_rows_search_idx on public.sheet_rows using gin (to_tsvector('simple', search_text));
create index sheets_document_idx on public.sheets(document_id, sheet_index);
create index excel_documents_created_idx on public.excel_documents(created_at desc);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles(id, email, role) values (new.id, coalesce(new.email,''), 'viewer') on conflict (id) do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger excel_documents_touch before update on public.excel_documents for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.excel_documents enable row level security;
alter table public.sheets enable row level security;
alter table public.sheet_rows enable row level security;

create policy "profiles_select" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_update_admin" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "documents_select" on public.excel_documents for select to authenticated using (true);
create policy "documents_insert_admin" on public.excel_documents for insert to authenticated with check (public.is_admin());
create policy "documents_update_admin" on public.excel_documents for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "documents_delete_admin" on public.excel_documents for delete to authenticated using (public.is_admin());

create policy "sheets_select" on public.sheets for select to authenticated using (true);
create policy "sheets_insert_admin" on public.sheets for insert to authenticated with check (public.is_admin());
create policy "sheets_update_admin" on public.sheets for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "sheets_delete_admin" on public.sheets for delete to authenticated using (public.is_admin());

create policy "rows_select" on public.sheet_rows for select to authenticated using (true);
create policy "rows_insert_admin" on public.sheet_rows for insert to authenticated with check (public.is_admin());
create policy "rows_update_admin" on public.sheet_rows for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "rows_delete_admin" on public.sheet_rows for delete to authenticated using (public.is_admin());
