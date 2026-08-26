/* MINTFORGE CART — V4 CLEAN REBUILD
   Single cart controller. No legacy cart listeners.
   - Cart button only while wallet is connected.
   - Full-screen mobile-friendly cart.
   - + / - / REMOVE are owned by this file only.
   - Disconnect clears/hides the cart immediately.
   - Uses the existing cart array and checkout functions so payments/shipping stay intact.
*/
(()=>{
 const wait=(fn,tries=300)=>{let n=0;const t=setInterval(()=>{try{if(fn()||++n>=tries)clearInterval(t)}catch(e){}},100)};
 const $=id=>document.getElementById(id);

 function connected(){
  const label=$('walletLabel');
  if(label && /wallet\s+not\s+connected/i.test(label.textContent||''))return false;
  const btn=$('connectBtn');
  if(btn && !btn.classList.contains('hidden') && /connect wallet/i.test(btn.textContent||''))return false;
  try{if(typeof wallet!=='undefined' && wallet===null)return false}catch(e){}
  return true;
 }
 function cartArray(){
  try{if(Array.isArray(window.cart))return window.cart}catch(e){}
  try{if(typeof cart!=='undefined' && Array.isArray(cart))return cart}catch(e){}
  return null;
 }
 function clearCartState(){
  const a=cartArray();if(a)a.splice(0,a.length);
  try{if(typeof window.renderCart==='function')window.renderCart()}catch(e){}
 }
 function getCartCount(){const a=cartArray();return a?a.reduce((n,x)=>n+Math.max(0,Number(x.quantity||0)),0):0}
 function hideCartButton(){const b=$('mfCartCleanButton');if(b)b.style.display='none';$('mfCartV2Button')?.remove();$('mfCartV3Button')?.remove()}
 function showCartButton(){const b=$('mfCartCleanButton');if(b)b.style.display='inline-flex'}
 function closeCart(){const c=$('cart');if(c)c.classList.remove('mf-cart-clean-open');document.body.style.overflow=''}
 function updateBadge(){const n=getCartCount(),b=$('mfCartCleanBadge'),c=$('mfCartCleanCount');if(b)b.textContent=String(n);if(c)c.textContent=`${n} ${n===1?'ITEM':'ITEMS'}`;if(n===0)closeCart()}
 function syncWallet(){if(connected())showCartButton();else{clearCartState();closeCart();hideCartButton()}updateBadge()}
 function extractId(btn){
  if(btn.dataset.mfCartId)return btn.dataset.mfCartId;
  const oc=btn.getAttribute('onclick')||'';
  const m=oc.match(/(?:changeQty|removeItem)\(\s*['\"]([^'\"]+)['\"]/);if(m)return m[1];
  const row=btn.closest('.item'),any=row?.querySelector('[onclick*="changeQty"],[onclick*="removeItem"]'),s=any?.getAttribute('onclick')||'';
  const mm=s.match(/(?:changeQty|removeItem)\(\s*['\"]([^'\"]+)['\"]/);return mm?mm[1]:'';
 }
 function prepareControls(){const box=$('cartItems');if(!box)return;box.querySelectorAll('.qty button').forEach(btn=>{const text=(btn.textContent||'').trim().toLowerCase(),id=extractId(btn);if(!id)return;btn.dataset.mfCartId=id;btn.dataset.mfCartAction=text==='remove'?'remove':(text==='+'?'plus':'minus');btn.removeAttribute('onclick');btn.type='button';btn.style.touchAction='manipulation'})}
 function install(){
  const cartEl=$('cart'),items=$('cartItems'),header=$('.header-actions');
  if(!cartEl||!items||!header||typeof window.renderCart!=='function')return false;
  if($('mfCartCleanButton'))return true;
  $('mfCartV2Button')?.remove();$('mfCartV3Button')?.remove();cartEl.classList.remove('mf-cart-v2','mf-cart-v3','open');
  const style=document.createElement('style');style.id='mf-cart-clean-css';style.textContent=`
   #cart.mf-cart-clean{position:fixed;inset:0;width:100%;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;border-radius:0;background:#08090c;z-index:100;overflow:hidden;display:none}
   #cart.mf-cart-clean.mf-cart-clean-open{display:flex;flex-direction:column}
   #cart.mf-cart-clean .mf-clean-head{display:flex;align-items:center;justify-content:space-between;padding:15px 5%;border-bottom:1px solid var(--line);background:#08090cf7;backdrop-filter:blur(14px);flex:0 0 auto}
   #cart.mf-cart-clean .mf-clean-scroll{width:min(760px,100%);margin:0 auto;padding:22px 5% 100px;overflow-y:auto;flex:1}
   #cart.mf-cart-clean .mf-clean-scroll>.topline{display:none}
   #cart.mf-cart-clean .mf-clean-scroll #cartItems{margin:0}
   #cart.mf-cart-clean .qty button{min-width:42px;min-height:40px;font-size:16px;touch-action:manipulation}
   #cart.mf-cart-clean .qty .remove{min-width:auto;padding:7px 10px;color:#ff7373}
   #mfCartCleanButton{display:inline-flex;align-items:center;gap:3px}
   #mfCartCleanBadge{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#08090c;color:var(--accent);font-size:11px;font-weight:950}
   @media(max-width:620px){#cart.mf-cart-clean .mf-clean-head{padding:13px 4%}#cart.mf-cart-clean .mf-clean-scroll{padding:18px 4% 90px}}
  `;document.head.appendChild(style);
  const scroll=document.createElement('div');scroll.className='mf-clean-scroll';while(cartEl.firstChild)scroll.appendChild(cartEl.firstChild);
  const head=document.createElement('div');head.className='mf-clean-head';head.innerHTML='<div><h2 style="margin:0">Your Cart</h2><div class="muted" style="font-size:11px;margin-top:3px" id="mfCartCleanCount">0 ITEMS</div></div><button type="button" class="close-x" id="mfCartCleanClose">×</button>';
  cartEl.append(head,scroll);cartEl.classList.add('mf-cart-clean');
  const oldClose=scroll.querySelector('.topline .close-x');if(oldClose)oldClose.remove();$('mfCartCleanClose').addEventListener('click',e=>{e.preventDefault();closeCart()});
  const button=document.createElement('button');button.id='mfCartCleanButton';button.className='secondary';button.type='button';button.innerHTML='CART <span id="mfCartCleanBadge">0</span>';button.addEventListener('click',e=>{e.preventDefault();if(!connected())return syncWallet();cartEl.classList.add('mf-cart-clean-open');document.body.style.overflow='hidden';updateBadge();prepareControls()});header.insertBefore(button,header.firstChild);
  items.addEventListener('click',e=>{const btn=e.target.closest('.qty button');if(!btn||!items.contains(btn))return;const id=btn.dataset.mfCartId||extractId(btn),action=btn.dataset.mfCartAction||'';if(!id||!action)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(action==='plus'&&typeof window.changeQty==='function')window.changeQty(id,1);if(action==='minus'&&typeof window.changeQty==='function')window.changeQty(id,-1);if(action==='remove'&&typeof window.removeItem==='function')window.removeItem(id);setTimeout(()=>{prepareControls();updateBadge()},30)},true);
  const baseRender=window.renderCart;if(!baseRender.__mfClean){const wrapped=function(){const r=baseRender.apply(this,arguments);setTimeout(()=>{prepareControls();updateBadge()},0);return r};wrapped.__mfClean=true;window.renderCart=wrapped}
  const baseAdd=window.addToCart;if(typeof baseAdd==='function'&&!baseAdd.__mfClean){const wrapped=function(id){if(!connected()){syncWallet();alert('Connect your wallet before adding items to your cart.');return}const r=baseAdd.apply(this,arguments);setTimeout(()=>{prepareControls();updateBadge();cartEl.classList.add('mf-cart-clean-open');document.body.style.overflow='hidden'},50);return r};wrapped.__mfClean=true;window.addToCart=wrapped}
  const db=$('disconnectBtn');if(db&&!db.dataset.mfCleanBound){db.dataset.mfCleanBound='1';db.addEventListener('click',()=>setTimeout(()=>{clearCartState();closeCart();syncWallet()},150),true)}
  const label=$('walletLabel');if(label)new MutationObserver(()=>syncWallet()).observe(label,{childList:true,characterData:true,subtree:true});
  const cb=$('connectBtn');if(cb)new MutationObserver(()=>syncWallet()).observe(cb,{attributes:true,childList:true,characterData:true,subtree:true});
  prepareControls();syncWallet();updateBadge();return true;
 }
 wait(install);
})();
