-- Production safety: preserve booking history and protect the final administrator
-- from profile deletion. This migration deliberately does not add an application
-- deactivation flag; operators should disable Auth access instead of deleting users.

alter table public.bookings
  drop constraint bookings_user_id_fkey,
  add constraint bookings_user_id_fkey
    foreign key (user_id)
    references public.profiles(id)
    on delete restrict;

comment on constraint bookings_user_id_fkey on public.bookings is
  'RESTRICT preserves booking and ledger history when a profile or its auth.users parent is deleted.';

create or replace function private.protect_final_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.role = 'admin'::public.user_role
       and not exists (
         select 1
         from public.profiles
         where role = 'admin'::public.user_role
           and id <> old.id
       ) then
      raise exception using errcode = 'P0001', message = 'LAST_ADMIN';
    end if;

    return old;
  end if;

  if old.role = 'admin'::public.user_role
     and new.role <> 'admin'::public.user_role
     and not exists (
       select 1
       from public.profiles
       where role = 'admin'::public.user_role
         and id <> old.id
     ) then
    raise exception using errcode = 'P0001', message = 'LAST_ADMIN';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_final_admin() from public, anon, authenticated;

drop trigger if exists profiles_21_protect_final_admin_delete on public.profiles;
create trigger profiles_21_protect_final_admin_delete
before delete on public.profiles
for each row execute function private.protect_final_admin();

comment on function private.protect_final_admin() is
  'Raises LAST_ADMIN for demotion or deletion of the final administrator; SECURITY DEFINER avoids recursive RLS and uses an empty search_path.';

