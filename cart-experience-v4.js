/* MINTFORGE CART — V7 SINGLE CONTROLLER
   Uses the storefront's real wallet state instead of trying to read a lexical `let wallet`
   through window/new Function. This fixes false "wallet not connected" errors after connect.
*/
(()=>{
 const wait=(fn,tries=300)=>{let n=0;const t=setInterval(()=>{try{if(fn()||++n>=tries)clearInterval(t)}catch(e){}},100)};
 const $=id=>document.getElementById(id);
 const g=name=>{try{return window[name]}catch(e){}return null};
 const cartRef=()=>{try{const f=g('mfGetCart');if(typeof f==='function'){const a=f();if(Array.isArray(a))return a}}catch(e){}try{const a=eval('cart');if(Array.isArray(a))return a}catch(e){}return null};
 const fn=name=>{const w=g(name);return typeof w==='function'?w:null};
 function connected(){
  try{if(typeof window.mfIsWalletConnected==='function')return !!window.mfIsWalletConnected()}catch(e){}
  const label=$('walletLabel')?.textContent||'';
  return /^connected\s*:/i.test(label)||/connected/i.test($('connectBtn')?.textContent||'');
 }
 function count(){const a=cartRef();return a?a.reduce((n,x)=>n+Math.max(0,Number(x?.quantity||0)),0):0}
 function render(){const r=fn('renderCart');if(r)try{r()}catch(e){}}
 function find(id){const a=cartRef();if(!a)return -1;return a.findIndex(x=>String(x?.product_id??x?.id??'')===String(id))}
 function directQty(id,delta){const a=cartRef(),i=find(id);if(!a||i<0)return false;const p=a[i]?.product;const max=p?Number(p.stock):Infinity;a[i].quantity=Math.max(0,Math.min(max,Number(a[i].quantity||0)+delta));if(a[i].quantity<=0)a.splice(i,1);render();return true}
 function directRemove(id){const a=cartRef(),i=find(id);if(!a||i<0)return false;a.splice(i,1);render();return true}
 function itemId(btn){
  if(btn.dataset.mfCartId)return btn.dataset.mfCartId;
  const read=s=>{const m=String(s||'').match(/(?:changeQty|removeItem)\(\s*['\"]([^'\"]+)['\"]/);return m?.[1]||''};
  return read(btn.getAttribute('onclick'))||read(btn.closest('.item')?.querySelector('[onclick*="changeQty"],[onclick*="removeItem"]')?.getAttribute('onclick'));
 }
 function prepare(){
  const box=$('cartItems');if(!box)return;
  box.querySelectorAll('.qty button').forEach(b=>{
   const id=itemId(b),txt=(b.textContent||'').trim().toLowerCase();
   if(!id)return;
   b.dataset.mfCartId=id;b.dataset.mfCartAction=txt==='remove'?'remove':txt==='+'?'plus':'minus';
   b.removeAttribute('onclick');b.type='button';b.style.touchAction='manipulation';
  });
 }
 function close(){const c=$('cart');if(c)c.classList.remove('mf-cart-clean-open','open');document.body.style.overflow=''}
 function clearCart(){
  const a=cartRef();
  if(a&&a.length){a.splice(0,a.length);render();return true}
  return false;
 }
 function badge(){const n=count(),b=$('mfCartCleanBadge'),c=$('mfCartCleanCount');if(b)b.textContent=String(n);if(c)c.textContent=`${n} ${n===1?'ITEM':'ITEMS'}`;if(!n)close()}
 function sync(){
  if(!connected()){clearCart();close();const b=$('mfCartCleanButton');if(b)b.style.display='none';}
  else {const b=$('mfCartCleanButton');if(b)b.style.display='inline-flex';}
  prepare();badge();
 }
 function install(){
  const cart=$('cart'),items=$('cartItems'),header=document.querySelector('.header-actions');if(!cart||!items||!header)return false;
  if(!$('mfCartCleanButton')){
   const s=document.createElement('style');s.id='mf-cart-v7-css';s.textContent=`#cart.mf-cart-clean{position:fixed;inset:0;width:100%;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;border-radius:0;background:#08090c;z-index:100;overflow:hidden;display:none}#cart.mf-cart-clean.mf-cart-clean-open{display:flex;flex-direction:column}#cart.mf-cart-clean .mf-clean-head{display:flex;align-items:center;justify-content:space-between;padding:15px 5%;border-bottom:1px solid var(--line);background:#08090cf7;backdrop-filter:blur(14px)}#cart.mf-cart-clean .mf-clean-scroll{width:min(760px,100%);margin:0 auto;padding:22px 5% 100px;overflow-y:auto;flex:1}#cart.mf-cart-clean .mf-clean-scroll>.topline{display:none}#cart.mf-cart-clean .qty button{min-width:42px;min-height:40px;font-size:16px;touch-action:manipulation}#cart.mf-cart-clean .qty .remove{min-width:auto;padding:7px 10px;color:#ff7373}#mfCartCleanButton{display:inline-flex;align-items:center;gap:3px}#mfCartCleanBadge{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#08090c;color:var(--accent);font-size:11px;font-weight:950}`;document.head.appendChild(s);
   const scroll=document.createElement('div');scroll.className='mf-clean-scroll';while(cart.firstChild)scroll.appendChild(cart.firstChild);
   const head=document.createElement('div');head.className='mf-clean-head';head.innerHTML='<div><h2 style="margin:0">Your Cart</h2><div class="muted" style="font-size:11px;margin-top:3px" id="mfCartCleanCount">0 ITEMS</div></div><button type="button" class="close-x" id="mfCartCleanClose">×</button>';
   cart.append(head,scroll);cart.classList.add('mf-cart-clean');$('mfCartCleanClose').onclick=e=>{e.preventDefault();close()};
   const b=document.createElement('button');b.id='mfCartCleanButton';b.className='secondary';b.type='button';b.innerHTML='CART <span id="mfCartCleanBadge">0</span>';b.onclick=e=>{e.preventDefault();if(!connected()){sync();alert('Connect your wallet before using the cart.');return}cart.classList.add('mf-cart-clean-open');document.body.style.overflow='hidden';prepare();badge()};header.insertBefore(b,header.firstChild);
  }
  if(!document.documentElement.dataset.mfCartV7Bound){
   document.documentElement.dataset.mfCartV7Bound='1';
   document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    const oc=b.getAttribute('onclick')||'';
    const isAdd=/addToCart\s*\(/.test(oc)||b.classList.contains('buy')||b.id==='mfDetailCart'||b.id==='mfDetailBuy';
    if(isAdd&&!connected()){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();alert('Connect your wallet before adding items to your cart.');return false}
   },true);
   items.addEventListener('click',e=>{
    const b=e.target.closest('.qty button');if(!b||!items.contains(b))return;const id=b.dataset.mfCartId||itemId(b),act=b.dataset.mfCartAction;if(!id||!act)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(act==='plus'){const f=fn('changeQty');if(f)f(id,1);else directQty(id,1)}
    else if(act==='minus'){const f=fn('changeQty');if(f)f(id,-1);else directQty(id,-1)}
    else {const f=fn('removeItem');if(f)f(id);else directRemove(id)}
    setTimeout(()=>{prepare();badge()},80);
   },true);
  }
  window.mfCartSync=sync;
  window.mfCartOnDisconnect=()=>{clearCart();sync()};
  const r=fn('renderCart');if(r&&!r.__mfCartV7){const w=function(){const out=r.apply(this,arguments);setTimeout(()=>{prepare();badge();sync()},0);return out};w.__mfCartV7=true;window.renderCart=w}
  const add=fn('addToCart');if(add&&!add.__mfCartV7){const w=function(){if(!connected()){sync();alert('Connect your wallet before adding items to your cart.');return}const out=add.apply(this,arguments);setTimeout(()=>{prepare();badge();cart.classList.add('mf-cart-clean-open');document.body.style.overflow='hidden'},40);return out};w.__mfCartV7=true;window.addToCart=w}
  prepare();sync();badge();return true;
 }
 wait(install);
})();
