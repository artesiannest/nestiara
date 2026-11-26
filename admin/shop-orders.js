(function(){
 'use strict';
 const labels={pending:'Baru',confirmed:'Dikonfirmasi',processing:'Diproses',completed:'Selesai',cancelled:'Dibatalkan'};
 function el(tag,text,cls){const n=document.createElement(tag);if(text!=null)n.textContent=String(text);if(cls)n.className=cls;return n;}
 window.NestShopOrders={async render(editor){
 const panel=el('section',null,'entry shop-admin-orders');editor.append(panel);
 const intro=el('div',null,'shop-admin-heading');intro.append(el('h2','Pesanan pelanggan'),el('p','Pesanan menyimpan harga saat pemesanan. Status diperbarui langsung tanpa tombol Terbitkan. Pembayaran dan pengiriman dikonfirmasi secara manual.'));
 const refresh=el('button','Muat ulang');refresh.type='button';refresh.addEventListener('click',()=>{editor.replaceChildren();window.NestShopOrders.render(editor);});intro.append(refresh);panel.append(intro);
 const alert=el('p','Memuat pesanan…','shop-order-notice');alert.setAttribute('role','status');panel.append(alert);
 try{
 const orders=await NestCMS.shopOrders();if(!panel.isConnected)return;
 alert.textContent=orders.length?'Menampilkan '+orders.length+' pesanan terbaru (maksimum 200).':'Belum ada pesanan.';
 const tools=el('div',null,'shop-admin-filters'),search=el('input'),status=el('select');search.placeholder='Cari kode, nama, atau email';search.setAttribute('aria-label','Cari pesanan');status.setAttribute('aria-label','Filter status pesanan');
 Object.entries({all:'Semua status',...labels}).forEach(([k,v])=>{const o=el('option',v);o.value=k;status.append(o);});tools.append(search,status);panel.append(tools);const list=el('div');panel.append(list);
 function renderList(){list.replaceChildren();const q=search.value.toLocaleLowerCase().trim();const matches=orders.filter(o=>(status.value==='all'||o.status===status.value)&&[o.order_code,o.customer_name,o.customer_email].join(' ').toLocaleLowerCase().includes(q));if(!matches.length)list.append(el('p','Tidak ada pesanan sesuai filter.'));
 matches.forEach(order=>{
 const box=el('article',null,'shop-admin-order');const head=el('div',null,'entry-head');head.append(el('h3',order.order_code),el('span',labels[order.status]||order.status,'shop-order-badge'));box.append(head);
 box.append(el('p',new Date(order.created_at).toLocaleString('id-ID')),el('strong',order.customer_name),el('p',order.customer_email+' · '+order.customer_phone));
 const lines=el('ul');(order.items||[]).forEach(l=>lines.append(el('li',l.title+' × '+l.quantity+' · '+(l.priceMode==='quote'?'Penawaran':NestShopModel.money(l.price*l.quantity)))));box.append(lines,el('strong','Estimasi total: '+NestShopModel.money(order.total)));
 if(order.quote_required)box.append(el('p','Memerlukan konfirmasi penawaran atau harga mulai.'));
 if(order.notes)box.append(el('p','Catatan pelanggan: '+order.notes));
 const fields=el('div',null,'fields'),stateLabel=el('label','Status pesanan'),select=el('select');Object.entries(labels).forEach(([k,v])=>{const o=el('option',v);o.value=k;select.append(o);});select.value=order.status;stateLabel.append(select);
 const noteLabel=el('label','Catatan internal admin'),note=el('textarea');note.maxLength=2000;note.value=order.admin_note||'';noteLabel.append(note);fields.append(stateLabel,noteLabel);box.append(fields);
 const actions=el('div',null,'shop-admin-actions'),save=el('button','Simpan status','primary');save.type='button';const notice=el('p');notice.setAttribute('role','status');
 save.addEventListener('click',async()=>{save.disabled=true;try{const row=await NestCMS.shopUpdateOrder(order.id,select.value,note.value,order.updated_at);Object.assign(order,row);notice.textContent='Status berhasil diperbarui.';head.lastChild.textContent=labels[order.status];}catch(e){notice.textContent=e.message;}finally{save.disabled=false;}});
 actions.append(save);const phone=NestShopModel.phone(order.customer_phone);if(phone){const a=el('a','Hubungi pelanggan');a.href='https://wa.me/'+phone+'?text='+encodeURIComponent('Halo '+order.customer_name+', mengenai pesanan '+order.order_code+'.');a.target='_blank';a.rel='noopener noreferrer';actions.append(a);}box.append(actions,notice);list.append(box);
 });}
 search.addEventListener('input',renderList);status.addEventListener('change',renderList);renderList();
 }catch(e){alert.textContent='Daftar pesanan belum dapat dimuat. Jalankan supabase/SHOP_MIGRATION.sql jika belum dipasang. '+e.message;alert.classList.add('error');}
 }};
})();
