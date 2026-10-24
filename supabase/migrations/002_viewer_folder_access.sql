-- Viewer folder access + admin create viewer
-- Applied to project via MCP as viewer_folder_access

create table public.folder_access (
  user_id uuid not null references public.profiles(id) on delete cascade,
  folder_id uuid not null references public.drive_folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, folder_id)
);

create index folder_access_folder_idx on public.folder_access(folder_id);
create index folder_access_user_idx on public.folder_access(user_id);

alter table public.folder_access enable row level security;

create policy "folder_access_select" on public.folder_access
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "folder_access_insert_admin" on public.folder_access
  for insert to authenticated
  with check (public.is_admin());

create policy "folder_access_delete_admin" on public.folder_access
  for delete to authenticated
  using (public.is_admin());

create or replace function public.can_access_folder(p_folder_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1 from public.folder_access
      where user_id = auth.uid() and folder_id = p_folder_id
    );
$$;

drop policy if exists "folders_select" on public.drive_folders;
create policy "folders_select" on public.drive_folders
  for select to authenticated
  using (public.is_admin() or public.can_access_folder(id));

drop policy if exists "documents_select" on public.excel_documents;
create policy "documents_select" on public.excel_documents
  for select to authenticated
  using (
    public.is_admin()
    or (folder_id is not null and public.can_access_folder(folder_id))
  );

create or replace function public.admin_create_viewer(
  p_email text,
  p_password text,
  p_folder_ids uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid := gen_random_uuid();
  v_folder uuid;
begin
  if not public.is_admin() then
    raise exception 'Hanya Admin yang boleh membuat viewer';
  end if;

  if v_email is null or v_email = '' then
    raise exception 'Email wajib diisi';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password minimal 6 karakter';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Email sudah terdaftar';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, is_super_admin, is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id, 'authenticated', 'authenticated', v_email,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now(), '', '', '', '', false, false, false
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at, email
  ) values (
    gen_random_uuid(), v_id,
    jsonb_build_object(
      'sub', v_id::text, 'email', v_email,
      'email_verified', true, 'phone_verified', false
    ),
    'email', v_id::text, now(), now(), now(), v_email
  );

  insert into public.profiles (id, email, role)
  values (v_id, v_email, 'viewer')
  on conflict (id) do update set email = excluded.email, role = 'viewer';

  if p_folder_ids is not null then
    foreach v_folder in array p_folder_ids loop
      if v_folder is null then continue; end if;
      insert into public.folder_access (user_id, folder_id)
      values (v_id, v_folder)
      on conflict do nothing;
    end loop;
  end if;

  return v_id;
end;
$$;

revoke all on function public.admin_create_viewer(text, text, uuid[]) from public;
grant execute on function public.admin_create_viewer(text, text, uuid[]) to authenticated;

create or replace function public.admin_set_folder_access(
  p_user_id uuid,
  p_folder_ids uuid[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya Admin yang boleh mengatur akses folder';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Pengguna tidak ditemukan';
  end if;

  delete from public.folder_access where user_id = p_user_id;

  if p_folder_ids is not null then
    insert into public.folder_access (user_id, folder_id)
    select p_user_id, unnest(p_folder_ids)
    on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.admin_set_folder_access(uuid, uuid[]) from public;
grant execute on function public.admin_set_folder_access(uuid, uuid[]) to authenticated;
