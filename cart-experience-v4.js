/* MINTFORGE CART — CLEAN V8
   Single cart controller. The storefront keeps one cart implementation and this
   layer owns the buyer-facing cart UI + wallet gating. It deliberately calls the
   core storefront functions (addToCart/changeQty/removeItem/renderCart) instead of
   maintaining a second cart state, preventing the old systems from fighting.
*/
(()=>{
  const $=id=>document.getElementById(id);
  const wait=(fn)=>{let n=0;const t=setInterval(()=>{try{if(fn()||++n>300)clearInterval(t)}catch(e){console.error('MINTFORGE cart init',e)}},100)};
  const connected=()=>{try{return !!window.mfIsWalletConnected?.()}catch(e){return /^connected\s*:/i.test($('walletLabel')?.textContent||'')}};
  const base=name=>typeof window[name]==='function'?window[name]:null;
  const itemId=btn=>{
    const own=btn.dataset.mfCartId;if(own)return own;
    const read=s=>String(s||'').match(/(?:changeQty|removeItem)\(\s*['\"]([^'\"]+)['\"]/i)?.[1]||'';
    return read(btn.getAttribute('onclick'))||read(btn.closest('.item')?.querySelector('[onclick*="changeQty"],[onclick*="removeItem"]')?.getAttribute('onclick'));
  };
  const count=()=>[...document.querySelectorAll('#cartItems .item')].reduce((n,item)=>{
    const m=(item.querySelector('.muted')?.textContent||'').match(/×\s*(\d+)/);return n+(m?Number(m[1]):0)
  },0);
  function closeCart(){const c=$('cart');if(c)c.classList.remove('mf-cart-v8-open','open');document.body.style.overflow=''}
  function clearCart(){
    const box=$('cartItems');if(!box)return;
    const ids=[...box.querySelectorAll('.qty button')].map(itemId).filter(Boolean);
    [...new Set(ids)].forEach(id=>{try{base('removeItem')?.(id)}catch(e){console.error(e)}});
    setTimeout(()=>{if(count()===0)closeCart();sync()},30);
  }
  function sync(){
    const b=$('mfCartV8Button');
    if(!connected()){
      if(b)b.style.display='none';
      closeCart();
      // Never leave a disconnected wallet holding buyer cart state.
      const box=$('cartItems');
      if(box && box.querySelector('.item')){
        const ids=[...box.querySelectorAll('.qty button')].map(itemId).filter(Boolean);
        [...new Set(ids)].forEach(id=>{try{base('removeItem')?.(id)}catch(e){}});
      }
    }else if(b){b.style.display='inline-flex'}
    updateBadge();
    prepareButtons();
  }
  function updateBadge(){
    const n=count(),badge=$('mfCartV8Badge'),label=$('mfCartV8Count');
    if(badge)badge.textContent=String(n);
    if(label)label.textContent=`${n} ${n===1?'ITEM':'ITEMS'}`;
    if(!n)closeCart();
  }
  function prepareButtons(){
    const root=$('cartItems');if(!root)return;
    root.querySelectorAll('.qty button').forEach(btn=>{
      const id=itemId(btn);if(!id)return;
      const txt=(btn.textContent||'').trim();
      const action=txt==='+'?'plus':(txt==='−'||txt==='-'?'minus':txt.toLowerCase()==='remove'?'remove':'');
      if(!action)return;
      btn.dataset.mfCartId=id;btn.dataset.mfCartAction=action;btn.type='button';btn.removeAttribute('onclick');
      btn.style.touchAction='manipulation';
    });
  }
  function install(){
    const cart=$('cart'),items=$('cartItems'),header=document.querySelector('.header-actions');
    if(!cart||!items||!header)return false;
    if(!$('mfCartV8CSS')){
      const s=document.createElement('style');s.id='mfCartV8CSS';s.textContent=`
#cart.mf-cart-v8{position:fixed;inset:0;width:100%;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;border-radius:0;background:#08090c;box-shadow:none;z-index:100;overflow:hidden;display:none}
#cart.mf-cart-v8.mf-cart-v8-open{display:flex;flex-direction:column}
#cart.mf-cart-v8 .mf-cart-v8-head{display:flex;align-items:center;justify-content:space-between;padding:15px 5%;border-bottom:1px solid var(--line);background:#08090cf7;backdrop-filter:blur(14px);flex:none}
#cart.mf-cart-v8 .mf-cart-v8-scroll{width:min(760px,100%);margin:0 auto;padding:22px 5% 100px;overflow-y:auto;flex:1}
#cart.mf-cart-v8 .mf-cart-v8-scroll>.topline{display:none}
#cart.mf-cart-v8 .qty{gap:8px}
#cart.mf-cart-v8 .qty button{min-width:42px;min-height:42px;font-size:16px;touch-action:manipulation}
#cart.mf-cart-v8 .qty .remove{min-width:auto;min-height:42px;padding:7px 12px;color:var(--danger)}
#mfCartV8Button{display:inline-flex;align-items:center;gap:5px}
#mfCartV8Badge{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#08090c;color:var(--accent);font-size:11px;font-weight:950}
@media(max-width:620px){#cart.mf-cart-v8 .mf-cart-v8-head{padding:14px 4%}#cart.mf-cart-v8 .mf-cart-v8-scroll{padding:18px 4% 90px}}
      `;document.head.appendChild(s);
    }
    if(!cart.classList.contains('mf-cart-v8')){
      const scroll=document.createElement('div');scroll.className='mf-cart-v8-scroll';
      while(cart.firstChild)scroll.appendChild(cart.firstChild);
      const head=document.createElement('div');head.className='mf-cart-v8-head';head.innerHTML='<div><h2 style="margin:0">Your Cart</h2><div class="muted" style="font-size:11px;margin-top:3px" id="mfCartV8Count">0 ITEMS</div></div><button type="button" class="close-x" id="mfCartV8Close">×</button>';
      cart.append(head,scroll);cart.classList.add('mf-cart-v8');
      $('mfCartV8Close').onclick=e=>{e.preventDefault();closeCart()};
    }
    if(!$('mfCartV8Button')){
      const b=document.createElement('button');b.id='mfCartV8Button';b.className='secondary';b.type='button';b.innerHTML='CART <span id="mfCartV8Badge">0</span>';
      b.onclick=e=>{e.preventDefault();if(!connected()){sync();alert('Connect your wallet before using the cart.');return}cart.classList.add('mf-cart-v8-open');document.body.style.overflow='hidden';prepareButtons();updateBadge()};
      header.insertBefore(b,header.firstChild);
    }
    if(!document.documentElement.dataset.mfCartV8Bound){
      document.documentElement.dataset.mfCartV8Bound='1';
      // One capture-level gate catches quick-add, product-detail add and any future add buttons.
      document.addEventListener('click',e=>{
        const b=e.target.closest('button');if(!b)return;
        const oc=b.getAttribute('onclick')||'';
        const addLike=/addToCart\s*\(/.test(oc)||b.classList.contains('buy')||b.id==='mfDetailCart'||b.id==='mfDetailBuy';
        if(addLike&&!connected()){
          e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();alert('Connect your wallet before adding items to your cart.');
        }
      },true);
      // Cart controls use exactly one click path. No touchend handler and no inline onclick remain.
      items.addEventListener('click',e=>{
        const b=e.target.closest('.qty button');if(!b||!items.contains(b))return;
        const id=b.dataset.mfCartId||itemId(b),action=b.dataset.mfCartAction;
        if(!id||!action)return;
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
        try{
          if(action==='plus')base('changeQty')?.(id,1);
          else if(action==='minus')base('changeQty')?.(id,-1);
          else if(action==='remove')base('removeItem')?.(id);
        }catch(err){console.error('MINTFORGE cart action failed',err)}
        setTimeout(()=>{prepareButtons();updateBadge()},50);
      },true);
      new MutationObserver(()=>{prepareButtons();updateBadge()}).observe(items,{childList:true,subtree:true});
    }
    // Wrap the existing render function once so every redraw gets clean direct controls.
    const r=base('renderCart');
    if(r&&!r.__mfCartV8){
      const wrapped=function(){const out=r.apply(this,arguments);setTimeout(()=>{prepareButtons();updateBadge();sync()},0);return out};
      wrapped.__mfCartV8=true;window.renderCart=wrapped;
    }
    // Wrap the existing add function once so wallet gating is authoritative.
    const a=base('addToCart');
    if(a&&!a.__mfCartV8){
      const wrapped=function(){if(!connected()){alert('Connect your wallet before adding items to your cart.');sync();return}const out=a.apply(this,arguments);setTimeout(()=>{prepareButtons();updateBadge();cart.classList.add('mf-cart-v8-open');document.body.style.overflow='hidden'},40);return out};
      wrapped.__mfCartV8=true;window.addToCart=wrapped;
    }
    window.mfCartSync=sync;
    window.mfCartOnDisconnect=()=>{clearCart();closeCart();sync()};
    prepareButtons();sync();updateBadge();return true;
  }
  wait(install);
})();
