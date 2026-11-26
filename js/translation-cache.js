(function(){
 'use strict';
 const config=window.NEST_CMS_CONFIG||{};
 const base=String(config.url||'').replace(/\/$/,'');
 let previousLanguage='id';
 const requests=new Map(),fetched=new Map();
 const messages={id:'',en:'Some content is still shown in its original language.',th:'เนื้อหาบางส่วนยังแสดงในภาษาต้นฉบับ','zh-CN':'部分内容仍以原始语言显示。'};
 function status(text){let n=document.getElementById('language-content-status');if(!n){n=document.createElement('span');n.id='language-content-status';n.className='language-content-status';n.setAttribute('role','status');n.setAttribute('data-no-translate','');const host=document.getElementById('language-switcher');if(host)host.append(n);}n.textContent=text;n.hidden=!text;}
 async function load(language,force=false){
  previousLanguage=language;if(language==='id'){status('');return;}
  if(!['en','th','zh-CN'].includes(language)||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base)||!config.key)return;
  if(requests.has(language))return requests.get(language);
  if(!force&&Date.now()-(fetched.get(language)||0)<60000)return;
  const task=(async()=>{
   try{
    const r=await fetch(base+'/rest/v1/rpc/nest_translation_catalog',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({target_language:language}),signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw Error('Translation cache unavailable');const result=await r.json();
    if(result&&result.translations&&typeof result.translations==='object'&&!Array.isArray(result.translations))window.NestLanguage?.register(result.translations,language);
    fetched.set(language,Date.now());
    if(window.NestLanguage?.getLanguage()===language)status(result.pending?messages[language]:'');
   }catch(_){if(window.NestLanguage?.getLanguage()===language)status(messages[language]);}
   finally{requests.delete(language);}
  })();requests.set(language,task);return task;
 }
 document.addEventListener('nest:languagechange',event=>{status('');load(event.detail.language);});
 document.addEventListener('nest:content-ready',()=>load(window.NestLanguage?.getLanguage()||'id'));
 window.addEventListener('storage',event=>{if(event.key==='nest-translations-updated')load(window.NestLanguage?.getLanguage()||previousLanguage,true);});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)load(window.NestLanguage?.getLanguage()||previousLanguage);});
 window.NestTranslationCache={refresh:()=>load(window.NestLanguage?.getLanguage()||previousLanguage,true)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(window.NestLanguage?.getLanguage()||'id'),{once:true});else load(window.NestLanguage?.getLanguage()||'id');
})();
