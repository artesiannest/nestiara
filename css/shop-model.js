(function(){
 'use strict';
 const defaults={enabled:true,name:'Toko Nestiara',tagline:'Produk digital dan layanan untuk ide berikutnya.',description:'Temukan produk digital dan jasa yang sesuai kebutuhanmu. Diskusikan detail pekerjaan sebelum pesanan dikonfirmasi.',whatsapp:'',email:'',terms:'Harga jasa mengikuti ruang lingkup yang disepakati. Produk digital dikirim secara manual setelah pembayaran dikonfirmasi.',paymentInfo:'Informasi pembayaran diberikan setelah pesanan dikonfirmasi.'};
 function normalize(data){
  data.store=Object.assign({},defaults,data.store||{});
  if(!Array.isArray(data.products))data.products=[];
  return data;
 }
 function available(p){return p&&p.status==='active'&&/^[a-zA-Z0-9_-]{1,80}$/.test(p.id||'')&&String(p.title||'').trim()&&Number.isSafeInteger(Number(p.price))&&Number(p.price)>=0;}
 function phone(value){let n=String(value||'').replace(/[^0-9]/g,'');if(n.startsWith('0'))n='62'+n.slice(1);return /^[1-9]\d{7,14}$/.test(n)?n:'';}
 function total(lines,products){return lines.reduce((sum,l)=>{const p=products.find(p=>p.id===l.id&&available(p));return sum+(p?Number(p.price)*l.quantity:0);},0);}
 window.NestShopModel={normalize,available,phone,total,money:n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0)};
})();
