/* MINTFORGE CART CONTROLS — DIRECT DOM FIX
   The original cart is rendered with inline onclick attributes. Previous delegated
   patches were too fragile in wallet/mobile browsers. This version replaces the
   generated cart buttons with direct DOM handlers every time the cart renders.
*/
(()=>{
  const getId=(btn)=>{
    const oc=btn.getAttribute('onclick')||'';
    const m=oc.match(/(?:changeQty|removeItem)\(['\"]([^'\"]+)['\"]/);
    return m?m[1]:null;
  };
  const install=()=>{
    const root=document.getElementById('cartItems');
    if(!root)return false;
    const buttons=root.querySelectorAll('.item .qty button');
    buttons.forEach(btn=>{
      if(btn.dataset.mfDirectCart==='1')return;
      const id=getId(btn);
      if(!id)return;
      const text=(btn.textContent||'').trim().toLowerCase();
      let action=text==='remove'?'remove':(text==='+'?'plus':(text==='−'||text==='-'?'minus':null));
      if(!action)return;
      btn.dataset.mfDirectCart='1';
      btn.dataset.mfCartId=id;
      btn.dataset.mfCartAction=action;
      btn.removeAttribute('onclick');
      btn.onclick=(ev)=>{
        ev.preventDefault();
        ev.stopPropagation();
        try{
          if(action==='remove'){
            if(typeof window.removeItem==='function') window.removeItem(id);
          }else if(typeof window.changeQty==='function'){
            window.changeQty(id,action==='plus'?1:-1);
          }
        }catch(err){console.error('MINTFORGE cart control failed',err);}
        return false;
      };
      btn.addEventListener('touchend',ev=>{
        ev.preventDefault();
        ev.stopPropagation();
        btn.click();
      },{passive:false});
    });
    return true;
  };

  const rootReady=()=>{
    const root=document.getElementById('cartItems');
    if(!root)return false;
    if(!root.dataset.mfObserver){
      root.dataset.mfObserver='1';
      new MutationObserver(()=>install()).observe(root,{childList:true,subtree:true});
    }
    install();
    return true;
  };

  let tries=0;
  const timer=setInterval(()=>{
    if(rootReady()||++tries>300)clearInterval(timer);
  },100);
})();
