/* MINTFORGE CART CONTROLS FIX
   Makes cart + / - / Remove controls reliable on mobile wallet browsers.
   Rebinds controls after every cart render and removes fragile inline handlers.
*/
(()=>{
  const wait=(fn,tries=240)=>{let n=0;const t=setInterval(()=>{try{if(fn()||++n>=tries)clearInterval(t)}catch(e){}},100)};

  function bind(){
    if(typeof window.renderCart!=='function' || !document.getElementById('cartItems')) return false;
    if(window.renderCart.__mfCartFix) return true;

    const originalRender=window.renderCart;
    const bindButtons=()=>{
      const root=document.getElementById('cartItems');
      if(!root)return;
      root.querySelectorAll('.qty button').forEach(btn=>{
        const text=(btn.textContent||'').trim().toLowerCase();
        const row=btn.closest('.item');
        if(!row)return;
        const buttons=[...row.querySelectorAll('.qty button')];
        const productId=buttons[0]?.getAttribute('onclick')?.match(/changeQty\(['\"]([^'\"]+)/)?.[1]
          || buttons[2]?.getAttribute('onclick')?.match(/removeItem\(['\"]([^'\"]+)/)?.[1];
        if(!productId)return;
        btn.removeAttribute('onclick');
        if(btn.dataset.mfBound)return;
        btn.dataset.mfBound='1';
        btn.addEventListener('click',e=>{
          e.preventDefault();
          e.stopPropagation();
          if(text==='−' || text==='-') window.changeQty(productId,-1);
          else if(text==='+') window.changeQty(productId,1);
          else if(text==='remove') window.removeItem(productId);
        });
      });
    };

    const wrapped=function(){
      const result=originalRender.apply(this,arguments);
      bindButtons();
      return result;
    };
    wrapped.__mfCartFix=true;
    window.renderCart=wrapped;

    bindButtons();
    return true;
  }

  wait(bind);
})();
