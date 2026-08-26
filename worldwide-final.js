/* MINTFORGE Worldwide Shipping Finalizer
   Removes the remaining Australia-only frontend paths and connects profile + checkout
   to the international shipping engine. Loaded last so it wins over legacy handlers.
*/
(() => {
  const wait = (fn, tries = 80) => { let n = 0; const t = setInterval(() => { try { if (fn() || ++n >= tries) clearInterval(t); } catch {} }, 100); };
  const country = id => {
    const s = document.getElementById(id); if (!s) return { name:'', code:'' };
    const o = s.selectedOptions?.[0];
    return { name: String(s.value || '').trim(), code: String(o?.dataset?.countryCode || '').toUpperCase() };
  };
  const setCountry = (id, name) => { const s = document.getElementById(id); if (s && name) s.value = name; };
  const status = (id, msg, cls='') => { const e = document.getElementById(id); if (e) { e.className = 'status ' + cls; e.innerHTML = msg; } };

  function fillProfileWorldwide(p) {
    p = p || {};
    const vals = {
      profileName: p.shipping_name || p.display_name || '',
      profileEmail: p.email || '', profileAddress: p.shipping_address || '',
      profileCity: p.shipping_city || '', profileState: p.shipping_state || '',
      profilePostcode: p.shipping_postcode || ''
    };
    Object.entries(vals).forEach(([id,v]) => { const e=document.getElementById(id); if(e) e.value=v; });
    setCountry('profileCountry', p.shipping_country || '');
  }

  function fillShippingWorldwide(p) {
    if (!p) return;
    const vals = {
      shipName: p.shipping_name || p.display_name || '', shipEmail: p.email || '',
      shipAddress: p.shipping_address || '', shipCity: p.shipping_city || '',
      shipState: p.shipping_state || '', shipPostcode: p.shipping_postcode || ''
    };
    Object.entries(vals).forEach(([id,v]) => { const e=document.getElementById(id); if(e) e.value=v; });
    setCountry('shipCountry', p.shipping_country || '');
  }

  async function saveProfileWorldwide() {
    try {
      const c = country('profileCountry');
      if (!c.name) throw Error('Select a country.');
      if (!sessionToken) throw Error('Wallet session required. Please reconnect.');
      status('profileStatus','Saving…');
      const d = await api(PROFILE_FN, { action:'save_profile', session_token:sessionToken, profile:{
        name: document.getElementById('profileName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        address: document.getElementById('profileAddress').value.trim(),
        city: document.getElementById('profileCity').value.trim(),
        state: document.getElementById('profileState').value.trim(),
        postcode: document.getElementById('profilePostcode').value.trim(),
        country: c.name, country_code: c.code
      }});
      profile = d.profile;
      fillProfileWorldwide(profile); fillShippingWorldwide(profile);
      status('profileStatus','<span class="success">Profile saved ✓</span>');
    } catch(e) { status('profileStatus', '<span class="error">'+escapeHtml(e.message)+'</span>'); }
  }

  async function checkoutWorldwide() {
    if (!wallet) { alert('Connect your wallet first.'); return; }
    if (!cart.length) return;
    const c = country('shipCountry');
    const s = {
      name: document.getElementById('shipName').value.trim(),
      address: document.getElementById('shipAddress').value.trim(),
      city: document.getElementById('shipCity').value.trim(),
      state: document.getElementById('shipState').value.trim(),
      postcode: document.getElementById('shipPostcode').value.trim(),
      country: c.name, country_name: c.name, country_code: c.code,
      email: document.getElementById('shipEmail').value.trim()
    };
    if (!s.name || !s.email || !s.address || !s.city || !s.country || !s.country_code) {
      status('checkoutStatus','Please complete your international shipping details and email.','error'); return;
    }
    try {
      status('checkoutStatus','Creating secure checkout…'); document.getElementById('checkoutBtn').disabled=true;
      const d = await api(CHECKOUT_FN,{wallet_address:wallet,customer_email:s.email,shipping:s,payment_currency:'SOL',items:cart.map(x=>({product_id:x.product_id,quantity:x.quantity}))});
      const pr=provider(); if(!pr?.signAndSendTransaction) throw Error('Connected wallet cannot send transactions');
      await window.__web3Promise;
      const {Connection,PublicKey,Transaction,SystemProgram,LAMPORTS_PER_SOL}=window.solanaWeb3;
      const conn=new Connection('https://solana-rpc.publicnode.com','confirmed'),tx=new Transaction();
      for(const split of d.payment_splits||[]) tx.add(SystemProgram.transfer({fromPubkey:new PublicKey(wallet),toPubkey:new PublicKey(split.seller_wallet),lamports:Math.round(Number(split.expected_amount)*LAMPORTS_PER_SOL)}));
      tx.recentBlockhash=(await conn.getLatestBlockhash('confirmed')).blockhash; tx.feePayer=new PublicKey(wallet);
      status('checkoutStatus','Approve the SOL payment in your wallet…');
      const sent=await pr.signAndSendTransaction(tx),sig=sent.signature||sent; let verified=null;
      for(let i=0;i<10&&!verified;i++){const v=await api(VERIFY_FN,{order_id:d.order.id,signature:sig});if(v.verified)verified=v;else await new Promise(r=>setTimeout(r,1200));}
      if(!verified) throw Error('Payment was sent but could not be verified yet. Check the transaction signature before retrying.');
      cart=[]; renderCart();
      document.getElementById('confirmOrder').textContent=d.order.id.slice(0,8).toUpperCase();
      document.getElementById('confirmItems').textContent=(d.items||[]).map(i=>`${i.product_name} × ${i.quantity}`).join(', ');
      document.getElementById('confirmTotal').textContent=`$${Number(d.total).toFixed(2)} AUD`;
      document.getElementById('confirmShipping').textContent=Number(d.shipping_amount||0)>0?`$${Number(d.shipping_amount).toFixed(2)} AUD`:'FREE';
      document.getElementById('emailStatus').innerHTML=verified.email_sent?'<span class="success">Confirmation email sent ✓</span>':'Confirmation saved. Email provider may still be processing.';
      document.getElementById('confirmModal').classList.add('open'); await loadProducts();
    } catch(e) { console.error(e); status('checkoutStatus','<span class="error">'+escapeHtml(e.message)+'</span>','error'); }
    finally { document.getElementById('checkoutBtn').disabled=!cart.length||!wallet; }
  }

  function bind() {
    const pc=document.getElementById('profileCountry'), sc=document.getElementById('shipCountry');
    if(!pc||!sc||typeof window.api!=='function') return false;
    if(!pc.dataset.mfWorldwide){ pc.dataset.mfWorldwide='1'; pc.addEventListener('change',()=>setCountry('shipCountry',pc.value)); }
    if(!sc.dataset.mfWorldwide){ sc.dataset.mfWorldwide='1'; sc.addEventListener('change',()=>{ const c=country('shipCountry'); window.MINTFORGE_COUNTRY_CODE=c.code; }); }
    window.fillProfile=fillProfileWorldwide; window.fillShipping=fillShippingWorldwide; window.saveProfile=saveProfileWorldwide; window.checkout=checkoutWorldwide;
    const sp=document.getElementById('saveProfile'), cb=document.getElementById('checkoutBtn');
    if(sp) sp.onclick=saveProfileWorldwide;
    if(cb) cb.onclick=checkoutWorldwide;
    if(window.profile){ fillProfileWorldwide(window.profile); fillShippingWorldwide(window.profile); }
    return true;
  }
  wait(bind);
})();
