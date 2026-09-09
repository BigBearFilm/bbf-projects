begin;
create table if not exists public.bbf_workspaces (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null check (jsonb_typeof(data)='object'),
 revision bigint not null default 1 check (revision>0),
 updated_at timestamptz not null default now()
);
alter table public.bbf_workspaces enable row level security;
revoke all on public.bbf_workspaces from anon, authenticated;
grant select,insert,update on public.bbf_workspaces to authenticated;
create policy "Read own workspace" on public.bbf_workspaces for select to authenticated using ((select auth.uid())=owner_id);
create policy "Create own workspace" on public.bbf_workspaces for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "Update own workspace" on public.bbf_workspaces for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create or replace function public.bbf_save_workspace(payload jsonb, expected_revision bigint)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare current_revision bigint; next_revision bigint;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if jsonb_typeof(payload)<>'object' or jsonb_typeof(payload->'projects') is distinct from 'array'
 or jsonb_typeof(payload->'crew') is distinct from 'array' or jsonb_typeof(payload->'clients') is distinct from 'array'
 or jsonb_typeof(payload->'priceList') is distinct from 'array' or octet_length(payload::text)>10485760
 then raise exception 'INVALID_WORKSPACE'; end if;
 select revision into current_revision from public.bbf_workspaces where owner_id=auth.uid() for update;
 if not found then
  if expected_revision<>0 then raise exception 'VERSION_CONFLICT'; end if;
  begin
   insert into public.bbf_workspaces(owner_id,data) values(auth.uid(),payload);
  exception when unique_violation then raise exception 'VERSION_CONFLICT'; end;
  return 1;
 end if;
 if current_revision<>expected_revision then raise exception 'VERSION_CONFLICT'; end if;
 next_revision=current_revision+1;
 update public.bbf_workspaces set data=payload,revision=next_revision,updated_at=now() where owner_id=auth.uid();
 return next_revision;
end;$$;
revoke all on function public.bbf_save_workspace(jsonb,bigint) from public,anon;
grant execute on function public.bbf_save_workspace(jsonb,bigint) to authenticated;
commit;
