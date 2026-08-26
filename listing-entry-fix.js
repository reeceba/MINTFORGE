(function(){
  function bindSave(){
    const b=document.getElementById('saveListing');
    if(!b)return;
    b.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      try{
        if(typeof window.saveListing==='function') return window.saveListing();
      }catch(err){
        console.error('MINTFORGE listing save:',err);
        const s=document.getElementById('listingStatusText');
        if(s)s.innerHTML='<span class="error">Could not save listing. Please try again.</span>';
      }
    };
  }
  function fallbackOpen(){
    const modal=document.getElementById('listingModal');
    if(!modal)return;
    modal.classList.add('open');
    const ids=['listingName','listingDescription','listingSku','listingLength','listingWidth','listingHeight','listingProcMin','listingProcMax'];
    ids.forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v};
    set('listingCategory','3D Print');set('listingPrice',0);set('listingStock',0);set('listingWeight',0);set('listingCurrency','AUD');set('listingStatus','Draft');set('mfShipStrategy','profile');set('mfShipPrice',0);
    const t=document.getElementById('listingTitle');if(t)t.textContent='New Listing';
    const w=document.getElementById('listingWallet');if(w&&window.wallet)w.textContent=window.wallet.slice(0,6)+'...'+window.wallet.slice(-4);
    bindSave();
  }
  function bind(){
    const b=document.getElementById('newListingBtn');
    if(b){
      b.onclick=function(e){
        e.preventDefault();
        e.stopPropagation();
        try{
          if(typeof window.newListing==='function'){
            window.newListing();
            setTimeout(bindSave,0);
            setTimeout(bindSave,50);
            return;
          }
        }catch(err){console.warn('MINTFORGE listing opener fallback:',err)}
        fallbackOpen();
      };
    }
    bindSave();
  }
  function loadUpgradeThenBind(){
    if(!document.querySelector('script[data-mintforge-listing-upgrade]')){
      const s=document.createElement('script');
      s.src='./listing-upgrade.js';
      s.dataset.mintforgeListingUpgrade='1';
      s.onload=function(){bind();setTimeout(bindSave,50);};
      s.onerror=function(){bind();};
      document.body.appendChild(s);
    }
    bind();
    setTimeout(bind,100);
    setTimeout(bind,500);
    setTimeout(bindSave,100);
    setTimeout(bindSave,500);
    const obs=new MutationObserver(()=>{bindSave();});
    obs.observe(document.body,{subtree:true,childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadUpgradeThenBind);else loadUpgradeThenBind();
})();
