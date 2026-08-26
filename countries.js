// MINTFORGE CORE COMPATIBILITY LAYER
// This file is intentionally small and deterministic.
// Old cart/listing enhancement layers are no longer loaded here.

(function(){
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));

  // Fix the missing renderer that was aborting wallet sign-in after a
  // successful wallet connection.
  window.renderSellerOrders=function(){
    const el=document.getElementById('sellerOrders');
    if(!el)return true;
    const orders=Array.isArray(window.sellerData?.orders)?window.sellerData.orders:(typeof sellerData!=='undefined'&&Array.isArray(sellerData.orders)?sellerData.orders:[]);
    if(!orders.length){el.innerHTML='<div class="empty">No seller orders yet.</div>';return true;}
    el.innerHTML=orders.map(o=>{
      const id=String(o.id||'');
      const items=Array.isArray(o.items)?o.items:[];
      return `<div class="list-card"><div class="section-head"><div><h3>Order ${esc(id.slice(0,8).toUpperCase())}</h3><div class="order-meta">${esc(o.shipping_name||'Customer')} • ${esc(o.shipping_city||'')} ${esc(o.shipping_state||'')}</div></div><span class="pill">${esc(o.fulfilment_status||'Unfulfilled')}</span></div><div class="order-items">${items.map(i=>`${esc(i.product_name||'Product')} × ${Number(i.quantity||0)}`).join('<br>')}</div><div class="product-actions"><button class="secondary" type="button" data-order-id="${esc(id)}">VIEW ORDER</button></div></div>`;
    }).join('');
    el.querySelectorAll('[data-order-id]').forEach(btn=>btn.addEventListener('click',()=>window.openSellerOrder(btn.dataset.orderId)));
    return true;
  };

  window.renderBuyerOrders=window.renderBuyerOrders||function(){
    const el=document.getElementById('buyerOrders');
    if(el&&!el.innerHTML.trim())el.innerHTML='<div class="empty">No orders yet. Your purchases will appear here.</div>';
    return true;
  };

  // The cart belongs to the connected wallet only.
  // Disconnecting clears it completely so no stale cart can follow a wallet.
  window.mfCartOnDisconnect=function(){
    try{ cart=[]; renderCart(); }catch(e){}
    try{ closeCart(); }catch(e){
      const el=document.getElementById('cart');
      if(el)el.classList.remove('open');
    }
  };

  window.mfCartSync=function(){
    try{
      if(typeof wallet==='undefined'||!wallet){ window.mfCartOnDisconnect(); return; }
      renderCart();
    }catch(e){}
  };

  // Populate country selectors without loading another enhancement system.
  const countries=[
    ['AU','Australia'],['NZ','New Zealand'],['US','United States'],['CA','Canada'],['GB','United Kingdom'],['IE','Ireland'],['FR','France'],['DE','Germany'],['ES','Spain'],['IT','Italy'],['NL','Netherlands'],['BE','Belgium'],['AT','Austria'],['CH','Switzerland'],['SE','Sweden'],['NO','Norway'],['DK','Denmark'],['FI','Finland'],['PT','Portugal'],['PL','Poland'],['CZ','Czechia'],['GR','Greece'],['HU','Hungary'],['RO','Romania'],['UA','Ukraine'],['TR','Türkiye'],['JP','Japan'],['KR','South Korea'],['SG','Singapore'],['HK','Hong Kong'],['CN','China'],['TW','Taiwan'],['IN','India'],['ID','Indonesia'],['MY','Malaysia'],['TH','Thailand'],['VN','Vietnam'],['PH','Philippines'],['AE','United Arab Emirates'],['SA','Saudi Arabia'],['IL','Israel'],['ZA','South Africa'],['BR','Brazil'],['MX','Mexico'],['AR','Argentina'],['CL','Chile'],['CO','Colombia'],['PE','Peru']
  ];
  function fillCountries(){
    document.querySelectorAll('#shipCountry,#profileCountry').forEach(sel=>{
      if(sel.options.length>1)return;
      countries.forEach(([code,name])=>{const o=document.createElement('option');o.value=code;o.textContent=name;sel.appendChild(o)});
      if(!sel.value)sel.value='AU';
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fillCountries);else fillCountries();
})();
