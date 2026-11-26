(function () {
  'use strict';
  const languages = {
    id: { code: 'ID', label: 'Bahasa Indonesia', flag: 'id' },
    en: { code: 'EN', label: 'English', flag: 'gb' },
    th: { code: 'TH', label: 'Thailand · ไทย', flag: 'th' },
    'zh-CN': { code: '中文', label: 'China · 中文', flag: 'cn' }
  };
  const key = 'nestiara-language-v1';
  let language = 'id';
  try { const saved = localStorage.getItem(key); if (languages[saved]) language = saved; } catch (_) {}
  const textSources = new WeakMap(), attributeSources = new WeakMap();
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  const skip = 'script,style,textarea,code,pre,svg,[contenteditable="true"],[data-no-translate],.language-switcher';
  function flag(country) {
    const shapes = {
      id: '<path fill="#fff" d="M0 0h30v20H0z"/><path fill="#e63838" d="M0 0h30v10H0z"/>',
      gb: '<path fill="#183d83" d="M0 0h30v20H0z"/><path stroke="#fff" stroke-width="5" d="m0 0 30 20M30 0 0 20"/><path stroke="#d52b36" stroke-width="2" d="m0 0 30 20M30 0 0 20"/><path stroke="#fff" stroke-width="7" d="M15 0v20M0 10h30"/><path stroke="#d52b36" stroke-width="4" d="M15 0v20M0 10h30"/>',
      th: '<path fill="#cf2838" d="M0 0h30v20H0z"/><path fill="#fff" d="M0 3.33h30v13.34H0z"/><path fill="#27316e" d="M0 6.67h30v6.66H0z"/>',
      cn: '<path fill="#de2910" d="M0 0h30v20H0z"/><g fill="#ffde00"><path d="m5 2 1 3h3L6.6 7l.9 3L5 8.2 2.5 10l.9-3L1 5h3z"/><path d="m10 1 .45 1.2 1.3.05-1 .8.35 1.25-1.1-.7-1.05.75.3-1.3-1.05-.75 1.3-.1z"/><path d="m13 4 .45 1.2 1.3.05-1 .8.35 1.25-1.1-.7-1.05.75.3-1.3-1.05-.75 1.3-.1z"/><path d="m13 8 .45 1.2 1.3.05-1 .8.35 1.25-1.1-.7-1.05.75.3-1.3-1.05-.75 1.3-.1z"/><path d="m10 11 .45 1.2 1.3.05-1 .8.35 1.25-1.1-.7-1.05.75.3-1.3-1.05-.75 1.3-.1z"/></g>'
    };
    return '<svg class="language-flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false">' + shapes[country] + '</svg>';
  }
  let reverseDictionary=null,reverseDictionarySource=null,reverseDictionarySize=0;
  function canonical(source){
    const dictionary=window.NEST_TRANSLATIONS||{};
    const size=Object.keys(dictionary).length;
    if(reverseDictionarySource!==dictionary||reverseDictionarySize!==size){
      reverseDictionary=new Map();reverseDictionarySource=dictionary;reverseDictionarySize=size;
      for(const [original,translations] of Object.entries(dictionary)){
        reverseDictionary.set(normalize(original),original);
        for(const value of Object.values(translations||{}))if(typeof value==='string'&&!reverseDictionary.has(normalize(value)))reverseDictionary.set(normalize(value),original);
      }
    }
    const original=reverseDictionary.get(normalize(source));
    return original?source.match(/^\s*/)[0]+original+source.match(/\s*$/)[0]:source;
  }
  function translate(source) {
    source=canonical(String(source??''));
    if (language === 'id') return source;
    const text = normalize(source);
    const dict = window.NEST_TRANSLATIONS || {};
    let output = dict[text] && dict[text][language];
    if (!output) {
      const counters = [
        [/^(\d+) dari (\d+) game$/, {en:'$1 of $2 games',th:'$1 จาก $2 เกม','zh-CN':'$1 / $2 个游戏'}],
        [/^Mulai (Rp.*)$/, {en:'From $1',th:'เริ่มต้น $1','zh-CN':'起价 $1'}],
        [/^(\d+) produk dan jasa$/, {en:'$1 products and services',th:'$1 สินค้าและบริการ','zh-CN':'$1 项产品和服务'}],
        [/^(\d+) sistem · (\d+) (screenshot|tampilan)$/, {en:'$1 systems · $2 screenshots',th:'$1 ระบบ · $2 ภาพหน้าจอ','zh-CN':'$1 个系统 · $2 张截图'}],
        [/^(\d+) sistem\.$/, {en:'$1 systems.',th:'$1 ระบบ','zh-CN':'$1 个系统。'}],
        [/^(\d+) sistem$/, {en:'$1 systems',th:'$1 ระบบ','zh-CN':'$1 个系统'}],
        [/^(\d+) riset(?: akademik)?$/, {en:'$1 research works',th:'$1 งานวิจัย','zh-CN':'$1 项研究'}],
        [/^(\d+) game$/, {en:'$1 games',th:'$1 เกม','zh-CN':'$1 个游戏'}],
        [/^(\d+) (?:dari|\/) (\d+) sistem$/, {en:'$1 of $2 systems',th:'$1 จาก $2 ระบบ','zh-CN':'$1 / $2 个系统'}],
        [/^IPK (.*)$/, {en:'GPA $1',th:'เกรดเฉลี่ย $1','zh-CN':'平均绩点 $1'}],
        [/^Versi (\d+) · Konten sesuai publikasi terakhir$/, {en:'Version $1 · Content matches the latest publication',th:'เวอร์ชัน $1 · เนื้อหาตรงกับการเผยแพร่ล่าสุด','zh-CN':'版本 $1 · 内容与最新发布一致'}],
        [/^Memproses (.+)\. Terjemahan yang sudah tersimpan tidak dibuat ulang…$/, {en:'Processing $1. Saved translations are reused…',th:'กำลังประมวลผล $1 โดยใช้คำแปลที่บันทึกไว้…','zh-CN':'正在处理 $1，已有翻译将被重复使用…'}],
        [/^(.+): (\d+) dari (\d+) teks siap\.$/, {en:'$1: $2 of $3 texts ready.',th:'$1: ข้อความพร้อมแล้ว $2 จาก $3','zh-CN':'$1：$3 段文本中已有 $2 段完成。'}],
        [/^Terjemahan seluruh konten publik selesai\. (\d+) teks baru diproses\. Muat ulang website untuk melihat hasilnya\.$/, {en:'Public content translation is complete. $1 new texts processed. Reload the website to see the results.',th:'แปลเนื้อหาสาธารณะเสร็จแล้ว ประมวลผลข้อความใหม่ $1 รายการ โหลดเว็บไซต์ใหม่เพื่อดูผลลัพธ์','zh-CN':'公开内容翻译完成，已处理 $1 段新文本。请刷新网站查看结果。'}]
      ];
      for (const [pattern, values] of counters) if (pattern.test(text)) { output = text.replace(pattern,values[language]); break; }
      if (!output) {
        const numbered = text.match(/^(.*?) (\d+)$/);
        if (numbered && dict[numbered[1]]?.[language]) output = dict[numbered[1]][language] + ' ' + numbered[2];
      }
      if (!output && /^(?:Kamar Nest|Kamar Nestiara|Tentang & Pengalaman|Portfolio Sistem|Riset Akademik|Kontak|Games|Toko Nestiara) [—|] Nestiara(?: Lidya Kakihary)?$/.test(text)) {
        const base = text.split(/ [—|] /)[0];
        const name = base.startsWith('Kamar') ? ({en:'Room',th:'ห้องทำงาน','zh-CN':'工作室'})[language] : (dict[base]?.[language] || base);
        output = name + ' | Nestiara';
      }
    }
    if(!output){
      const prefixed=text.match(/^(Jenis|Pengiriman \/ pengerjaan|Lisensi \/ ketentuan|Termasuk|Tugas akhir):\s*(.*)$/);
      if(prefixed){const labels={en:{Jenis:'Type','Pengiriman / pengerjaan':'Delivery / turnaround','Lisensi / ketentuan':'License / terms',Termasuk:'Includes','Tugas akhir':'Thesis'},th:{Jenis:'ประเภท','Pengiriman / pengerjaan':'การจัดส่ง / ระยะเวลาดำเนินงาน','Lisensi / ketentuan':'สิทธิ์การใช้งาน / เงื่อนไข',Termasuk:'รวม','Tugas akhir':'วิทยานิพนธ์'},'zh-CN':{Jenis:'类型','Pengiriman / pengerjaan':'交付或工期','Lisensi / ketentuan':'许可或条款',Termasuk:'包含','Tugas akhir':'毕业论文'}};output=labels[language][prefixed[1]]+': '+translate(prefixed[2]);}
    }
    if(!output){
      const labels={en:{'Kode pesanan':'Order code','Estimasi':'Estimate','Estimasi total':'Estimated total','Catatan pelanggan':'Customer note'},th:{'Kode pesanan':'รหัสคำสั่งซื้อ','Estimasi':'ประมาณการ','Estimasi total':'ยอดรวมโดยประมาณ','Catatan pelanggan':'หมายเหตุของลูกค้า'},'zh-CN':{'Kode pesanan':'订单编号','Estimasi':'估算','Estimasi total':'预计总额','Catatan pelanggan':'客户备注'}};
      const prefix=text.match(/^(Kode pesanan|Estimasi total|Estimasi):\s*(.*)$/);
      if(prefix)output=labels[language][prefix[1]]+': '+prefix[2];
      const numbered=text.match(/^(\d+\.)\s+(.+)$/);if(!output&&numbered)output=numbered[1]+' '+translate(numbered[2]);
      const add=text.match(/^\+ Tambah (.+)$/);if(!output&&add)output='+ '+translate('Tambah')+' '+translate(add[1]);
      if(!output&&source.includes('\n')){
        const lines=source.split('\n');const result=lines.map(line=>line.trim()?translate(line):line).join('\n');
        if(result!==source)return result;
      }
    }
    if (!output) return source;
    const before = source.match(/^\s*/)[0], after = source.match(/\s*$/)[0];
    return before + output + after;
  }
  function translateText(node) {
    if (!node.parentElement || node.parentElement.closest(skip)) return;
    let record = textSources.get(node);
    if (!record || node.nodeValue !== record.output) record = { source: node.nodeValue, output: node.nodeValue };
    const output = translate(record.source);
    if (node.nodeValue !== output) node.nodeValue = output;
    record.output = output; textSources.set(node,record);
  }
  function translateAttributes(el) {
    if (el.closest(skip)) return;
    let records = attributeSources.get(el) || {};
    for (const name of ['placeholder','title','aria-label','alt']) {
      if (!el.hasAttribute(name)) continue;
      const value=el.getAttribute(name);
      let record=records[name];
      if (!record || value!==record.output) record={source:value,output:value};
      const output=translate(record.source);
      if (value!==output) el.setAttribute(name,output);
      record.output=output;records[name]=record;
    }
    attributeSources.set(el,records);
  }
  const observer = new MutationObserver(() => {
    if (apply.timer) return;
    apply.timer=setTimeout(() => {apply.timer=null;apply();},20);
  });
  const observe=()=>observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','alt']});
  function apply() {
    observer.disconnect();
    document.documentElement.lang=language;
    const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);
    let node;while ((node=walker.nextNode())) translateText(node);
    document.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(translateAttributes);
    observe();
  }
  function setLanguage(value) {
    if (!languages[value]) return;
    language=value;
    try {localStorage.setItem(key,language);} catch (_) {}
    const item=languages[language];
    const selected=document.getElementById('language-current');
    if (selected) selected.innerHTML=flag(item.flag)+'<span>'+item.code+'</span><span class="language-chevron" aria-hidden="true">⌄</span>';
    document.querySelectorAll('[data-language]').forEach(button=>{
      const active=button.dataset.language===language;
      button.setAttribute('aria-pressed',String(active));
      button.classList.toggle('selected',active);
    });
    apply();
    document.dispatchEvent(new CustomEvent('nest:languagechange',{detail:{language}}));
  }
  function init() {
    const host=document.getElementById('language-switcher');
    if (!host) return;
    host.innerHTML='<summary id="language-current" aria-label="Choose language / Pilih bahasa"></summary><div class="language-options" role="group" aria-label="Language / Bahasa">'+Object.entries(languages).map(([key,item])=>'<button type="button" data-language="'+key+'" lang="'+key+'">'+flag(item.flag)+'<span>'+item.label+'</span><span class="language-check" aria-hidden="true">✓</span></button>').join('')+'</div>';
    host.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{setLanguage(button.getAttribute('data-language'));host.open=false;host.querySelector('summary').focus();}));
    document.addEventListener('click',event=>{if(!host.contains(event.target))host.open=false;});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&host.open){host.open=false;host.querySelector('summary').focus();}});
    const summary=host.querySelector('summary');
    const panel=host.querySelector('.language-options');
    function position(){
      summary.setAttribute('aria-expanded',String(host.open));
      if(!host.open)return;
      const box=summary.getBoundingClientRect();
      panel.style.left=Math.max(12,Math.min(box.right-248,window.innerWidth-260))+'px';
      panel.style.top=(box.bottom+10)+'px';
      panel.style.maxHeight=Math.max(120,window.innerHeight-box.bottom-24)+'px';
    }
    host.addEventListener('toggle',position);
    window.addEventListener('resize',position);
    window.addEventListener('scroll',position,{passive:true});
    setLanguage(language);
  }
  window.addEventListener('hashchange',()=>{clearTimeout(apply.routeTimer);apply.routeTimer=setTimeout(apply,0);});
  window.addEventListener('pageshow',()=>apply());
  window.addEventListener('storage',event=>{if(event.key===key&&languages[event.newValue])setLanguage(event.newValue);});
  document.addEventListener('nest:content-ready',()=>apply());
  function register(entries,target){
    if(!['en','th','zh-CN'].includes(target)||!entries||typeof entries!=='object')return;
    const dict=window.NEST_TRANSLATIONS||(window.NEST_TRANSLATIONS={});
    for(const [source,text] of Object.entries(entries)){
      if(typeof text!=='string'||!text.trim()||['__proto__','constructor','prototype'].includes(source))continue;
      const key=normalize(source);const prior=Object.hasOwn(dict,key)?dict[key]:{};
      Object.defineProperty(dict,key,{value:Object.assign({},prior,{[target]:text}),writable:true,enumerable:true,configurable:true});
    }
    reverseDictionarySource=null;apply();
  }
  window.NestLanguage={setLanguage,translate,getLanguage:()=>language,refresh:apply,register};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
