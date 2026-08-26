// MINTFORGE worldwide country/listing/variant/cart upgrade loader
['listing-upgrade.js','variant-shop.js','soldout-fix.js','shipping-fix.js','worldwide-final.js','simple-shipping.js','remove-listing.js','buyer-experience.js','cart-experience-v4.js'].forEach(src=>{const s=document.createElement('script');s.src='./'+src+'?v=20260826-11';s.defer=false;document.head.appendChild(s)});
