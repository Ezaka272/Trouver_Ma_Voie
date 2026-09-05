(async()=>{
    const img=document.getElementById('photoAdmin');
    const input=document.getElementById('photoProfil');
    const r=await fetch('/api/utilisateurs/me',{credentials:'include'
    });
    if(!r.ok)return;
    const u=await r.json();if(u.photo)img.src=u.photo;
    const name=document.querySelector('.profil span');
    if(name)name.textContent=u.nom;input?.addEventListener('change',()=>{
        const f=input.files[0];if(!f)return;
        const rd=new FileReader();rd.onload=async()=>{
            const x=await fetch('/api/utilisateurs/me/photo',{method:'POST',headers:{'Content-Type':'application/json'},
                credentials:'include',
                body:JSON.stringify({image:rd.result})
            });
                const d=await x.json();if(x.ok)img.src=d.photo
            };
            
            rd.readAsDataURL(f)})})();
