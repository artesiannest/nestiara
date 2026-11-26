-- Additive translation cache. Requires the existing portfolio CMS tables.
begin;
create table if not exists public.nest_translations (
 source_text text not null check(char_length(source_text) between 1 and 20000),
 source_hash text generated always as (md5(source_text)) stored,
 target_lang text not null check(target_lang in ('en','th','zh-CN')),
 translated_text text not null check(char_length(translated_text) between 1 and 80000),
 updated_at timestamptz not null default now(),
 primary key(source_hash,target_lang)
);
alter table public.nest_translations enable row level security;
revoke all on public.nest_translations from public,anon,authenticated;
grant select,insert,update,delete on public.nest_translations to service_role;

-- Only explicitly selected PUBLIC CMS fields can enter the translation pipeline.
-- This function never reads orders, customer notes, credentials, or drafts in a browser.
create or replace function public.nest_translation_sources()
returns setof text language plpgsql stable security definer set search_path=public,pg_temp
as $$
declare c jsonb; row jsonb; v jsonb; section text; field text; fields text[]; texts text[]='{}'; item text;
begin
 select content into c from public.nest_content where id=1;
 if c is null then return;end if;
 foreach field in array array['title','headline','heroDescription','aboutDescription'] loop
  if jsonb_typeof(c->'profile'->field)='string' then texts=array_append(texts,c->'profile'->>field);end if;
 end loop;
 foreach field in array array['name','tagline','description','terms','paymentInfo'] loop
  if jsonb_typeof(c->'store'->field)='string' then texts=array_append(texts,c->'store'->>field);end if;
 end loop;
 foreach section in array array['experience','systems','games','research','education','skills','certificates','products'] loop
  fields=case section
   when 'experience' then array['period','role','description']
   when 'systems' then array['title','category','summary']
   when 'games' then array['title','category','summary']
   when 'research' then array['title','topic','type','summary','focus','method','detail','status']
   when 'education' then array['level','thesis','status']
   when 'skills' then array['title']
   when 'certificates' then array['title','date']
   when 'products' then array['title','category','summary','description','features','delivery','license'] end;
  if jsonb_typeof(c->section)='array' then
   for row in select value from jsonb_array_elements(c->section) loop
    if section='products' and (row->>'status' is distinct from 'active' or coalesce(c->'store'->>'enabled','false')<>'true') then continue;end if;
    foreach field in array fields loop
     if jsonb_typeof(row->field)='string' then texts=array_append(texts,row->>field);end if;
    end loop;
    if section='skills' and jsonb_typeof(row->'items')='array' then
     for v in select value from jsonb_array_elements(row->'items') loop
      if jsonb_typeof(v)='string' then texts=array_append(texts,v#>>'{}');end if;
     end loop;
    end if;
    if section='systems' and jsonb_typeof(row->'gallery')='array' then
     for v in select value from jsonb_array_elements(row->'gallery') loop
      if jsonb_typeof(v->'caption')='string' then texts=array_append(texts,v->>'caption');end if;
     end loop;
    end if;
   end loop;
  end if;
 end loop;
 return query select distinct trim(regexp_replace(t,'\s+',' ','g')) from unnest(texts) t
  where char_length(trim(t))>1 and char_length(t)<=20000
   and t !~* '^https?://' and t !~ '^[^[:space:]@]+@[^[:space:]@]+$';
end;$$;
revoke all on function public.nest_translation_sources() from public,anon,authenticated;

create or replace function public.nest_translation_catalog(target_language text)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp
as $$
declare result jsonb; pending bigint; total bigint;
begin
 if target_language not in ('en','th','zh-CN') or target_language is null then raise exception 'Bahasa tidak didukung.';end if;
 with sources as (select public.nest_translation_sources() as txt)
 select coalesce(jsonb_object_agg(s.txt,t.translated_text) filter(where t.source_text is not null),'{}'::jsonb),
 count(*) filter(where t.source_text is null),count(*) into result,pending,total
 from sources s left join public.nest_translations t on t.source_hash=md5(s.txt) and t.source_text=s.txt and t.target_lang=target_language;
 return jsonb_build_object('translations',result,'pending',pending,'total',total);
end;$$;
revoke all on function public.nest_translation_catalog(text) from public;
grant execute on function public.nest_translation_catalog(text) to anon,authenticated,service_role;

create or replace function public.nest_translation_state(target_language text)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp
as $$
declare pending jsonb; total bigint;
begin
 if not exists(select 1 from public.nest_admins where user_id=auth.uid()) then raise exception 'Akses admin diperlukan.' using errcode='42501';end if;
 if target_language not in ('en','th','zh-CN') or target_language is null then raise exception 'Bahasa tidak didukung.';end if;
 with sources as (select public.nest_translation_sources() as txt)
 select coalesce(jsonb_agg(s.txt order by s.txt) filter(where t.source_text is null),'[]'::jsonb),count(*) into pending,total
 from sources s left join public.nest_translations t on t.source_hash=md5(s.txt) and t.source_text=s.txt and t.target_lang=target_language;
 return jsonb_build_object('missing',pending,'total',total,'remaining',jsonb_array_length(pending));
end;$$;
revoke all on function public.nest_translation_state(text) from public;
grant execute on function public.nest_translation_state(text) to authenticated;
notify pgrst,'reload schema';
commit;
