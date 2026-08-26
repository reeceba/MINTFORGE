/* MINTFORGE BUYER EXPERIENCE
   Buyer-first storefront layer: search, categories, sorting, richer product cards,
   product detail modal, quick add and buy-now flow.
*/
(()=>{
 const wait=(fn,tries=200)=>{let n=0;const t=setInterval(()=>{try{if(fn()||++n>=tries)clearInterval(t)}catch(e){}},100)};
 const esc=window.escapeHtml||((v)=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m])));
 const $=id=>document.getElementById(id);
 let originalRender=null, query='', category='ALL', sort='featured', buyerProducts=[];
 const PUBLIC_FN='https://zezusfnbqvijldhxoejd.supabase.co/functions/v1/storefront-public';
 const API_KEY='sb_publishable_ax8du05SKISdpJQkXb3Ulw_0YJKQTjz';
 async function loadBuyerProducts(){try{const r=await fetch(PUBLIC_FN,{headers:{apikey:API_KEY}}),d=await r.json();if(Array.isArray(d.products))buyerProducts=d.products;enhanceCards()}catch(e){}}
 function injectCSS(){if($('mfBuyerCSS'))return;const s=document.createElement('style');s.id='mfBuyerCSS';s.textContent=`
 .mf-shopbar{display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:10px;margin:18px 0 20px}
 .mf-search{width:100%;background:var(--card2);border:1px solid var(--line);border-radius:13px;color:var(--text);padding:13px 15px;font:inherit}
 .mf-select{background:var(--card2);border:1px solid var(--line);border-radius:13px;color:var(--text);padding:12px 14px;font:inherit}
 .mf-cats{display:flex;gap:8px;overflow:auto;padding:2px 0 12px;margin-bottom:8px;scrollbar-width:none}
 .mf-cat{white-space:nowrap;background:#20242c;color:#fff;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:850}
 .mf-cat.active{background:var(--accent);color:#071000}
 .mf-result{font-size:12px;color:var(--muted);margin:0 0 12px}
 .mf-card{position:relative}
 .mf-product-art{height:220px;display:block;background:#0b0d11;overflow:hidden;cursor:pointer}
 .mf-product-art img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s}
 .mf-product-art:hover img{transform:scale(1.04)}
 .mf-placeholder{height:100%;display:grid;place-items:center;font-size:64px;background:radial-gradient(circle,#263500,#10130d 55%,#0c0e12)}
 .mf-card .body{padding:17px}
 .mf-card .mf-title{cursor:pointer}
 .mf-card .mf-price{font-size:19px}
 .mf-actions{display:flex;gap:8px;margin-top:12px}
 .mf-actions button{flex:1}
 .mf-view{background:#20242c;color:#fff}
 .mf-ship{font-size:11px;color:var(--muted);margin-top:8px}
 .mf-detail{width:min(900px,100%)}
 .mf-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
 .mf-detail-img{min-height:330px;border-radius:17px;overflow:hidden;background:#0b0d11;border:1px solid var(--line)}
 .mf-detail-img img{width:100%;height:100%;min-height:330px;object-fit:cover}
 .mf-detail-copy h2{font-size:36px}
 .mf-detail-price{font-size:28px;font-weight:950;margin:16px 0}
 .mf-detail-meta{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}
 .mf-detail-meta span{background:#20242c;border-radius:999px;padding:7px 9px;font-size:10px;color:var(--muted)}
 .mf-detail-desc{color:var(--muted);line-height:1.65;white-space:pre-wrap}
 .mf-detail-buy{display:flex;gap:9px;margin-top:20px}.mf-detail-buy button{flex:1}
 @media(max-width:700px){.mf-shopbar{grid-template-columns:1fr 1fr}.mf-search{grid-column:1/-1}.mf-detail-grid{grid-template-columns:1fr}.mf-detail-copy h2{font-size:28px}.mf-detail-img,.mf-detail-img img{min-height:250px}}
 `;document.head.appendChild(s)}
 function productImage(p){return p?.image_url||p?.gallery_urls?.[0]||''}
 function shippingText(p){if(!p?.shipping_required)return 'No shipping';const st=String(p.shipping_strategy||p.shipping_mode||'free');if(st==='free')return 'Free shipping';if(st==='worldwide_flat'){const au=Number(p.shipping_price||0),intl=Number(p.shipping_override_price||0);return intl>0?`AU $${au.toFixed(2)} • Intl $${intl.toFixed(2)}`:`Worldwide shipping • AU $${au.toFixed(2)}`}return `Shipping $${Number(p.shipping_price||0).toFixed(2)}`}
 function categories(){const cats=new Set(['ALL']);document.querySelectorAll('#products .card').forEach(c=>{const p=c.__mfProduct;if(p?.category)cats.add(p.category)});return [...cats]}
 function ensureControls(){if($('mfShopControls'))return;const h2=document.querySelector('#products')?.previousElementSibling;if(!h2)return;const bar=document.createElement('div');bar.id='mfShopControls';bar.innerHTML=`<div class="mf-shopbar"><input class="mf-search" id="mfSearch" placeholder="Search products…" autocomplete="off"><select class="mf-select" id="mfSort"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="newest">Newest</option></select><button class="secondary" id="mfClear">CLEAR</button></div><div class="mf-cats" id="mfCats"></div><p class="mf-result" id="mfResult"></p>`;h2.insertAdjacentElement('afterend',bar);$('mfSearch').oninput=e=>{query=e.target.value.trim().toLowerCase();filterProducts()};$('mfSort').onchange=e=>{sort=e.target.value;filterProducts()};$('mfClear').onclick=()=>{query='';category='ALL';sort='featured';$('mfSearch').value='';$('mfSort').value='featured';filterProducts()};renderCats()}
 function renderCats(){const el=$('mfCats');if(!el)return;el.innerHTML=categories().map(c=>`<button class="mf-cat ${c===category?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');el.querySelectorAll('.mf-cat').forEach(b=>b.onclick=()=>{category=b.dataset.cat;renderCats();filterProducts()})}
 function filterProducts(){const cards=[...document.querySelectorAll('#products .card')];cards.sort((a,b)=>{const pa=a.__mfProduct||{},pb=b.__mfProduct||{};if(sort==='price-low')return Number(pa.price)-Number(pb.price);if(sort==='price-high')return Number(pb.price)-Number(pa.price);if(sort==='newest')return new Date(pb.created_at||0)-new Date(pa.created_at||0);return 0});const grid=$('products');cards.forEach(c=>grid.appendChild(c));let shown=0;cards.forEach(c=>{const p=c.__mfProduct||{},text=`${p.name||''} ${p.description||''} ${p.category||''}`.toLowerCase();const ok=(!query||text.includes(query))&&(category==='ALL'||p.category===category);c.style.display=ok?'':'none';if(ok)shown++});if($('mfResult'))$('mfResult').textContent=`${shown} ${shown===1?'product':'products'} available`;renderCats()}
 function patchRender(){if(typeof window.renderProducts!=='function')return false;if(window.renderProducts.__mfBuyer)return true;originalRender=window.renderProducts;const wrapped=function(){const r=originalRender.apply(this,arguments);setTimeout(enhanceCards,0);return r};wrapped.__mfBuyer=true;window.renderProducts=wrapped;wrapped();return true}
 function enhanceCards(){
  const cards=[...document.querySelectorAll('#products .card')];
  if(!cards.length)return;
  cards.forEach(card=>{
   if(card.dataset.mfEnhanced)return;
   const p=findProduct(card);
   if(!p)return;
   card.dataset.mfEnhanced='1';card.__mfProduct=p;card.classList.add('mf-card');
   const art=card.querySelector('.art');
   if(art){art.className='mf-product-art';const src=productImage(p);art.innerHTML=src?`<img src="${esc(src)}" alt="${esc(p.name||'Product')}" loading="lazy">`:`<div class="mf-placeholder">🧪</div>`;art.onclick=()=>openDetail(p)}
   const body=card.querySelector('.body');if(!body)return;
   const h=body.querySelector('h3');if(h){h.classList.add('mf-title');h.onclick=()=>openDetail(p)}
   const row=body.querySelector('.row');
   if(row){const old=row.querySelector('button.buy');if(old){old.textContent=Number(p.stock)<1?'SOLD OUT':'QUICK ADD';old.onclick=()=>{if(typeof addToCart==='function')addToCart(p.id)}}const price=row.querySelector('b');if(price)price.classList.add('mf-price')}
   if(!body.querySelector('.mf-actions')){const actions=document.createElement('div');actions.className='mf-actions';actions.innerHTML='<button class="mf-view">VIEW PRODUCT</button>';actions.querySelector('button').onclick=()=>openDetail(p);body.appendChild(actions)}
   const stock=body.querySelector('.stock');if(stock)stock.innerHTML=`${Number(p.stock)} in stock • ${esc(shippingText(p))}`;
  });
  ensureControls();filterProducts();
 }
 function findProduct(card){const b=card.querySelector('button.buy');const m=String(b?.getAttribute('onclick')||'').match(/addToCart\(['"]([^'"]+)/);const id=m?.[1];return buyerProducts.find(p=>p.id===id)||buyerProducts.find(p=>p.name===card.querySelector('h3')?.textContent)||null}
 function ensureDetail(){if($('mfBuyerDetail'))return;const m=document.createElement('div');m.className='modal';m.id='mfBuyerDetail';m.innerHTML=`<div class="modal-card mf-detail"><div class="topline"><div><div class="eyebrow">PRODUCT</div><span id="mfDetailCat" class="muted"></span></div><button class="close-x" id="mfDetailClose">×</button></div><div class="mf-detail-grid"><div class="mf-detail-img" id="mfDetailImage"></div><div class="mf-detail-copy"><h2 id="mfDetailName">Product</h2><div class="mf-detail-price" id="mfDetailPrice">$0.00 AUD</div><div class="mf-detail-meta" id="mfDetailMeta"></div><p class="mf-detail-desc" id="mfDetailDesc"></p><div class="mf-detail-buy"><button class="secondary" id="mfDetailCart">ADD TO CART</button><button class="primary" id="mfDetailBuy">BUY NOW</button></div><div class="status" id="mfDetailStatus"></div></div></div></div>`;document.body.appendChild(m);$('mfDetailClose').onclick=()=>m.classList.remove('open')}
 function openDetail(p){ensureDetail();const m=$('mfBuyerDetail'),src=productImage(p);$('mfDetailCat').textContent=p.category||'3D PRINT';$('mfDetailName').textContent=p.name||'Product';$('mfDetailPrice').textContent=`$${Number(p.price||0).toFixed(2)} AUD`;$('mfDetailDesc').textContent=p.description||'';$('mfDetailMeta').innerHTML=`<span>${Number(p.stock||0)} in stock</span><span>${esc(shippingText(p))}</span>${p.processing_days_min!=null?`<span>Ships in ${p.processing_days_min}${p.processing_days_max&&p.processing_days_max!==p.processing_days_min?`–${p.processing_days_max}`:''} days</span>`:''}`;const box=$('mfDetailImage');box.innerHTML=src?`<img src="${esc(src)}" alt="${esc(p.name||'Product')}" loading="eager">`:`<div class="mf-placeholder">🧪</div>`;$('mfDetailCart').onclick=()=>{if(typeof addToCart==='function'){addToCart(p.id);$('mfDetailStatus').innerHTML='<span class="success">Added to cart ✓</span>'}};$('mfDetailBuy').onclick=()=>{if(typeof addToCart==='function'){addToCart(p.id);m.classList.remove('open');$('cart')?.classList.add('open')}};m.classList.add('open')}
 function start(){injectCSS();ensureDetail();loadBuyerProducts();return patchRender()}wait(start);
})();
