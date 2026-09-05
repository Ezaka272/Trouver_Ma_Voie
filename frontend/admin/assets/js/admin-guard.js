(async()=>{
    const r=await fetch('/api/auth/me',{credentials:'include'});
    if(!r.ok){location.href='/auth/login.html?admin=1';return}
    const d=await r.json();if(d.user.role!=='admin')location.href='/auth/login.html?admin=1';
    const els=document.querySelectorAll('a[href="../index.html"]');
    els.forEach(a=>{a.addEventListener('click',async e=>{
        e.preventDefault();await fetch('/api/auth/logout',{method:'POST',credentials:'include'});
        location.href='/index.html'})
    })
})
();
