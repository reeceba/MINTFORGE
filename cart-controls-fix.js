/* MINTFORGE CART V8 COMPATIBILITY HOOK
   The cart now has one controller in cart-experience-v4.js.
   This file intentionally does not attach a second set of click/touch handlers.
*/
(()=>{
  const sync=()=>{try{window.mfCartSync?.()}catch(e){console.error('MINTFORGE cart sync',e)}};
  let n=0;const t=setInterval(()=>{if(typeof window.mfCartSync==='function'||++n>300){clearInterval(t);sync()}},100);
})();
