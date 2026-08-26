/* MINTFORGE CART EXPERIENCE V2
   - Turns the old floating cart into a proper full-screen cart section/drawer.
   - Adds a persistent CART button to the header.
   - Rebinds + / - / REMOVE using event delegation.
   - Wraps the original global cart functions so the existing checkout state is preserved.
*/
(()=>{
  const start=()=>{
    const cartEl=document.getElementById('cart');
    const itemsEl=document.getElementById('cartItems');
    if(!cartEl||!itemsEl||typeof window.renderCart!=='function')return false;
    if(document.getElementById('mfCartV2Button'))return true;

    const css=document.createElement('style');
    css.id='mf-cart-v2-css';
    css.textContent=`
      #cart.mf-cart-v2{position:fixed;inset:0;right:auto;bottom:auto;width:100%;max-width:none;height:100dvh;max-height:none;border:0;border-radius:0;padding:0;background:#08090c;box-shadow:none;overflow:hidden;z-index:100;display:none}
      #cart.mf-cart-v2.open{display:flex;flex-direction:column}
      #cart.mf-cart-v2 .mf-cart-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 5%;border-bottom:1px solid #252932;background:#08090cf5;backdrop-filter:blur(14px);flex:0 0 auto}
      #cart.mf-cart-v2 .mf-cart-head h2{margin:0;font-size:24px}
      #cart.mf-cart-v2 .mf-cart-count{color:#9dff00;font-size:12px;font-weight:900;letter-spacing:.08em}
      #cart.mf-cart-v2 .mf-cart-scroll{width:min(760px,100%);margin:0 auto;padding:22px 5% 100px;overflow:auto;flex:1}
      #cart.mf-cart-v2 .mf-cart-scroll>.topline{display:none}
      #cart.mf-cart-v2 .mf-cart-scroll #cartItems{margin-top:0}
      #cart.mf-cart-v2 .item{padding:15px 0}
      #cart.mf-cart-v2 .qty button{min-width:42px;min-height:40px;font-size:16px;touch-action:manipulation}
      #cart.mf-cart-v2 .qty .remove{min-width:auto;color:#ff7373}
      #cart.mf-cart-v2 .summary{margin-top:18px;padding-top:18px}
      #cart.mf-cart-v2 .shipping{margin-top:22px}
      #mfCartV2Button{position:relative}
      #mfCartV2Badge{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;margin-left:5px;border-radius:999px;background:#08090c;color:#9dff00;font-size:11px;font-weight:900}
      @media(max-width:620px){#cart.mf-cart-v2 .mf-cart-head{padding:14px 4%}#cart.mf-cart-v2 .mf-cart-scroll{padding:18px 4% 90px}}
    `;
    document.head.appendChild(css);

    // Build a real cart header and move the existing cart content into a scroll area.
    const originalChildren=[...cartEl.children];
    const closeBtn=originalChildren.find(x=>x.querySelector?.('.close-x'))?.querySelector('.close-x');
    const head=document.createElement('div');
    head.className='mf-cart-head';
    head.innerHTML='<div><h2>Your Cart</h2><div class="mf-cart-count" id="mfCartCount">0 ITEMS</div></div><button class="close-x" id="mfCartClose">×</button>';
    const scroll=document.createElement('div');
    scroll.className='mf-cart-scroll';
    while(cartEl.firstChild)scroll.appendChild(cartEl.firstChild);
    cartEl.append(head,scroll);
    cartEl.classList.add('mf-cart-v2');

    const oldClose=window.closeCart;
    window.closeCart=()=>{cartEl.classList.remove('open');document.body.style.overflow='';};
    document.getElementById('mfCartClose').addEventListener('click',e=>{e.preventDefault();window.closeCart();});
    if(closeBtn)closeBtn.remove();

    const open=()=>{cartEl.classList.add('open');document.body.style.overflow='hidden';updateBadge();};
    const cartButton=document.createElement('button');
    cartButton.id='mfCartV2Button';
    cartButton.className='secondary';
    cartButton.type='button';
    cartButton.innerHTML='CART <span id="mfCartV2Badge">0</span>';
    cartButton.addEventListener('click',e=>{e.preventDefault();open();});
    const headerActions=document.querySelector('.header-actions');
    if(headerActions)headerActions.insertBefore(cartButton,headerActions.firstChild);

    // Keep the existing cart state/functions, but wrap them so every UI action is followed by a fresh render.
    const originalRender=window.renderCart;
    const originalRemove=window.removeItem;
    const originalChange=window.changeQty;
    window.renderCart=function(){
      const r=originalRender.apply(this,arguments);
      setTimeout(bindControls,0);
      updateBadge();
      return r;
    };
    if(typeof originalRemove==='function'){
      window.removeItem=function(id){
        originalRemove.call(this,id);
        setTimeout(()=>{bindControls();updateBadge();},0);
      };
    }
    if(typeof originalChange==='function'){
      window.changeQty=function(id,d){
        originalChange.call(this,id,d);
        setTimeout(()=>{bindControls();updateBadge();},0);
      };
    }

    function idFrom(btn){return btn.dataset.mfCartId||''}
    function bindControls(){
      itemsEl.querySelectorAll('.qty button').forEach(btn=>{
        if(btn.dataset.mfV2==='1')return;
        const oc=btn.getAttribute('onclick')||'';
        const m=oc.match(/(?:changeQty|removeItem)\(['\"]([^'\"]+)['\"]/);
        const id=m?m[1]:'';
        if(!id)return;
        const text=(btn.textContent||'').trim();
        btn.dataset.mfCartId=id;
        btn.dataset.mfCartAction=text==='Remove'?'remove':(text==='+'?'plus':'minus');
        btn.removeAttribute('onclick');
        btn.dataset.mfV2='1';
      });
    }

    // One delegated click handler. This avoids inline onclick/touch-event conflicts on Android browsers.
    itemsEl.addEventListener('click',e=>{
      const btn=e.target.closest('.qty button');
      if(!btn||!itemsEl.contains(btn))return;
      e.preventDefault();
      e.stopPropagation();
      const id=idFrom(btn), action=btn.dataset.mfCartAction;
      if(!id)return;
      if(action==='remove'&&typeof window.removeItem==='function')window.removeItem(id);
      else if(action==='plus'&&typeof window.changeQty==='function')window.changeQty(id,1);
      else if(action==='minus'&&typeof window.changeQty==='function')window.changeQty(id,-1);
    },true);

    function updateBadge(){
      const count=Array.isArray(window.cart)?window.cart.reduce((n,x)=>n+Number(x.quantity||0),0):itemsEl.querySelectorAll('.item').length;
      const b=document.getElementById('mfCartV2Badge');
      const c=document.getElementById('mfCartCount');
      if(b)b.textContent=String(count);
      if(c)c.textContent=`${count} ${count===1?'ITEM':'ITEMS'}`;
    }

    // Existing add-to-cart opens the cart by adding the .open class; make that also lock the page.
    const originalAdd=window.addToCart;
    if(typeof originalAdd==='function'){
      window.addToCart=function(id){
        const r=originalAdd.call(this,id);
        open();
        setTimeout(bindControls,0);
        return r;
      };
    }

    bindControls();
    updateBadge();
    return true;
  };
  let tries=0;
  const timer=setInterval(()=>{if(start()||++tries>300)clearInterval(timer)},100);
})();
