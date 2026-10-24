-- Admin hapus user + ganti password
-- Applied via MCP as admin_delete_and_password

create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya Admin yang boleh menghapus pengguna';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Tidak bisa menghapus akun sendiri';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Pengguna tidak ditemukan';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

create or replace function public.admin_update_password(p_user_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya Admin yang boleh mengubah password';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password minimal 6 karakter';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Pengguna tidak ditemukan';
  end if;

  update auth.users
  set
    encrypted_password = crypt(p_password, gen_salt('bf')),
    updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.admin_update_password(uuid, text) from public;
grant execute on function public.admin_update_password(uuid, text) to authenticated;
