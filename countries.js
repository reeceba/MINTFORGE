// MINTFORGE worldwide country/listing/variant upgrade loader
['listing-upgrade.js','variant-shop.js','soldout-fix.js'].forEach(src=>{const s=document.createElement('script');s.src='./'+src;s.defer=false;document.head.appendChild(s)});
