(function(){
 'use strict';
 let running=false,stop=false;
 const names={en:'English',th:'Thailand','zh-CN':'China'};
 function install(){
  const editor=document.getElementById('editor');if(!editor||document.getElementById('translation-panel'))return;
  const panel=document.createElement('section');panel.id='translation-panel';panel.className='entry translation-panel';
  panel.innerHTML='<h2>Bahasa konten</h2><p>Terjemahkan deskripsi dan konten publik yang sudah diterbitkan ke English, Thailand, dan China. Hasil tersimpan dan digunakan pengunjung sesuai pilihan bahasa.</p><label class="translation-auto"><input id="translation-auto" type="checkbox"> Otomatis terjemahkan konten setelah Terbitkan</label><div class="translation-actions"><button id="translation-generate" type="button">Buat / lanjutkan terjemahan</button><button id="translation-stop" type="button" hidden>Hentikan setelah batch ini</button></div><p id="translation-progress" role="status" aria-live="polite">Konten baru diterjemahkan setelah konfigurasi layanan diaktifkan.</p>';
  editor.before(panel);
  const check=document.getElementById('translation-auto');try{check.checked=localStorage.getItem('nest-auto-translate')!=='false';}catch(_){check.checked=true;}
  check.addEventListener('change',()=>{try{localStorage.setItem('nest-auto-translate',String(check.checked));}catch(_){}});
  document.getElementById('translation-generate').addEventListener('click',run);
  document.getElementById('translation-stop').addEventListener('click',()=>{stop=true;document.getElementById('translation-stop').disabled=true;});
 }
 async function run(){
  if(running)return;install();running=true;stop=false;
  const button=document.getElementById('translation-generate'),cancel=document.getElementById('translation-stop'),note=document.getElementById('translation-progress');
  button.disabled=true;cancel.hidden=false;cancel.disabled=false;let totalSaved=0;
  try{
   for(const target of Object.keys(names)){
    let batches=0;
    while(!stop){
     note.textContent='Memproses '+names[target]+'. Terjemahan yang sudah tersimpan tidak dibuat ulang…';
     const result=await NestCMS.translationBatch(target);
     totalSaved+=result.translated||0;
     note.textContent=names[target]+': '+(result.total-result.remaining)+' dari '+result.total+' teks siap.';
     if(!result.remaining)break;
     if(!result.translated||++batches>500)throw Error('Proses berhenti agar tidak berulang. Klik lanjutkan untuk mencoba kembali.');
    }
    if(stop)break;
   }
   note.textContent=stop?'Proses dihentikan. Hasil yang sudah selesai tetap tersimpan. Klik lanjutkan untuk menyelesaikan.':'Terjemahan seluruh konten publik selesai. '+totalSaved+' teks baru diproses. Muat ulang website untuk melihat hasilnya.';
   try{localStorage.setItem('nest-translations-updated',String(Date.now()));}catch(_){}
  }catch(error){note.textContent='Konten portfolio tetap tersimpan. Terjemahan belum selesai: '+(error.name==='AbortError'?'Koneksi terlalu lama. Klik lanjutkan kembali.':error.message);}
  finally{running=false;button.disabled=false;cancel.hidden=true;cancel.disabled=false;}
 }
 window.NestTranslationAdmin={run,afterPublish(){install();if(document.getElementById('translation-auto')?.checked)run();}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 window.addEventListener('beforeunload',e=>{if(running){e.preventDefault();e.returnValue='';}});
})();
