(function(root){
 'use strict';
 const clean=v=>typeof v==='string'?v.replace(/Nestiara\s+Lidya\s+Kakihary/gi,'Nestiara').trim().slice(0,2400):'';
 const list=v=>Array.isArray(v)?v:[];
 const words=v=>clean(v).toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+/gu)||[];
 const groups={profile:['profil','siapa','tentang','about','who','profile','แนะนำ','ประวัติ','介绍','是谁'],skills:['keahlian','skill','skills','stack','teknologi','development','programming','ทักษะ','技术','技能'],experience:['pengalaman','kerja','experience','career','work','ประสบการณ์','经验'],systems:['portfolio','portofolio','sistem','proyek','project','projects','systems','ผลงาน','项目','作品'],research:['riset','penelitian','research','academic','วิจัย','研究'],education:['pendidikan','kuliah','education','university','การศึกษา','教育'],products:['produk','jasa','layanan','harga','biaya','website','produk','toko','beli','services','price','cost','shop','products','บริการ','ราคา','商品','价格','服务'],contact:['kontak','hubungi','email','whatsapp','contact','hire','ติดต่อ','联系'],certificates:['sertifikasi','sertifikat','certificate','certification','证书','ใบรับรอง']};
 function build(data,translate=x=>x){
  data=data||{};const docs=[];const add=(kind,title,fields,url)=>{const text=fields.map(clean).filter(Boolean).map(translate).join('\n');if(!text)return;docs.push({id:'s'+docs.length,kind,title:translate(clean(title)),text,url});};const p=data.profile||{};
  add('profile','Profil Nestiara',[p.title,p.headline,p.heroDescription,p.aboutDescription,p.location],'#tentang');
  list(data.skills).forEach(x=>add('skills',x.title,[x.title,...list(x.items)],'#tentang'));
  list(data.experience).forEach(x=>add('experience',x.role,[x.period,x.role,x.company,x.description],'#pengalaman'));
  list(data.systems).forEach(x=>add('systems',x.title,[x.title,x.category,x.summary],'#portfolio'));
  list(data.games).forEach(x=>add('systems',x.title,[x.title,x.category,x.summary],'#games'));
  list(data.research).forEach(x=>add('research',x.title,[x.title,x.topic,x.type,x.summary,x.focus,x.method,x.detail,x.status],'#riset'));
  list(data.education).forEach(x=>add('education',x.level,[x.level,x.institution,x.period,x.gpa,x.thesis,x.status],'#tentang'));
  list(data.certificates).forEach(x=>add('certificates',x.title,[x.title,x.issuer,x.date],'#tentang'));
  if(data.store?.enabled!==false){
   add('products','Toko Nestiara',[data.store?.tagline,data.store?.description,data.store?.terms],'#toko');
   list(data.products).filter(x=>x.status==='active').forEach(x=>{const price=Number(x.price);const money=Number.isFinite(price)&&price>=0?new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(price):'';add('products',x.title,[x.title,x.category,x.summary,x.description,Array.isArray(x.features)?x.features.join('\n'):x.features,x.delivery,x.license,(x.priceMode==='quote'?'Harga berdasarkan penawaran':x.priceMode==='starting'?'Harga mulai: ':'Harga: ')+money],'#toko');});
  }
  add('contact','Kontak Nestiara',[p.email,p.phone,p.website],'#kontak');return docs;
 }
 function retrieve(question,docs){
  const q=clean(question).toLowerCase();const tokens=words(q).filter(x=>x.length>2&&!['yang','dan','apa','saya','anda','the','are','does','can','you','her','she','ini','itu','untuk','bisa','dengan','tentang','nestiara'].includes(x));
  const kinds=new Set();for(const[k,aliases]of Object.entries(groups))if(aliases.some(x=>/^[a-z]+$/.test(x)?new RegExp('(?:^|[^a-z])'+x+'(?:$|[^a-z])').test(q):q.includes(x)))kinds.add(k);
  if(kinds.size>1)kinds.delete('profile');
  return docs.map((d,i)=>{const title=words(d.title).join(' '),body=words(d.text).join(' ');let score=kinds.has(d.kind)?4:0;for(const t of tokens){if(title.includes(t))score+=5;else if(body.includes(t))score+=1;}if(q.includes(d.title.toLowerCase())&&d.title.length>3)score+=10;return{...d,score,i};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,3);
 }
 root.ClarraKnowledge={build,retrieve};
})(globalThis);
