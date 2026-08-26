// MINTFORGE compatibility + worldwide country/listing/variant/cart loader
// Keep core account functions available even if an optional enhancement script
// loads late. This prevents wallet sign-in from being aborted by UI renderers.
window.renderSellerOrders=window.renderSellerOrders||function(){
  const el=document.getElementById('sellerOrders');
  if(!el)return true;
  let orders=[];
  try{const s=eval('sellerData');orders=Array.isArray(s?.orders)?s.orders:[]}catch(e){}
  if(!orders.length){el.innerHTML='<div class="empty">No seller orders yet.</div>';return true;}
  const esc=window.escapeHtml||((v)=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  el.innerHTML=orders.map(o=>`<div class="list-card"><div class="section-head"><div><h3>Order ${esc(String(o.id||'').slice(0,8).toUpperCase())}</h3><div class="order-meta">${esc(o.shipping_name||'Customer')} • ${esc(o.shipping_city||'')} ${esc(o.shipping_state||'')}</div></div><span class="pill">${esc(o.fulfilment_status||'Unfulfilled')}</span></div><div class="order-items">${(o.items||[]).map(i=>`${esc(i.product_name||'Product')} × ${Number(i.quantity||0)}`).join('<br>')}</div><div class="product-actions"><button class="secondary" type="button" onclick="openSellerOrder('${esc(o.id||'')}')">VIEW ORDER</button></div></div>`).join('');
  return true;
};
window.renderBuyerOrders=window.renderBuyerOrders||function(){
  const el=document.getElementById('buyerOrders');
  if(el&&!el.innerHTML.trim())el.innerHTML='<div class="empty">No orders yet. Your purchases will appear here.</div>';
  return true;
};

// Load the enhancement layers in a deterministic order. The cart-controls-fix
// is intentionally last so it owns the mobile +/-/Remove buttons after every
// cart re-render.
['listing-upgrade.js','variant-shop.js','soldout-fix.js','shipping-fix.js','worldwide-final.js','simple-shipping.js','remove-listing.js','buyer-experience.js','cart-experience-v4.js','cart-controls-fix.js'].forEach(src=>{
  const s=document.createElement('script');
  s.src='./'+src+'?v=20260826-14';
  s.defer=false;
  document.head.appendChild(s);
});
