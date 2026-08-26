// MINTFORGE worldwide shipping/profile sync fix
(function(){
  function copyProfileToCheckout(){
    const pairs={profileName:'shipName',profileEmail:'shipEmail',profileAddress:'shipAddress',profileCity:'shipCity',profileState:'shipState',profilePostcode:'shipPostcode',profileCountry:'shipCountry'};
    Object.entries(pairs).forEach(([from,to])=>{
      const a=document.getElementById(from),b=document.getElementById(to);
      if(a&&b&&a.value)b.value=a.value;
    });
  }
  function bind(){
    const checkout=document.getElementById('checkoutBtn'),save=document.getElementById('saveProfile');
    if(!checkout||!save||typeof window.checkout!=='function'||typeof window.saveProfile!=='function')return false;
    checkout.onclick=window.checkout;
    save.onclick=async function(){await window.saveProfile();copyProfileToCheckout();};
    const pc=document.getElementById('profileCountry');
    if(pc&&!pc.dataset.mfShippingSync){
      pc.dataset.mfShippingSync='1';
      pc.addEventListener('change',()=>{const sc=document.getElementById('shipCountry');if(sc)sc.value=pc.value;});
    }
    if(window.profile)copyProfileToCheckout();
    return true;
  }
  let tries=0;
  const timer=setInterval(()=>{if(bind()||++tries>80)clearInterval(timer);},100);
})();
