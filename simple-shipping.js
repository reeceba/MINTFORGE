/* MINTFORGE SIMPLE SHIPPING
   Three seller options only: FREE SHIPPING, FLAT RATE, WORLDWIDE FLAT RATE.
   Legacy profile/zone listings remain supported by the backend, but are no longer offered for new listings.
*/
(() => {
  const wait=(fn,tries=100)=>{let n=0;const t=setInterval(()=>{try{if(fn()||++n>=tries)clearInterval(t)}catch(e){}},100)};
  const esc=window.escapeHtml||((v)=>String(v??''));
  const $=id=>document.getElementById(id);
  const countryCode=()=>String($('shipCountry')?.selectedOptions?.[0]?.dataset?.countryCode||'').toUpperCase();
  const isIntl=()=>countryCode() && countryCode()!=='AU';
  let originalNewListing=null,originalEditListing=null;

  function shippingForProduct(p){
    if(!p?.shipping_required)return 0;
    const strategy=String(p.shipping_strategy||'free');
    if(strategy==='free')return 0;
    if(strategy==='worldwide_flat')return Number(isIntl()?p.shipping_override_price:p.shipping_price)||0;
    if(strategy==='flat')return Number(p.shipping_price??p.shipping_override_price??0)||0;
    if(strategy==='custom')return Number(p.shipping_override_price??0)||0;
    if(strategy==='profile')return Number(p.shipping_price||0)||0;
    return 0;
  }
  function calcShipping(){
    const bySeller=new Map();
    (window.cart||[]).forEach(x=>{const p=x.product||{},seller=p.seller_wallet||p.id||'seller',charge=shippingForProduct(p);bySeller.set(seller,Math.max(bySeller.get(seller)||0,charge));});
    return Number([...bySeller.values()].reduce((a,b)=>a+b,0).toFixed(2));
  }
  function renderSimpleCart(){
    if(!$('cartItems'))return false;
    const c=window.cart||[],sub=c.reduce((n,x)=>n+Number(x.product?.price||0)*Number(x.quantity||0),0),ship=calcShipping();
    $('cartItems').innerHTML=c.length?c.map(x=>`<div class="item"><div class="item-top"><div><b>${esc(x.product?.name||'Product')}</b><div class="muted">$${Number(x.product?.price||0).toFixed(2)} × ${x.quantity}</div><div class="qty"><button onclick="changeQty('${x.product_id}',-1)">−</button><span>${x.quantity}</span><button onclick="changeQty('${x.product_id}',1)">+</button><button class="remove" onclick="removeItem('${x.product_id}')">Remove</button></div></div><b>$${(Number(x.product?.price||0)*Number(x.quantity||0)).toFixed(2)}</b></div></div>`).join(''):'<div class="empty">Your cart is empty.</div>';
    $('subtotal').textContent=`$${sub.toFixed(2)} AUD`;$('shippingTotal').textContent=`$${ship.toFixed(2)} AUD`;$('total').textContent=`$${(sub+ship).toFixed(2)} AUD`;$('checkoutBtn').disabled=!c.length||!window.wallet;return true;
  }
  function addShippingUI(){
    const m=$('listingModal');if(!m)return false;
    const select=$('mfShipStrategy');if(!select)return false;
    select.innerHTML='<option value="free">FREE SHIPPING</option><option value="flat">FLAT RATE</option><option value="worldwide_flat">WORLDWIDE FLAT RATE</option>';
    const help=select.parentElement?.querySelector('.mfhelp');if(help)help.textContent='Choose one simple shipping method for this product.';
    const wrap=$('mfShipPriceWrap');
    if(wrap&&!wrap.dataset.mfSimpleInputs){wrap.dataset.mfSimpleInputs='1';wrap.innerHTML='<div id="mfSimpleFlat"><label>SHIPPING PRICE (AUD)</label><input id="mfShipPrice" type="number" min="0" step="0.01" value="0"></div><div id="mfSimpleWorldwide" style="display:none"><label>AUSTRALIA SHIPPING (AUD)</label><input id="mfShipAU" type="number" min="0" step="0.01" value="0"><label style="display:block;margin-top:9px">INTERNATIONAL SHIPPING (AUD)</label><input id="mfShipIntl" type="number" min="0" step="0.01" value="0"></div>'}
    select.onchange=()=>{const v=select.value;if($('mfSimpleFlat'))$('mfSimpleFlat').style.display=v==='flat'?'block':'none';if($('mfSimpleWorldwide'))$('mfSimpleWorldwide').style.display=v==='worldwide_flat'?'block':'none'};
    return true;
  }
  function newListingSimple(){
    if(originalNewListing)originalNewListing();
    setTimeout(()=>{addShippingUI();if($('mfShipStrategy'))$('mfShipStrategy').value='worldwide_flat';$('mfShipStrategy')?.dispatchEvent(new Event('change'));if($('mfShipAU'))$('mfShipAU').value='0';if($('mfShipIntl'))$('mfShipIntl').value='0';if($('mfShipPrice'))$('mfShipPrice').value='0'},0);
  }
  function editListingSimple(id){
    if(originalEditListing)originalEditListing(id);
    setTimeout(()=>{addShippingUI();const p=(window.sellerData?.products||[]).find(x=>x.id===id);if(!p)return;const strategy=String(p.shipping_strategy||'free');$('mfShipStrategy').value=['free','flat','worldwide_flat'].includes(strategy)?strategy:'free';$('mfShipPrice').value=Number(p.shipping_price||0);$('mfShipAU').value=Number(p.shipping_price||0);$('mfShipIntl').value=Number(p.shipping_override_price||0);$('mfShipStrategy').dispatchEvent(new Event('change'))},0);
  }
  async function saveListingSimple(){
    try{
      addShippingUI();const strategy=$('mfShipStrategy')?.value||'worldwide_flat';let domestic=0,intl=0;
      if(strategy==='flat')domestic=Number($('mfShipPrice')?.value||0);if(strategy==='worldwide_flat'){domestic=Number($('mfShipAU')?.value||0);intl=Number($('mfShipIntl')?.value||0)}
      if(!Number.isFinite(domestic)||!Number.isFinite(intl)||domestic<0||intl<0)throw Error('Shipping prices must be valid numbers.');
      const p={name:$('listingName').value.trim(),description:$('listingDescription').value.trim(),price:Number($('listingPrice').value||0),stock:Number($('listingStock').value||0),category:$('listingCategory').value.trim(),sku:$('listingSku').value.trim(),currency:'AUD',image_url:(document.querySelector('#mfImages .mfimage')?.value||'').trim(),gallery_urls:[...document.querySelectorAll('#mfImages .mfimage')].slice(1).map(x=>x.value.trim()).filter(Boolean),shipping_strategy:strategy,shipping_override_price:intl,shipping_mode:strategy==='free'?'free':'flat',shipping_price:domestic,shipping_required:true,status:$('listingStatus').value,weight_grams:Number($('listingWeight').value||0),length_cm:$('listingLength').value===''?null:Number($('listingLength').value),width_cm:$('listingWidth').value===''?null:Number($('listingWidth').value),height_cm:$('listingHeight').value===''?null:Number($('listingHeight').value),processing_days_min:$('listingProcMin').value===''?null:Number($('listingProcMin').value),processing_days_max:$('listingProcMax').value===''?null:Number($('listingProcMax').value),variants:[],variant_options:[]};
      if(!p.name)throw Error('Product name is required.');
      if($('mfEnableVariants')?.checked&&typeof mfCollect==='function'){const v=mfCollect();if(!v.variants.length)throw Error('Add at least one variant.');p.variants=v.variants;p.variant_options=v.variant_options}
      $('listingStatusText').textContent='Saving…';await api(SELLER_FN,{action:editingId?'update_product':'create_product',session_token:sessionToken,product_id:editingId,product:p});$('listingStatusText').innerHTML='<span class="success">Listing saved ✓</span>';await loadSellerData();await loadProducts();setTimeout(closeListing,500);
    }catch(e){$('listingStatusText').innerHTML='<span class="error">'+esc(e.message)+'</span>'}
  }
  function bind(){
    if(typeof window.api!=='function'||!$('listingModal'))return false;
    originalNewListing=window.newListing;originalEditListing=window.editListing;addShippingUI();window.renderCart=renderSimpleCart;window.newListing=newListingSimple;window.editListing=editListingSimple;window.saveListing=saveListingSimple;
    const nb=$('newListingBtn'),sb=$('saveListing');if(nb)nb.onclick=newListingSimple;if(sb)sb.onclick=saveListingSimple;
    const sc=$('shipCountry');if(sc&&!sc.dataset.mfSimpleShip){sc.dataset.mfSimpleShip='1';sc.addEventListener('change',()=>setTimeout(renderSimpleCart,0))}renderSimpleCart();return true;
  }
  wait(bind);
})();
