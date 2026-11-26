-- Rerunnable additive migration. Run in the existing portfolio Supabase project.
-- Requires the existing public.nest_content and public.nest_admins tables.
begin;

create table if not exists public.nest_shop_orders (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 request_hash text not null,
 order_code text not null unique,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 customer_name text not null check(char_length(customer_name) between 2 and 100),
 customer_email text not null check(char_length(customer_email) between 3 and 254),
 customer_phone text not null check(customer_phone ~ '^[1-9][0-9]{7,14}$'),
 notes text not null default '' check(char_length(notes)<=2000),
 items jsonb not null check(jsonb_typeof(items)='array'),
 total bigint not null check(total>=0),
 quote_required boolean not null default false,
 terms_accepted_at timestamptz not null default now(),
 status text not null default 'pending' check(status in ('pending','confirmed','processing','completed','cancelled')),
 admin_note text not null default '' check(char_length(admin_note)<=2000)
);
create index if not exists nest_shop_orders_created_idx on public.nest_shop_orders(created_at desc);
alter table public.nest_shop_orders enable row level security;
revoke all on public.nest_shop_orders from anon, authenticated;
grant select on public.nest_shop_orders to authenticated;
grant update(status,admin_note,updated_at) on public.nest_shop_orders to authenticated;
drop policy if exists nest_shop_admin_read on public.nest_shop_orders;
create policy nest_shop_admin_read on public.nest_shop_orders for select to authenticated
 using(exists(select 1 from public.nest_admins a where a.user_id=auth.uid()));
drop policy if exists nest_shop_admin_update on public.nest_shop_orders;
create policy nest_shop_admin_update on public.nest_shop_orders for update to authenticated
 using(exists(select 1 from public.nest_admins a where a.user_id=auth.uid()))
 with check(exists(select 1 from public.nest_admins a where a.user_id=auth.uid()));

create or replace function public.nest_shop_place_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare
 catalog jsonb; line jsonb; product jsonb; snapshot jsonb='[]'::jsonb;
 v_request uuid; v_hash text; existing public.nest_shop_orders%rowtype;
 v_id uuid=gen_random_uuid(); v_code text; v_name text; v_email text; v_phone text; v_notes text;
 qty integer; unit_price bigint; v_total bigint=0; v_quote boolean=false;
 seen text[]='{}'; product_id text;
begin
 if payload is null or jsonb_typeof(payload)<>'object' then raise exception 'Pesanan tidak valid.'; end if;
 if octet_length(payload::text)>18000 then raise exception 'Pesanan terlalu besar.'; end if;
 if coalesce(payload->>'terms_accepted','')<>'true' then raise exception 'Persetujuan pemesanan diperlukan.'; end if;
 begin v_request=(payload->>'request_id')::uuid; exception when others then raise exception 'Kode permintaan tidak valid.'; end;
 if v_request is null then raise exception 'Kode permintaan wajib diisi.'; end if;
 v_hash=md5(payload::text);
 -- Serialize duplicate retries and submissions from the same contact.
 v_email=lower(trim(coalesce(payload->>'customer_email','')));
 v_phone=trim(coalesce(payload->>'customer_phone',''));
 perform pg_advisory_xact_lock(hashtextextended('nest-shop-request:'||v_request::text,0));
 select * into existing from public.nest_shop_orders where request_id=v_request;
 if found then
  if existing.request_hash<>v_hash then raise exception 'Permintaan berbeda menggunakan kode yang sama. Buka ulang keranjang.'; end if;
  return jsonb_build_object('order_id',existing.id,'order_code',existing.order_code,'total',existing.total,'status',existing.status,'quote_required',existing.quote_required);
 end if;
 v_name=trim(coalesce(payload->>'customer_name',''));v_notes=trim(coalesce(payload->>'notes',''));
 if char_length(v_name) not between 2 and 100 then raise exception 'Nama pemesan wajib 2 sampai 100 karakter.'; end if;
 if char_length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Email tidak valid.'; end if;
 if v_phone !~ '^[1-9][0-9]{7,14}$' then raise exception 'Nomor WhatsApp tidak valid.'; end if;
 if char_length(v_notes)>2000 then raise exception 'Catatan maksimum 2000 karakter.'; end if;
 if jsonb_typeof(payload->'items') is distinct from 'array' then raise exception 'Keranjang tidak valid.'; end if;
 if jsonb_array_length(payload->'items') not between 1 and 20 then raise exception 'Keranjang harus berisi 1 sampai 20 jenis produk.'; end if;
 perform pg_advisory_xact_lock(hashtextextended('nest-shop-contact:'||v_phone,0));
 if (select count(*) from public.nest_shop_orders where customer_phone=v_phone and created_at>now()-interval '10 minutes')>=5 then raise exception 'Terlalu banyak pesanan. Coba lagi beberapa saat.'; end if;
 select content into catalog from public.nest_content where id=1;
 if catalog is null then raise exception 'Toko belum diterbitkan oleh admin.'; end if;
 if coalesce(catalog->'store'->>'enabled','false')<>'true' then raise exception 'Toko sedang tidak menerima pesanan.'; end if;
 if jsonb_typeof(catalog->'products') is distinct from 'array' then raise exception 'Katalog belum tersedia.'; end if;
 for line in select value from jsonb_array_elements(payload->'items') loop
  product_id=line->>'id';
  if product_id is null or product_id !~ '^[a-zA-Z0-9_-]{1,80}$' or product_id=any(seen) then raise exception 'Kode produk tidak valid atau duplikat.'; end if;
  seen=array_append(seen,product_id);
  if coalesce(line->>'quantity','') !~ '^([1-9]|1[0-9]|20)$' then raise exception 'Jumlah produk harus 1 sampai 20.'; end if;
  qty=(line->>'quantity')::integer;
  select value into product from jsonb_array_elements(catalog->'products') where value->>'id'=product_id limit 1;
  if product is null or product->>'status' is distinct from 'active' then raise exception 'Produk tidak tersedia. Muat ulang katalog.'; end if;
  if coalesce(product->>'price','') !~ '^[0-9]{1,10}$' then raise exception 'Harga produk belum valid.'; end if;
  unit_price=(product->>'price')::bigint;
  if unit_price>1000000000 or coalesce(product->>'priceMode','') not in ('fixed','starting','quote') then raise exception 'Harga produk belum valid.'; end if;
  if product->>'priceMode'='quote' then unit_price=0;end if;
  v_quote=v_quote or product->>'priceMode' in ('starting','quote');
  v_total=v_total+unit_price*qty;
  snapshot=snapshot||jsonb_build_array(jsonb_build_object('id',product_id,'title',product->>'title','type',product->>'type','quantity',qty,'price',unit_price,'priceMode',product->>'priceMode','delivery',product->>'delivery','license',product->>'license'));
 end loop;
 v_code='NEST-'||upper(replace(v_id::text,'-',''));
 insert into public.nest_shop_orders(id,request_id,request_hash,order_code,customer_name,customer_email,customer_phone,notes,items,total,quote_required)
 values(v_id,v_request,v_hash,v_code,v_name,v_email,v_phone,v_notes,snapshot,v_total,v_quote);
 return jsonb_build_object('order_id',v_id,'order_code',v_code,'total',v_total,'status','pending','quote_required',v_quote);
end;
$$;
revoke all on function public.nest_shop_place_order(jsonb) from public;
grant execute on function public.nest_shop_place_order(jsonb) to anon,authenticated;
notify pgrst, 'reload schema';
commit;
