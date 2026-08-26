create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_action_length check (char_length(action) between 3 and 100),
  constraint audit_entity_type_length check (char_length(entity_type) between 2 and 80)
);

alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from anon, authenticated;
grant select on table public.audit_logs to authenticated;
create policy audit_logs_select_admin on public.audit_logs for select to authenticated
using ((select private.is_admin()));

create or replace function private.audit_instrument_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare audit_action text;
begin
  audit_action := case
    when tg_op = 'INSERT' then 'instrument_created'
    when old.archived_at is null and new.archived_at is not null then 'instrument_archived'
    when old.status is distinct from new.status then 'instrument_status_changed'
    else 'instrument_updated'
  end;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), audit_action, 'instrument', new.id,
    jsonb_build_object('name', new.name, 'status', new.status, 'previous_status', case when tg_op = 'UPDATE' then old.status else null end));
  return new;
end;
$$;

create or replace function private.audit_booking_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare audit_action text;
begin
  audit_action := case
    when tg_op = 'INSERT' then 'booking_created'
    when old.status <> 'cancelled'::public.booking_status and new.status = 'cancelled'::public.booking_status
      then case when (select private.is_admin()) then 'admin_booking_cancelled' else 'booking_cancelled' end
    else 'booking_updated'
  end;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), audit_action, 'booking', new.id,
    jsonb_build_object('instrument_id', new.instrument_id, 'booking_user_id', new.user_id, 'status', new.status,
      'cancellation_reason', case when new.status = 'cancelled'::public.booking_status then new.cancellation_reason else null end));
  return new;
end;
$$;

create or replace function private.audit_role_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role is distinct from new.role then
    insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
    values ((select auth.uid()), 'user_role_changed', 'profile', new.id,
      jsonb_build_object('previous_role', old.role, 'new_role', new.role, 'email', new.email));
  end if;
  return new;
end;
$$;

revoke all on function private.audit_instrument_change(), private.audit_booking_change(), private.audit_role_change() from public, anon, authenticated;
create trigger instruments_audit after insert or update on public.instruments for each row execute function private.audit_instrument_change();
create trigger bookings_audit after insert or update on public.bookings for each row execute function private.audit_booking_change();
create trigger profiles_audit_role after update of role on public.profiles for each row execute function private.audit_role_change();

create index bookings_status_start_idx on public.bookings(status, start_time);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index audit_logs_actor_created_idx on public.audit_logs(actor_user_id, created_at desc);
create index audit_logs_action_created_idx on public.audit_logs(action, created_at desc);

comment on table public.audit_logs is 'Append-only through privileged database triggers. Authenticated clients have no insert, update, or delete grant.';

create or replace function public.admin_instrument_future_counts()
returns table(instrument_id uuid, future_booking_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (select private.is_admin()) then raise exception using errcode = '42501', message = 'Administrator access required'; end if;
  return query select b.instrument_id, count(*)
    from public.bookings b
    where b.status = 'confirmed'::public.booking_status and b.start_time > now()
    group by b.instrument_id;
end;
$$;
revoke all on function public.admin_instrument_future_counts() from public, anon;
grant execute on function public.admin_instrument_future_counts() to authenticated;
