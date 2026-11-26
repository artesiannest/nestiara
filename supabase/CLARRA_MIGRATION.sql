-- Additive rate-limit state. No messages or visitor IP addresses are stored.
create table if not exists public.nest_clarra_limits (
 bucket text not null,
 day date not null default current_date,
 used integer not null default 0,
 primary key(bucket,day)
);
alter table public.nest_clarra_limits enable row level security;
revoke all on public.nest_clarra_limits from public,anon,authenticated;
grant select,insert,update,delete on public.nest_clarra_limits to service_role;
create or replace function public.nest_clarra_claim(visitor_hash text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer;
begin
 if visitor_hash !~ '^[a-f0-9]{64}$' or visitor_hash is null then return false; end if;
 -- One short transaction lock makes the global and per-visitor limits atomic.
 perform pg_advisory_xact_lock(77190031);
 delete from nest_clarra_limits where day < current_date - 2;
 select used into n from nest_clarra_limits where bucket='global' and day=current_date;
 if coalesce(n,0)>=300 then return false;end if;
 select used into n from nest_clarra_limits where bucket=visitor_hash and day=current_date;
 if coalesce(n,0)>=20 then return false;end if;
 insert into nest_clarra_limits(bucket,day,used) values('global',current_date,1),(visitor_hash,current_date,1)
 on conflict(bucket,day) do update set used=nest_clarra_limits.used+1;
 return true;
end;$$;
revoke all on function public.nest_clarra_claim(text) from public,anon,authenticated;
grant execute on function public.nest_clarra_claim(text) to service_role;
notify pgrst,'reload schema';
