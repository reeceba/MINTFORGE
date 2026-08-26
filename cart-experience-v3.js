/* MINTFORGE CART EXPERIENCE V3
   Clean cart architecture for mobile wallet browsers.
   - Cart button only exists/appears while a wallet is connected.
   - No stale cart after disconnect.
   - + / - / REMOVE use data attributes + one delegated handler.
   - Removes inline onclick handlers that were conflicting with older patches.
   - Keeps the existing cart, shipping and checkout state/functions.
*/
(()=>{
  const wait=(fn,tries=250)=>{let n=0;const t=setInterval(()=>{try{if(fn()||++n>=tries)clearInterval(t)}catch(e){}},100)};

  function hasWallet(){
    try{return typeof wallet!=='undefined' && !!wallet}catch{return false}
  }

  function start(){
    const cartEl=document.getElementById('cart');
    const itemsEl=document.getElementById('cartItems');
    if(!cartEl||!itemsEl||typeof window.renderCart!=='function'||typeof window.changeQty!=='function'||typeof window.removeItem!=='function')return false;
    if(document.getElementById('mfCartV3Button'))return true;

    const css=document.createElement('style');
    css.id='mf-cart-v3-css';
    css.textContent=`
      #cart.mf-cart-v3{position:fixed;inset:0;right:auto;bottom:auto;width:100%;max-width:none;height:100dvh;max-height:none;border:0;border-radius:0;padding:0;background:#08090c;box-shadow:none;overflow:hidden;z-index:100;display:none}
      #cart.mf-cart-v3.open{display:flex;flex-direction:column}
      #cart.mf-cart-v3 .mf-cart-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 5%;border-bottom:1px solid #252932;background:#08090cf5;backdrop-filter:blur(14px);flex:0 0 auto}
      #cart.mf-cart-v3 .mf-cart-head h2{margin:0;font-size:24px}
      #cart.mf-cart-v3 .mf-cart-count{color:#9dff00;font-size:12px;font-weight:900;letter-spacing:.08em}
      #cart.mf-cart-v3 .mf-cart-scroll{width:min(760px,100%);margin:0 auto;padding:22px 5% 100px;overflow:auto;flex:1}
      #cart.mf-cart-v3 .mf-cart-scroll>.topline{display:none}
      #cart.mf-cart-v3 .mf-cart-scroll #cartItems{margin-top:0}
      #cart.mf-cart-v3 .item{padding:15px 0}
      #cart.mf-cart-v3 .qty button{min-width:42px;min-height:40px;font-size:16px;touch-action:manipulation;position:relative;z-index:2}
      #cart.mf-cart-v3 .qty .remove{min-width:auto;color:#ff7373}
      #cart.mf-cart-v3 .summary{margin-top:18px;padding-top:18px}
      #cart.mf-cart-v3 .shipping{margin-top:22px}
      #mfCartV3Button{position:relative}
      #mfCartV3Button.mf-hidden{display:none!important}
      #mfCartV3Badge{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;margin-left:5px;border-radius:999px;background:#08090c;color:#9dff00;font-size:11px;font-weight:900}
      @media(max-width:620px){#cart.mf-cart-v3 .mf-cart-head{padding:14px 4%}#cart.mf-cart-v3 .mf-cart-scroll{padding:18px 4% 90px}}
    `;
    document.head.appendChild(css);

    const head=document.createElement('div');
    head.className='mf-cart-head';
    head.innerHTML='<div><h2>Your Cart</h2><div class="mf-cart-count" id="mfCartCount">0 ITEMS</div></div><button class="close-x" id="mfCartClose" type="button">×</button>';
    const scroll=document.createElement('div');
    scroll.className='mf-cart-scroll';
    while(cartEl.firstChild)scroll.appendChild(cartEl.firstChild);
    cartEl.append(head,scroll);
    cartEl.classList.add('mf-cart-v3');

    const close=()=>{cartEl.classList.remove('open');document.body.style.overflow=''};
    window.closeCart=close;
    document.getElementById('mfCartClose').addEventListener('click',e=>{e.preventDefault();close()});

    const cartButton=document.createElement('button');
    cartButton.id='mfCartV3Button';
    cartButton.className='secondary mf-hidden';
    cartButton.type='button';
    cartButton.innerHTML='CART <span id="mfCartV3Badge">0</span>';
    cartButton.addEventListener('click',e=>{e.preventDefault();if(!hasWallet())return;cartEl.classList.add('open');document.body.style.overflow='hidden';updateBadge()});
    const headerActions=document.querySelector('.header-actions');
    if(headerActions)headerActions.insertBefore(cartButton,headerActions.firstChild);

    function prepareControls(){
      itemsEl.querySelectorAll('.qty button').forEach(btn=>{
        const oc=btn.getAttribute('onclick')||'';
        let id=btn.dataset.mfCartId||'';
        if(!id){
          const m=oc.match(/(?:changeQty|removeItem)\(['\"]([^'\"]+)['\"]/);
          id=m?m[1]:'';
        }
        if(!id)return;
        const text=(btn.textContent||'').trim();
        btn.dataset.mfCartId=id;
        btn.dataset.mfCartAction=text==='Remove'?'remove':(text==='+'?'plus':'minus');
        btn.removeAttribute('onclick');
        btn.type='button';
      });
    }

    itemsEl.addEventListener('click',e=>{
      const btn=e.target.closest('.qty button');
      if(!btn||!itemsEl.contains(btn))return;
      const id=btn.dataset.mfCartId||'';
      const action=btn.dataset.mfCartAction||'';
      if(!id||!action)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if(action==='plus')window.changeQty(id,1);
      else if(action==='minus')window.changeQty(id,-1);
      else if(action==='remove')window.removeItem(id);
    },true);

    const originalRender=window.renderCart;
    window.renderCart=function(){
      const r=originalRender.apply(this,arguments);
      setTimeout(()=>{prepareControls();updateBadge();syncWalletUI()},0);
      return r;
    };

    const originalAdd=window.addToCart;
    if(typeof originalAdd==='function'){
      window.addToCart=function(id){
        if(!hasWallet()){
          if(typeof window.connect==='function')window.connect();
          else alert('Connect your wallet to start a cart.');
          return;
        }
        const r=originalAdd.call(this,id);
        setTimeout(()=>{prepareControls();updateBadge();syncWalletUI()},0);
        return r;
      };
    }

    const originalConnect=window.connect;
    if(typeof originalConnect==='function'&&!originalConnect.__mfCartV3){
      const wrappedConnect=async function(){
        const r=await originalConnect.apply(this,arguments);
        syncWalletUI();
        return r;
      };
      wrappedConnect.__mfCartV3=true;
      window.connect=wrappedConnect;
    }

    const originalDisconnect=window.disconnect;
    if(typeof originalDisconnect==='function'&&!originalDisconnect.__mfCartV3){
      const wrappedDisconnect=async function(){
        const r=await originalDisconnect.apply(this,arguments);
        try{if(Array.isArray(cart))cart.length=0}catch{}
        close();
        syncWalletUI();
        try{originalRender()}catch{}
        return r;
      };
      wrappedDisconnect.__mfCartV3=true;
      window.disconnect=wrappedDisconnect;
    }

    function updateBadge(){
      let count=0;
      try{count=Array.isArray(cart)?cart.reduce((n,x)=>n+Number(x.quantity||0),0):0}catch{}
      const b=document.getElementById('mfCartV3Badge');
      const c=document.getElementById('mfCartCount');
      if(b)b.textContent=String(count);
      if(c)c.textContent=`${count} ${count===1?'ITEM':'ITEMS'}`;
      if(!hasWallet()&&cartEl.classList.contains('open'))close();
    }

    function syncWalletUI(){
      const connected=hasWallet();
      const b=document.getElementById('mfCartV3Button');
      if(b)b.classList.toggle('mf-hidden',!connected);
      if(!connected)close();
      updateBadge();
    }

    prepareControls();
    syncWalletUI();
    updateBadge();
    return true;
  }

  wait(start);
})();
