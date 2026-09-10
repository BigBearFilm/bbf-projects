begin;
lock table public.bbf_workspaces in access exclusive mode;
create table if not exists public.bbf_spaces(
 id uuid primary key, name text not null default 'BBF Projects',
 owner_id uuid not null references auth.users(id), revision bigint not null default 1,
 created_at timestamptz not null default now()
);
create table if not exists public.bbf_members(
 space_id uuid not null references public.bbf_spaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','editor','viewer')),
 primary key(space_id,user_id)
);
create or replace function public.bbf_role(s uuid) returns text language sql stable security definer set search_path='' as $$
 select role from public.bbf_members where space_id=s and user_id=auth.uid()
$$;
revoke all on function public.bbf_role(uuid) from public,anon;
grant execute on function public.bbf_role(uuid) to authenticated;
create table if not exists public.bbf_projects(
 space_id uuid not null references public.bbf_spaces(id), id text not null,
 data jsonb not null check(jsonb_typeof(data)='object'), primary key(space_id,id)
);
create table if not exists public.bbf_people(
 space_id uuid not null references public.bbf_spaces(id), id text not null,
 data jsonb not null check(jsonb_typeof(data)='object'), primary key(space_id,id)
);
create table if not exists public.bbf_price_books(
 space_id uuid not null references public.bbf_spaces(id), id text not null,
 data jsonb not null check(jsonb_typeof(data)='object'), primary key(space_id,id),
 valid_from text generated always as (data->>'validFrom') stored,
 unique(space_id,valid_from)
);
create table if not exists public.bbf_prices(
 space_id uuid not null references public.bbf_spaces(id), id text not null,
 data jsonb not null check(jsonb_typeof(data)='object'), primary key(space_id,id),
 book_id text generated always as (data->>'bookId') stored not null,
 foreign key(space_id,book_id) references public.bbf_price_books(space_id,id) deferrable initially deferred
);
create table if not exists public.bbf_cost_rows(
 space_id uuid not null references public.bbf_spaces(id), id text not null,
 data jsonb not null check(jsonb_typeof(data)='object'), primary key(space_id,id),
 project_id text generated always as (data->>'projectId') stored not null,
 parent_id text generated always as (data->>'parentId') stored,
 foreign key(space_id,project_id) references public.bbf_projects(space_id,id) deferrable initially deferred,
 foreign key(space_id,parent_id) references public.bbf_cost_rows(space_id,id) deferrable initially deferred
);
create table if not exists public.bbf_clients(
 space_id uuid not null references public.bbf_spaces(id),id text not null,data jsonb not null check(jsonb_typeof(data)='object'),primary key(space_id,id)
);
create table if not exists public.bbf_cost_descriptions(
 space_id uuid not null references public.bbf_spaces(id),id text not null,data jsonb not null check(jsonb_typeof(data)='object'),primary key(space_id,id)
);
create table if not exists public.bbf_settings(
 space_id uuid not null references public.bbf_spaces(id),id text not null,data jsonb not null check(jsonb_typeof(data)='object'),primary key(space_id,id)
);
create table if not exists public.bbf_change_log(
 id bigint generated always as identity primary key,space_id uuid not null references public.bbf_spaces(id),
 user_id uuid references auth.users(id),record_table text not null,record_id text not null,
 before_data jsonb,after_data jsonb,created_at timestamptz not null default now()
);
create index if not exists bbf_rows_project on public.bbf_cost_rows(space_id,project_id);
create index if not exists bbf_rows_parent on public.bbf_cost_rows(space_id,parent_id);
create index if not exists bbf_prices_book on public.bbf_prices(space_id,book_id);
create index if not exists bbf_members_user on public.bbf_members(user_id);
create index if not exists bbf_changes_space on public.bbf_change_log(space_id,id);
do $setup$
declare t text;
begin
 foreach t in array array['bbf_spaces','bbf_members','bbf_projects','bbf_people','bbf_price_books','bbf_prices','bbf_cost_rows','bbf_clients','bbf_cost_descriptions','bbf_settings','bbf_change_log'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('drop policy if exists members_read on public.%I',t);
 execute format('create policy members_read on public.%I for select to authenticated using(public.bbf_role(%I) is not null)',t,case when t='bbf_spaces' then 'id' else 'space_id' end);
 end loop;
end $setup$;
-- Preserve the old documents as a read-only migration backup.
insert into public.bbf_spaces(id,owner_id) select owner_id,owner_id from public.bbf_workspaces on conflict do nothing;
insert into public.bbf_members select id,owner_id,'owner' from public.bbf_spaces on conflict do nothing;
insert into public.bbf_projects(space_id,id,data)
 select w.owner_id,p->>'id',(p-'rows')||jsonb_build_object('_position',n)
 from public.bbf_workspaces w cross join lateral jsonb_array_elements(w.data->'projects') with ordinality a(p,n) on conflict do nothing;
insert into public.bbf_cost_rows(space_id,id,data)
 select w.owner_id,r->>'id',(r-'settlements')||jsonb_build_object('projectId',p->>'id','_position',n)
 from public.bbf_workspaces w cross join lateral jsonb_array_elements(w.data->'projects') a(p)
 cross join lateral jsonb_array_elements(p->'rows') with ordinality b(r,n) on conflict do nothing;
insert into public.bbf_people(space_id,id,data)
 select owner_id,p->>'id',p from public.bbf_workspaces cross join lateral jsonb_array_elements(data->'crew') a(p) on conflict do nothing;
insert into public.bbf_clients(space_id,id,data)
 select owner_id,'client:'||c,jsonb_build_object('name',c) from public.bbf_workspaces cross join lateral jsonb_array_elements_text(data->'clients') a(c) on conflict do nothing;
insert into public.bbf_price_books(space_id,id,data)
 select owner_id,'legacy','{"name":"Cennik podstawowy","validFrom":"0001-01-01"}' from public.bbf_workspaces on conflict do nothing;
insert into public.bbf_prices(space_id,id,data)
 select owner_id,'legacy:'||(p->>'id'),p||'{"bookId":"legacy"}' from public.bbf_workspaces cross join lateral jsonb_array_elements(data->'priceList') a(p) on conflict do nothing;
insert into public.bbf_settings(space_id,id,data)
 select owner_id,'settings',data-'projects'-'crew'-'clients'-'priceList'-'ui' from public.bbf_workspaces on conflict do nothing;
create or replace function public.bbf_bootstrap() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED';end if;
 if not exists(select 1 from public.bbf_members where user_id=auth.uid()) then
  insert into public.bbf_spaces(id,owner_id) values(auth.uid(),auth.uid()) on conflict do nothing;
  insert into public.bbf_members values(auth.uid(),auth.uid(),'owner') on conflict do nothing;
 end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'role',m.role,'revision',s.revision)),'[]') from public.bbf_spaces s join public.bbf_members m on m.space_id=s.id where m.user_id=auth.uid());
end $$;
create or replace function public.bbf_snapshot(s uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare t text; result jsonb:='{}'; records jsonb; rev bigint;
begin
 if public.bbf_role(s) is null then raise exception 'ACCESS_DENIED';end if;
 select revision into rev from public.bbf_spaces where id=s for share;
 foreach t in array array['projects','people','price_books','prices','cost_rows','clients','cost_descriptions','settings'] loop
 execute format('select coalesce(jsonb_agg(jsonb_build_object(''id'',id,''data'',data) order by id),''[]'') from public.%I where space_id=$1','bbf_'||t) into records using s;
 result:=result||jsonb_build_object(t,records);
 end loop;
 return jsonb_build_object('revision',rev,'entities',result,'role',public.bbf_role(s));
end $$;
create or replace function public.bbf_apply_changes(s uuid,changes jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare op jsonb;t text;rid text;before_doc jsonb;after_doc jsonb;current_doc jsonb;next_doc jsonb;k text;keys text[];changed boolean:=false;
begin
 if public.bbf_role(s) not in ('owner','editor') or public.bbf_role(s) is null then raise exception 'WRITE_DENIED';end if;
 if jsonb_typeof(changes)<>'array' or jsonb_array_length(changes)>10000 or octet_length(changes::text)>10485760 then raise exception 'INVALID_CHANGES';end if;
 perform 1 from public.bbf_spaces where id=s for update;
 if public.bbf_role(s) not in ('owner','editor') or public.bbf_role(s) is null then raise exception 'WRITE_DENIED';end if;
 for op in select value from jsonb_array_elements(changes) loop
 t:=op->>'table';rid:=op->>'id';before_doc:=nullif(op->'before','null'::jsonb);after_doc:=nullif(op->'after','null'::jsonb);
 if not(t=any(array['projects','people','price_books','prices','cost_rows','clients','cost_descriptions','settings'])) or rid is null or length(rid)>400 then raise exception 'INVALID_ENTITY';end if;
 if (before_doc is not null and jsonb_typeof(before_doc)<>'object') or (after_doc is not null and jsonb_typeof(after_doc)<>'object') then raise exception 'INVALID_RECORD';end if;
 execute format('select data from public.%I where space_id=$1 and id=$2','bbf_'||t) into current_doc using s,rid;
 if before_doc is null then
  if current_doc is not null then
   if current_doc=after_doc then continue;end if;
   raise exception 'CELL_CONFLICT:%:%:insert',t,rid;
  end if;
  if after_doc is null then continue;end if;
  next_doc:=after_doc;
 elsif after_doc is null then
  if current_doc is null then continue;end if;
  if current_doc<>before_doc then raise exception 'CELL_CONFLICT:%:%:delete',t,rid;end if;
  next_doc:=null;
 else
  if current_doc is null then raise exception 'CELL_CONFLICT:%:%:deleted',t,rid;end if;
  next_doc:=current_doc;
  for k in select jsonb_object_keys(before_doc||after_doc) loop
   if before_doc->k is not distinct from after_doc->k then continue;end if;
   if current_doc->k is distinct from before_doc->k and current_doc->k is distinct from after_doc->k then raise exception 'CELL_CONFLICT:%:%:%',t,rid,k;end if;
   if after_doc ? k then next_doc:=jsonb_set(next_doc,array[k],after_doc->k);else next_doc:=next_doc-k;end if;
  end loop;
 end if;
 if next_doc is not distinct from current_doc then continue;end if;
 if next_doc is null then execute format('delete from public.%I where space_id=$1 and id=$2','bbf_'||t) using s,rid;
 else execute format('insert into public.%I(space_id,id,data) values($1,$2,$3) on conflict(space_id,id) do update set data=excluded.data','bbf_'||t) using s,rid,next_doc;
 end if;
 insert into public.bbf_change_log(space_id,user_id,record_table,record_id,before_data,after_data) values(s,auth.uid(),t,rid,current_doc,next_doc);
 changed:=true;
 end loop;
 if changed then update public.bbf_spaces set revision=revision+1 where id=s;end if;
 return public.bbf_snapshot(s);
end $$;
create or replace function public.bbf_members_list(s uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if public.bbf_role(s) is null then raise exception 'ACCESS_DENIED';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('email',u.email,'role',m.role)),'[]') from public.bbf_members m join auth.users u on u.id=m.user_id where m.space_id=s);
end $$;
create or replace function public.bbf_set_member(s uuid,email_address text,member_role text) returns void language plpgsql security definer set search_path='' as $$
declare member_id uuid;
begin
 perform 1 from public.bbf_spaces where id=s for update;
 if public.bbf_role(s) is distinct from 'owner' then raise exception 'OWNER_REQUIRED';end if;
 if member_role not in ('editor','viewer') then raise exception 'INVALID_ROLE';end if;
 select id into member_id from auth.users where lower(email)=lower(trim(email_address));
 if member_id is null then raise exception 'ACCOUNT_NOT_FOUND';end if;
 if exists(select 1 from public.bbf_members where space_id=s and user_id=member_id and role='owner') then raise exception 'OWNER_PROTECTED';end if;
 insert into public.bbf_members values(s,member_id,member_role) on conflict(space_id,user_id) do update set role=excluded.role;
 update public.bbf_spaces set revision=revision+1 where id=s;
end $$;
revoke all on function public.bbf_bootstrap(),public.bbf_snapshot(uuid),public.bbf_apply_changes(uuid,jsonb),public.bbf_members_list(uuid),public.bbf_set_member(uuid,text,text) from public,anon;
grant execute on function public.bbf_bootstrap(),public.bbf_snapshot(uuid),public.bbf_apply_changes(uuid,jsonb),public.bbf_members_list(uuid),public.bbf_set_member(uuid,text,text) to authenticated;
-- Old clients must refresh instead of writing a stale whole-workspace document.
revoke insert,update on public.bbf_workspaces from authenticated;
revoke execute on function public.bbf_save_workspace(jsonb,bigint) from authenticated;
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='bbf_spaces') then
  alter publication supabase_realtime add table public.bbf_spaces;
 end if;
end $$;
commit;
