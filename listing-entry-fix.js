(function(){
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
  }
  function bind(){
    const b=document.getElementById('newListingBtn');
    if(!b)return;
    b.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      try{
        if(typeof window.newListing==='function'){
          window.newListing();
          return;
        }
      }catch(err){console.warn('MINTFORGE listing opener fallback:',err)}
      fallbackOpen();
    };
  }
  function loadUpgradeThenBind(){
    if(!document.querySelector('script[data-mintforge-listing-upgrade]')){
      const s=document.createElement('script');
      s.src='./listing-upgrade.js';
      s.dataset.mintforgeListingUpgrade='1';
      s.onload=bind;
      s.onerror=bind;
      document.body.appendChild(s);
    }
    bind();
    setTimeout(bind,100);
    setTimeout(bind,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadUpgradeThenBind);else loadUpgradeThenBind();
})();
