(function(){
 'use strict';
 const M=window.NestShopModel,data=M.normalize(window.PORTFOLIO_DATA),store=data.store;
 const view=document.getElementById('view-toko');if(!view)return;
 const $=s=>document.querySelector(s),grid=$('#shop-grid'),details=$('#shop-details'),cartDialog=$('#shop-cart');
 let cart=[],lastFocus=null,limit=24,submitting=false,receipt=null,requestId=null,lastPayloadKey=null;
 const storageKey='nestiara-shop-cart-v1';
 const products=data.products.filter(M.available);
 const enabled=store.enabled!==false&&store.enabled!=='false';
 function el(tag,text,cls){const n=document.createElement(tag);if(text!=null)n.textContent=String(text);if(cls)n.className=cls;return n;}
 function button(text,fn,cls='shop-btn'){const n=el('button',text,cls);n.type='button';n.addEventListener('click',fn);return n;}
 function safeImage(value){if(/^assets\/[\w./ -]+$/.test(value||'')&&!value.includes('..'))return value;try{const u=new URL(value);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href;}catch(_){}return '';}
 function kind(p){return p.type==='service'?'Jasa':'Produk digital';}
 function price(p){return p.priceMode==='quote'?'Minta penawaran':(p.priceMode==='starting'?'Mulai ':'')+M.money(p.price);}
 function visibleCart(){return cart.map(l=>({p:products.find(p=>p.id===l.id),quantity:l.quantity})).filter(l=>l.p);}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(cart));}catch(_){}$('#shop-cart-count').textContent=String(visibleCart().reduce((n,l)=>n+l.quantity,0));receipt=null;requestId=null;}
 try{const old=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(old))cart=old.filter(l=>l&&products.some(p=>p.id===l.id)&&Number.isInteger(l.quantity)&&l.quantity>0&&l.quantity<=20).slice(0,20).filter((l,i,a)=>a.findIndex(x=>x.id===l.id)===i);}catch(_){}
 function showStatus(text){const n=$('#shop-toast');n.textContent=text;n.hidden=false;clearTimeout(showStatus.timer);showStatus.timer=setTimeout(()=>n.hidden=true,2800);}
 function add(p){if(!enabled)return;const existing=cart.find(l=>l.id===p.id);if(existing){if(existing.quantity>=20){showStatus('Maksimum 20 per produk.');return;}existing.quantity++;}else{if(cart.length>=20){showStatus('Maksimum 20 jenis produk per pesanan.');return;}cart.push({id:p.id,quantity:1});}save();showStatus('Ditambahkan ke keranjang.');}
 function open(d){lastFocus=document.activeElement;d.showModal();}
 function close(d){d.close();if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
 document.querySelectorAll('[data-shop-close]').forEach(b=>b.addEventListener('click',()=>close(b.closest('dialog'))));
 cartDialog.addEventListener('cancel',e=>{if(submitting)e.preventDefault();});
 [details,cartDialog].forEach(d=>{d.addEventListener('click',e=>{if(d===cartDialog&&submitting)return;if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close(d);}});});
 function image(p,cls){const src=safeImage(p.cover);if(!src)return null;const n=el('img',null,cls);n.src=src;n.alt=p.title;n.loading='lazy';n.addEventListener('error',()=>n.remove(),{once:true});return n;}
 function detail(p){$('#shop-detail-title').textContent=p.title;const box=$('#shop-detail-body');box.replaceChildren();const img=image(p,'shop-detail-image');if(img)box.append(img);
 box.append(el('p',price(p),'shop-price'),el('p',p.description||p.summary,'shop-detail-text'));
 const meta=el('div',null,'shop-detail-meta');meta.append(el('span','Jenis: '+kind(p)));if(p.delivery)meta.append(el('span','Pengiriman / pengerjaan: '+p.delivery));if(p.license)meta.append(el('span','Lisensi / ketentuan: '+p.license));if(p.features)meta.append(el('span','Termasuk: '+p.features));box.append(meta);
 if(p.demoUrl){const url=safeImage(p.demoUrl);if(url&&url.startsWith('https:')){const a=el('a','Lihat demo','shop-btn');a.href=url;a.target='_blank';a.rel='noopener noreferrer';box.append(a);}}
 box.append(button('Tambah ke keranjang',()=>{add(p);close(details);},'shop-btn primary'));open(details);
 }
 function render(){let list=products.filter(p=>enabled);const q=$('#shop-search').value.trim().toLocaleLowerCase();const cat=$('#shop-category').value;
 list=list.filter(p=>(!cat||p.category===cat)&&(!q||[p.title,p.summary,p.category].map(value=>String(value||'')+' '+(window.NestLanguage?.translate(String(value||''))||'')).join(' ').toLocaleLowerCase().includes(q)));
 const sort=$('#shop-sort').value;if(sort==='low')list.sort((a,b)=>Number(a.price)-Number(b.price));if(sort==='high')list.sort((a,b)=>Number(b.price)-Number(a.price));
 $('#shop-results').textContent=list.length+' produk dan jasa';grid.replaceChildren();
 if(!list.length){const n=el('div',null,'shop-empty');n.append(el('h2',enabled?(products.length?'Belum ada yang cocok.':'Segera hadir.'): 'Toko sedang diperbarui.'),el('p',products.length?'Coba kata kunci atau kategori lain.':'Produk digital dan layanan akan hadir di sini. Hubungi Nestiara untuk mendiskusikan kebutuhanmu.'));grid.append(n);}
 list.slice(0,limit).forEach(p=>{const card=el('article',null,'shop-card'),cover=el('div',null,'shop-cover');cover.append(el('span',(p.title||'N').slice(0,2).toUpperCase(),'shop-placeholder'));const img=image(p);if(img){img.style.position='absolute';img.style.inset='0';cover.append(img);}cover.append(el('span',kind(p),'shop-kind'));
 const body=el('div',null,'shop-card-body');body.append(el('h2',p.title),el('p',p.summary),el('strong',price(p),'shop-price'));const actions=el('div',null,'shop-card-actions');actions.append(button('Detail',()=>detail(p)),button('Tambah',()=>add(p),'shop-btn primary'));body.append(actions);card.append(cover,body);grid.append(card);});
 $('#shop-more').hidden=list.length<=limit;
 }
 function renderCart(){const lines=visibleCart(),box=$('#shop-cart-lines');box.replaceChildren();$('#shop-checkout').hidden=!lines.length||!enabled;$('#shop-order-success').hidden=true;
 if(!lines.length)box.append(el('p','Keranjangmu masih kosong. Pilih produk atau jasa terlebih dahulu.'));
 lines.forEach(({p,quantity})=>{const row=el('div',null,'shop-line'),info=el('div');info.append(el('strong',p.title),el('p',price(p)));info.append(button('Hapus',()=>{cart=cart.filter(l=>l.id!==p.id);save();renderCart();},'shop-remove'));
 const controls=el('div',null,'shop-quantity');const minus=button('−',()=>{const l=cart.find(l=>l.id===p.id);if(l.quantity>1)l.quantity--;else cart=cart.filter(l=>l.id!==p.id);save();renderCart();});minus.setAttribute('aria-label','Kurangi '+p.title);
 const plus=button('+',()=>{if(quantity<20){cart.find(l=>l.id===p.id).quantity++;save();renderCart();}});plus.setAttribute('aria-label','Tambah '+p.title);plus.disabled=quantity>=20;
 controls.append(minus,el('span',quantity),plus);row.append(info,controls);box.append(row);});
 $('#shop-total').textContent=M.money(M.total(cart,products));$('#shop-total-note').textContent=lines.some(l=>l.p.priceMode!=='fixed')?'Total di atas merupakan estimasi. Nilai penawaran atau harga mulai dikonfirmasi oleh admin.':'Belum termasuk penyesuaian layanan yang disepakati.';
 $('#shop-payment-info').textContent=store.paymentInfo;$('#shop-order-alert').textContent='';
 }
 $('#shop-cart-open').addEventListener('click',()=>{renderCart();open(cartDialog);});
 $('#shop-checkout').addEventListener('submit',async e=>{
 e.preventDefault();if(submitting||!enabled||!visibleCart().length)return;
 const alert=$('#shop-order-alert'),phone=M.phone($('#shop-customer-phone').value);if(!phone){alert.textContent='Isi nomor WhatsApp yang valid, misalnya 08... atau 62...';return;}
 if(!window.NestCMS||!NestCMS.configured()){alert.textContent='Pemesanan online belum diaktifkan. Hubungi pemilik toko melalui menu Kontak.';return;}
 if(!$('#shop-checkout').reportValidity())return;
 submitting=true;const locked=[...cartDialog.querySelectorAll('button,input,textarea')].map(n=>[n,n.disabled]);locked.forEach(([n])=>n.disabled=true);alert.textContent='Menyimpan pesanan…';
 try{
 const draft={customer_name:$('#shop-customer-name').value.trim(),customer_email:$('#shop-customer-email').value.trim(),customer_phone:phone,notes:$('#shop-customer-notes').value.trim(),items:cart.map(l=>({id:l.id,quantity:l.quantity})),terms_accepted:true};
 const key=JSON.stringify(draft);if(!requestId||lastPayloadKey!==key){requestId=crypto.randomUUID();lastPayloadKey=key;}
 receipt=await NestCMS.shopCreateOrder({request_id:requestId,...draft});
 const lines=visibleCart();const text='Halo '+store.name+', saya ingin mengonfirmasi pesanan '+receipt.order_code+'.\n\n'+lines.map(l=>l.p.title+' × '+l.quantity).join('\n')+'\nTotal estimasi: '+M.money(receipt.total)+'\nNama: '+$('#shop-customer-name').value.trim()+'\n\nMohon informasi pembayaran dan langkah selanjutnya.';
 const wa=M.phone(store.whatsapp||data.profile?.whatsapp);const success=$('#shop-order-success');success.replaceChildren(el('h3','Pesanan berhasil dicatat'),el('p','Kode pesanan: '+receipt.order_code+'\nEstimasi: '+M.money(receipt.total)+'\nPesanan belum dianggap dibayar. Admin akan mengonfirmasi detail dan pembayaran.'));
 if(wa){const a=el('a','Lanjutkan ke WhatsApp','shop-btn primary');a.href='https://wa.me/'+wa+'?text='+encodeURIComponent(text);a.target='_blank';a.rel='noopener noreferrer';success.append(a);}else success.append(el('p','Admin akan menghubungi melalui nomor atau email yang kamu isi.'));
 success.hidden=false;$('#shop-checkout').hidden=true;cart=[];save();$('#shop-cart-lines').replaceChildren();$('#shop-cart-total').hidden=true;$('#shop-checkout').reset();success.tabIndex=-1;success.focus();
 }catch(err){alert.textContent='Pesanan belum berhasil disimpan. '+(/nest_shop|function|schema cache|404|PGRST/i.test(err.message)?'Fitur pemesanan belum diaktifkan oleh admin. Hubungi pemilik toko.':err.message);alert.classList.add('error');}
 finally{submitting=false;locked.forEach(([n,disabled])=>n.disabled=disabled);}
 });
 cartDialog.addEventListener('close',()=>{$('#shop-cart-total').hidden=false;});
 $('#shop-title').textContent=store.name;$('#shop-tagline').textContent=store.tagline;$('#shop-description').textContent=store.description;$('#shop-terms').textContent=store.terms;
 [...new Set(products.map(p=>p.category).filter(Boolean))].sort().forEach(c=>{const o=el('option',c);o.value=c;$('#shop-category').append(o);});
 ['#shop-search','#shop-category','#shop-sort'].forEach(s=>$(s).addEventListener(s==='#shop-search'?'input':'change',()=>{limit=24;render();}));
 $('#shop-more').addEventListener('click',()=>{limit+=24;render();});
 window.addEventListener('hashchange',()=>{if(location.hash!=='#toko'){if(details.open)details.close();if(cartDialog.open)cartDialog.close();}});
 save();render();
})();
