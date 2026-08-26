// MINTFORGE worldwide country/listing/variant/cart upgrade loader
// Compatibility guard: account sign-in can call this before an older seller-order renderer exists.
// Keep the account flow alive rather than allowing a missing optional renderer to abort wallet sign-in.
window.renderSellerOrders=window.renderSellerOrders||function(){
  const el=document.getElementById('sellerOrders');
  if(el&&!el.innerHTML.trim()) el.innerHTML='<div class="empty">No seller orders yet.</div>';
  return true;
};
window.renderBuyerOrders=window.renderBuyerOrders||function(){
  const el=document.getElementById('buyerOrders');
  if(el&&!el.innerHTML.trim()) el.innerHTML='<div class="empty">No orders yet. Your purchases will appear here.</div>';
  return true;
};
['listing-upgrade.js','variant-shop.js','soldout-fix.js','shipping-fix.js','worldwide-final.js','simple-shipping.js','remove-listing.js','buyer-experience.js','cart-experience-v4.js'].forEach(src=>{const s=document.createElement('script');s.src='./'+src+'?v=20260826-13';s.defer=false;document.head.appendChild(s)});
