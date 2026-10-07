window.__ok=1;
const SZ=['S','M','L','XL'],$=s=>document.querySelector(s),app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+Number(n).toLocaleString('en-IN');
const demo=[
{h:'core-heavy-tee',n:'Core Heavy Tee',p:2499,c:3299,col:'tees',new:1,best:1,d:'Heavyweight 240gsm cotton, boxy cut, dropped shoulder.'},
{h:'error-hoodie',n:'Error Hoodie',p:5499,col:'hoodies',new:1,best:1,d:'Brushed fleece, oversized fit, embroidered mark.'},
{h:'status-cargo',n:'Status Cargo Pant',p:4799,col:'bottoms',new:1,d:'Relaxed tapered cargo in washed twill.'},
{h:'null-jacket',n:'Null Coach Jacket',p:6999,c:8499,col:'outerwear',best:1,d:'Water-resistant shell with snap front.'},
{h:'index-crew',n:'Index Crewneck',p:3999,col:'hoodies',new:1,d:'Loopback terry, ribbed hem, clean chest.'},
{h:'redirect-short',n:'Redirect Short',p:2999,col:'bottoms',best:1,d:'Mid-length utility short, elastic waist.'}
].map(p=>({...p,v:SZ.map(s=>({id:null,t:s,o:{Size:s},img:'',a:true,p:p.p}))}));
const shape=n=>{const vs=n.variants.nodes,pr=vs.map(v=>+v.price.amount),cp=vs.map(v=>+(v.compareAtPrice?.amount||0)),p=Math.min(...pr),c=Math.max(...cp);
return{h:n.handle,n:n.title,d:n.description,img:n.featuredImage?.url,alt:n.featuredImage?.altText,p,c:c>p?c:0,col:n.collections.nodes[0]?.handle||'shop',new:n.tags.includes('new'),best:n.tags.includes('bestseller'),
v:vs.map(v=>({id:v.id,t:v.title,o:Object.fromEntries(v.selectedOptions.map(o=>[o.name,o.value])),img:v.image?.url||'',a:v.availableForSale,p:+v.price.amount}))}};
let P=demo,live=false,user=null,sel={},cart=[],WL=[],ADDR={},dbg='';
try{cart=JSON.parse(localStorage.getItem('c404')||'[]');WL=JSON.parse(localStorage.getItem('w404')||'[]')}catch(e){}
const save=()=>{try{localStorage.setItem('c404',JSON.stringify(cart));localStorage.setItem('w404',JSON.stringify(WL))}catch(e){}$('#cc').textContent=cart.reduce((a,b)=>a+b.q,0)};
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),3200)};
const im=p=>p.img?`<img src="${esc(p.img)}" alt="${esc(p.alt||p.n)}" loading="lazy" style="width:100%;height:100%;object-fit:cover">`:'404';
const card=p=>`<a class="card" href="/p/${esc(p.h)}"><div class="pimg">${im(p)}</div><h3>${esc(p.n)}</h3><small>${inr(p.p)}${p.c?`<s>${inr(p.c)}</s>`:''}</small></a>`;
const imv=(p,v)=>im({...p,img:(v&&v.img)||p.img});
const optsOf=p=>{const m={};p.v.forEach(v=>Object.entries(v.o).forEach(([k,x])=>{(m[k]=m[k]||[]);if(!m[k].includes(x))m[k].push(x)}));return Object.entries(m).filter(([k,a])=>a.length>1)};
const chosen=p=>{const g=optsOf(p);return g.some(([k])=>!sel[k])?null:p.v.find(v=>g.every(([k])=>v.o[k]===sel[k]))||null};
const okOpt=(p,k,x)=>p.v.some(v=>v.o[k]===x&&v.a&&optsOf(p).every(([n])=>n===k||!sel[n]||v.o[n]===sel[n]));
const cols=()=>[...new Set(P.map(p=>p.col))];
const cap=c=>c[0].toUpperCase()+c.slice(1);
const pages={
about:['About','404 Society started from a simple idea: the page you were looking for is the one you make yourself. We design contemporary essentials in heavyweight fabrics and quiet silhouettes.'],
contact:['Contact','Write to hello@404society.example. We reply within two working days.'],
faq:['FAQ','Delivery: 3–7 working days across India. Returns: within 7 days, unworn with tags.'],
privacy:['Privacy Policy','Placeholder. Replace with your reviewed policy before launch.'],
terms:['Terms','Placeholder. Replace with legally reviewed terms before launch.'],
shipping:['Shipping Policy','Free shipping over ₹5,000, otherwise ₹99. Confirm your rates.'],
refund:['Refund Policy','Returns within 7 days for unworn items. Confirm your terms.']};
const shell=(h,b)=>`<section><div class="hd"><h2>${h}</h2></div>${b}</section>`;
const pick=(f)=>{const l=P.filter(f);return (l.length?l:P).slice(0,4)};
const home=()=>`<div class="hero"><h1>Wear your<br>identity</h1><p>Contemporary essentials for those who define their own style.</p><a class="btn" href="/shop">Shop now</a><a class="btn o" href="/shop/new">New arrivals</a></div>
<section><div class="hd"><h2>New arrivals</h2><a href="/shop/new">View all</a></div><div class="grid">${pick(p=>p.new).map(card).join('')}</div></section>
<section><div class="hd"><h2>Collections</h2></div><div class="col">${cols().slice(0,4).map(c=>`<a href="/shop/${esc(c)}">${esc(cap(c))}</a>`).join('')}</div></section>
<section><div class="hd"><h2>Best sellers</h2></div><div class="grid">${pick(p=>p.best).map(card).join('')}</div></section>
<section class="dark"><h2 style="font-size:clamp(32px,6vw,72px);max-width:14ch">Made for people who edit themselves.</h2><p style="margin-top:24px">Fewer pieces, better cloth, cuts that hold their shape.</p></section>`;
const shop=f=>{let l=P,t='Shop';if(f==='new'){l=P.filter(p=>p.new);t='New arrivals'}else if(f){l=P.filter(p=>p.col===f);t=cap(f)}
return shell(esc(t),`<div class="grid">${l.map(card).join('')||'<p>Nothing here yet.</p>'}</div>`)};
const nf=()=>shell('404','<p>This page could not be found.</p><a class="btn" href="/shop">Back to shop</a>');
function product(h){const p=P.find(x=>x.h===h);if(!p)return nf();if(sel.__h!==h){sel={__h:h};const f=p.v.find(v=>v.a)||p.v[0];optsOf(p).forEach(([k])=>{if(!/size/i.test(k))sel[k]=f.o[k]})}
document.title=p.n+' — 404 Society';
return `<section><div class="pd"><div class="pimg" id="pimg" style="font-size:90px">${imv(p,chosen(p))}</div><div><h1 style="font-size:clamp(32px,5vw,56px)">${esc(p.n)}</h1><p style="font-size:20px;margin:16px 0">${inr(p.p)}${p.c?`<s>${inr(p.c)}</s>`:''}</p><p style="color:var(--mut);max-width:44ch">${esc(p.d)}</p>${optsOf(p).map(([k,vals])=>`<label style="margin-top:24px">${esc(k)}</label><div class="sz" role="group" aria-label="${esc(k)}">${vals.map(x=>`<button aria-pressed="${sel[k]===x}" data-o="${esc(k)}" data-ov="${esc(x)}" ${okOpt(p,k,x)?'':'disabled'}>${esc(x)}</button>`).join('')}</div>`).join('')}<button class="btn" id="add" data-h="${esc(p.h)}">Add to cart</button><button class="btn o" id="wish" data-h="${esc(p.h)}">${WL.includes(p.h)?'Saved':'Wishlist'}</button></div></div></section>`}
const line=i=>{const p=P.find(x=>x.h===i.h),v=p?.v.find(x=>x.t===(i.t??i.s));return p&&v?{p,v}:null};
function cartV(){cart=cart.filter(line);if(!cart.length)return shell('Cart','<p>Your cart is empty.</p><a class="btn" href="/shop">Start shopping</a>');
const sub=cart.reduce((a,i)=>a+line(i).v.p*i.q,0),sh=sub>=5000?0:99;
const AF={an:'name',ap:'phone',al:'line1',ac:'city',as:'state',az:'pin'};const f=(id,l)=>`<label for="${id}">${l}</label><input id="${id}" value="${esc(ADDR[AF[id]]||'')}">`;
return shell('Cart',cart.map((i,k)=>{const {p,v}=line(i);return `<div class="row"><div style="display:flex;gap:14px;align-items:center"><div style="width:64px;height:80px;flex:none;background:var(--card);font-size:14px;line-height:80px;text-align:center;overflow:hidden">${imv(p,v)}</div><div><b>${esc(p.n)}</b><br><small style="color:var(--mut)">${esc(v.t==='Default Title'?'':v.t)} · ${inr(v.p)}</small></div></div><div class="qty"><button data-q="${k}" data-d="-1" aria-label="Decrease">−</button> ${i.q} <button data-q="${k}" data-d="1" aria-label="Increase">+</button> <button data-r="${k}" style="width:auto;padding:0 10px">Remove</button></div></div>`}).join('')+
`<div class="row"><span>Subtotal</span><b>${inr(sub)}</b></div><div class="row"><span>Shipping</span><b>${sh?inr(sh):'Free'}</b></div><div class="row"><span>Total</span><b>${inr(sub+sh)}</b></div>`+
(!live?'<div class="note">Demo products are showing. Connect Shopify to enable checkout.</div>':!user?'<a class="btn" style="margin-top:24px" href="/api/auth/google">Sign in with Google to check out</a>':
`<h3 style="margin:32px 0 8px">Delivery address</h3>${f('an','Full name')}${f('ap','Mobile number (10 digits)')}${f('al','Address')}${f('ac','City')}${f('as','State')}${f('az','PIN code')}<p style="font-size:14px;color:var(--mut)">Totals are re-checked against current prices before payment.</p><button class="btn" id="co">Pay securely</button>`))}
async function checkout(){const b=$('#co');b.disabled=true;const v=id=>$('#'+id).value.trim();
const items=cart.map(i=>({id:line(i).v.id,q:i.q}));
try{const r=await fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items,address:{name:v('an'),phone:v('ap'),line1:v('al'),city:v('ac'),state:v('as'),pin:v('az')}})});
const j=await r.json();if(!r.ok){b.disabled=false;return toast(j.message||'Checkout failed. Try again.')}
Cashfree({mode:j.mode}).checkout({paymentSessionId:j.paymentSessionId,redirectTarget:'_self'})}catch(e){b.disabled=false;toast('Checkout failed. Try again.')}}
async function acct(){if(!user)return shell('Account',`<p style="max-width:44ch;color:var(--mut)">Sign in to see orders and your wishlist.</p><a class="btn" style="margin-top:20px" href="/api/auth/google">Continue with Google</a>`);
let os=[];try{const r=await fetch('/api/orders');if(r.ok)os=(await r.json()).orders}catch(e){}
const wl=P.filter(p=>WL.includes(p.h));
return shell('Account',`<p>${esc(user.name)} · ${esc(user.email)}</p>${ADDR.line1?`<p style="color:var(--mut)">Saved address: ${esc(ADDR.name)}, ${esc(ADDR.line1)}, ${esc(ADDR.city)} ${esc(ADDR.pin)}</p>`:''}<button class="btn o" id="lo" style="margin-top:12px">Log out</button><h3 style="margin:40px 0 8px">Orders</h3>${os.map(o=>`<a class="row" href="/order/${esc(o.id)}"><span>${esc(o.id)}<br><small>${new Date(o.createdAt).toLocaleDateString()}</small></span><span>${inr(o.total)} · ${esc(o.status)}</span></a>`).join('')||'<p>No orders yet.</p>'}<h3 style="margin:40px 0 16px">Wishlist</h3><div class="grid">${wl.map(card).join('')||'<p>Nothing saved yet.</p>'}</div>`)}
async function orderV(id){if(!user)return acct();let o;try{const r=await fetch('/api/orders?id='+encodeURIComponent(id));if(!r.ok)return shell('Order','<p>We could not find that order.</p>');o=(await r.json()).order}catch(e){return shell('Order','<p>Could not load the order. Try again.</p>')}
const msg={PAID:'Payment confirmed. Thank you.',PAYMENT_PENDING:'Waiting for payment confirmation. Refresh in a moment.',PAYMENT_FAILED:'Payment failed. You have not been charged for this order.'}[o.status]||o.status;
if(o.status==='PAID'){cart=[];save()}
return shell('Order '+esc(o.id),`<p style="font-size:20px">${esc(msg)}</p>`+o.items.map(i=>`<div class="row"><span>${esc(i.product)} · ${esc(i.variant)} × ${i.quantity}</span><b>${inr(i.unitPrice*i.quantity)}</b></div>`).join('')+`<div class="row"><span>Shipping</span><b>${o.shipping?inr(o.shipping):'Free'}</b></div><div class="row"><span>Total</span><b>${inr(o.total)}</b></div><p style="color:var(--mut)">Ships to ${esc(o.shippingAddress.name)}, ${esc(o.shippingAddress.line1)}, ${esc(o.shippingAddress.city)} ${esc(o.shippingAddress.pin)}</p>`)}
const searchV=()=>{const q=(new URLSearchParams(location.search).get('q')||'').trim(),k=q.toLowerCase(),l=k?P.filter(p=>(p.n+' '+p.d+' '+p.col).toLowerCase().includes(k)):[];return shell('Search',`<form id="sf" role="search"><label for="sq">Search products</label><input id="sq" type="search" value="${esc(q)}"><button class="btn">Search</button></form><div class="grid" style="margin-top:32px">${l.map(card).join('')||(q?'<p>No results.</p>':'')}</div>`)};
const wishV=()=>shell('Wishlist',`<div class="grid">${P.filter(p=>WL.includes(p.h)).map(card).join('')||'<p>Nothing saved yet.</p>'}</div>`);
function seo(t,d,ld){document.title=t;const m=(s,v)=>{const e=$(s);if(e)e.setAttribute(s.includes('name=')?'content':'content',v)};m('meta[name=description]',d);m('meta[property="og:title"]',t);m('meta[property="og:description"]',d);
const u=location.origin+location.pathname;$('#cn').href=u;m('meta[property="og:url"]',u);$('#ld').textContent=ld?JSON.stringify(ld):''}
const tf=(u,ms=6000)=>{const c=new AbortController();setTimeout(()=>c.abort(),ms);return fetch(u,{signal:c.signal})};
async function route(){try{await route0()}catch(e){console.error(e);app.innerHTML=shell('Something went wrong',`<p>Please refresh the page.</p><p style="color:var(--mut);font-size:14px">${esc(e.message)}</p>`)}}
async function route0(){const [,a,b]=location.pathname.split('/');let h;
if(!a)h=home();else if(a==='shop')h=shop(b);else if(a==='collections')h=shell('Collections',`<div class="col">${cols().map(c=>`<a href="/shop/${esc(c)}">${esc(cap(c))}</a>`).join('')}</div>`);
else if(a==='p')h=product(b);else if(a==='cart'||a==='checkout')h=cartV();else if(a==='login'||a==='account'||a==='orders')h=await acct();else if(a==='search')h=searchV();else if(a==='wishlist')h=wishV();else if(a==='order')h=await orderV(b);
else if(a==='about')h=shell(...pages.about);else if(a==='page'&&pages[b])h=shell(...pages[b]);else h=nf();
app.innerHTML=(location.search.includes('debug')||!live?`<div class="note" style="margin:16px 5vw">${live?'Debug: live Shopify products loaded':'Showing demo products. Reason: '+esc(dbg||'still loading')}</div>`:'')+h;scrollTo(0,0);
const p=a==='p'&&P.find(x=>x.h===b);
seo(p?p.n+' — 404 Society':'404 Society — Wear Your Identity',p?(p.d||p.n).slice(0,155):'Contemporary essentials for those who define their own style.',p?{'@context':'https://schema.org','@type':'Product',name:p.n,description:p.d,image:p.img?[p.img]:undefined,offers:{'@type':'Offer',priceCurrency:'INR',price:String(p.p),availability:p.v.some(v=>v.a)?'https://schema.org/InStock':'https://schema.org/OutOfStock',url:location.origin+location.pathname}}:null)}
addEventListener('popstate',route);
document.addEventListener('click',async e=>{const t=e.target,d=t.dataset;const lk=t.closest&&t.closest('a[href^="/"]');if(lk&&!lk.getAttribute('href').startsWith('/api/')&&!e.metaKey&&!e.ctrlKey){e.preventDefault();history.pushState(null,'',lk.getAttribute('href'));route();return}
if(d.o){const p=P.find(x=>x.h===location.pathname.split('/')[2]);sel[d.o]=d.ov;document.querySelectorAll('[data-o]').forEach(b=>{b.setAttribute('aria-pressed',sel[b.dataset.o]===b.dataset.ov);b.disabled=!okOpt(p,b.dataset.o,b.dataset.ov)});$('#pimg').innerHTML=imv(p,chosen(p))}
if(t.id==='add'){const p=P.find(x=>x.h===d.h),v=chosen(p);if(!v)return toast('Select all options');if(!v.a)return toast('Out of stock');const x=cart.find(i=>i.h===d.h&&i.t===v.t);x?x.q=Math.min(10,x.q+1):cart.push({h:d.h,t:v.t,q:1});save();toast('Added to cart')}
if(t.id==='wish'){WL=WL.includes(d.h)?WL.filter(x=>x!==d.h):[...WL,d.h];save();t.textContent=WL.includes(d.h)?'Saved':'Wishlist'}
if(d.q!==undefined){const i=cart[d.q];i.q=Math.min(10,i.q+ +d.d);if(i.q<1)cart.splice(d.q,1);save();route()}
if(d.r!==undefined){cart.splice(d.r,1);save();route()}
if(t.id==='co')checkout();
if(t.id==='lo'){await fetch('/api/auth/logout',{method:'POST'});user=null;history.pushState(null,'','/');route()}});
document.addEventListener('submit',e=>{if(e.target.id==='sf'){e.preventDefault();history.pushState(null,'','/search?q='+encodeURIComponent($('#sq').value));route()}});
$('#nl').addEventListener('submit',e=>{e.preventDefault();e.target.reset();toast('Thanks. You are on the list.')});
(async()=>{app.innerHTML='<section><p>Loading…</p></section>';const oid=new URLSearchParams(location.search).get('order_id');if(oid&&/^[\w-]{1,50}$/.test(oid))history.replaceState(null,'','/order/'+oid);
try{const r=await tf('/api/products'),j=await r.json().catch(()=>({}));if(r.ok&&j.products?.length){P=j.products.map(shape);live=true}else dbg=r.ok?'no active products found':(j.reason||j.error||'HTTP '+r.status)}catch(e){dbg='products request failed: '+e.message}
try{const r=await tf('/api/auth/me');if(r.ok)user=(await r.json()).user}catch(e){}
if(user)try{const r=await tf('/api/address');if(r.ok)ADDR=(await r.json()).address||{}}catch(e){}
save();route()})();
/*END app.js*/
