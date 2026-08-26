/* MINTFORGE CART CONTROLS — HARDENED
   The cart itself lives in index.html, so this patch deliberately does not
   depend on fragile inline onclick handlers. It decorates each cart button
   with a stable product id and handles touch/click events at document level.
*/
(()=>{
  const boot=()=>{
    if(document.documentElement.dataset.mfCartHardFix==='1') return true;
    const root=document.getElementById('cartItems');
    if(!root || typeof window.changeQty!=='function' || typeof window.removeItem!=='function') return false;

    document.documentElement.dataset.mfCartHardFix='1';

    const decorate=()=>{
      const items=root.querySelectorAll('.item');
      items.forEach(row=>{
        const qty=row.querySelector('.qty');
        if(!qty)return;
        const controls=[...qty.querySelectorAll('button')];
        let id=null;
        for(const b of controls){
          const oc=b.getAttribute('onclick')||'';
          const m=oc.match(/(?:changeQty|removeItem)\(['\"]([^'\"]+)['\"]/);
          if(m){id=m[1];break;}
        }
        if(!id)return;
        controls.forEach(b=>{
          const text=(b.textContent||'').trim();
          if(text==='−'||text==='-' ) b.dataset.mfCartAction='minus';
          else if(text==='+') b.dataset.mfCartAction='plus';
          else if(text.toLowerCase()==='remove') b.dataset.mfCartAction='remove';
          b.dataset.mfProductId=id;
          // Remove the inline handler so there is exactly one execution path.
          b.removeAttribute('onclick');
        });
      });
    };

    // Observe every cart re-render and decorate the newly-created buttons.
    new MutationObserver(decorate).observe(root,{childList:true,subtree:true});
    decorate();

    const handle=(e)=>{
      const btn=e.target.closest?.('#cartItems button[data-mf-cart-action]');
      if(!btn)return;
      const id=btn.dataset.mfProductId;
      const action=btn.dataset.mfCartAction;
      if(!id||!action)return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      try{
        if(action==='minus') window.changeQty(id,-1);
        else if(action==='plus') window.changeQty(id,1);
        else if(action==='remove') window.removeItem(id);
      }catch(err){console.error('MINTFORGE cart control error',err);}
    };

    // Capture phase handles taps before wallet/browser click quirks can interfere.
    document.addEventListener('click',handle,true);
    document.addEventListener('pointerup',handle,true);
    document.addEventListener('touchend',handle,true);
    return true;
  };

  let tries=0;
  const timer=setInterval(()=>{
    if(boot()||++tries>300) clearInterval(timer);
  },100);
})();
