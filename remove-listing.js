/* MINTFORGE REMOVE LISTING
   Adds a safe REMOVE action beside EDIT/STOCK in My Listings.
   Permanent removal is allowed only when the listing has no order history.
*/
(()=>{
  const DELETE_FN='https://zezusfnbqvijldhxoejd.supabase.co/functions/v1/delete-product';
  const esc=window.mfEsc||window.escapeHtml||((v)=>String(v??''));
  const wait=(fn,tries=120)=>{let n=0;const t=setInterval(()=>{try{if(fn()||++n>=tries)clearInterval(t)}catch(e){}},100)};
  function activeSession(){
    if(window.sessionToken)return window.sessionToken;
    const keys=['mintforge_account_session','mintforge_session','mintforge_session_token','session_token'];
    for(const k of keys){const v=sessionStorage.getItem(k)||localStorage.getItem(k);if(v)return v}
    return '';
  }
  async function removeListing(id,name){
    if(!id)return;
    const label=String(name||'this listing');
    if(!confirm(`Remove “${label}” from your store?\n\nThis permanently deletes the listing if it has no order history.`))return;
    try{
      const token=activeSession();
      if(!token)throw Error('Wallet session required. Please reconnect.');
      const r=await fetch(DELETE_FN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_token:token,product_id:id})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw Error(d.error||'Unable to remove listing.');
      if(window.sellerData?.products)window.sellerData.products=window.sellerData.products.filter(p=>p.id!==id);
      if(typeof window.renderSellerProducts==='function')window.renderSellerProducts();
      if(typeof window.loadSellerData==='function')await window.loadSellerData();
      if(typeof window.loadProducts==='function')await window.loadProducts();
      alert('Listing removed successfully.');
    }catch(e){alert(e.message||'Unable to remove listing.');}
  }
  window.removeListing=removeListing;
  function patch(){
    if(typeof window.renderSellerProducts!=='function')return false;
    if(window.renderSellerProducts.__mfRemove)return true;
    const original=window.renderSellerProducts;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      setTimeout(()=>{
        document.querySelectorAll('.product-actions').forEach(row=>{
          if(row.querySelector('.mf-remove-listing'))return;
          const card=row.closest('.product-card');
          const title=card?.querySelector('h3')?.textContent||'listing';
          const buttons=[...row.querySelectorAll('button')];
          const edit=buttons.find(b=>/EDIT/i.test(b.textContent));
          if(!edit)return;
          const m=String(edit.getAttribute('onclick')||'').match(/editListing\(['\"]([^'\"]+)['\"]\)/);
          const id=m?.[1];
          if(!id)return;
          const b=document.createElement('button');
          b.type='button';b.className='danger mf-remove-listing';b.textContent='REMOVE';
          b.onclick=()=>removeListing(id,title);
          row.appendChild(b);
        });
      },0);
      return result;
    };
    wrapped.__mfRemove=true;
    window.renderSellerProducts=wrapped;
    wrapped();
    return true;
  }
  wait(patch);
})();
