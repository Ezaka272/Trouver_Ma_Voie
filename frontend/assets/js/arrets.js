const API="/api/arrets";
const tbody=document.getElementById("tbody");
const search=document.getElementById("recherche");
const modal=document.getElementById("modal");
const nom=document.getElementById("nom");
const ligne=document.getElementById("ligne_id");
const ordre=document.getElementById("ordre");
const lat=document.getElementById("latitude");
const lng=document.getElementById("longitude");
let editId=null;
async function lignes(){
    const a=await fetch('/api/lignes').then(r=>r.json());
    ligne.innerHTML='<option value="">Choisir une ligne</option>'+a.map(x=>`<option value="${x.id}">${x.numero} — ${x.depart} → ${x.destination}</option>`).join('')}
    async function load(){
        const a=await fetch(API).then(r=>r.json());
        tbody.innerHTML=a.map(x=>
        `<tr>
            <td>${x.nom}</td>
            <td>${x.lignes||'-'}</td>
            <td>${x.ordres||'-'}</td>
            <td>${x.latitude??''}</td>
            <td>${x.longitude??''}</td>
            <td>
            <button class="btn-edit" onclick="edit(${x.id})">
             <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-delete" onclick="removeArret(${x.id})">
             <i class="fa-solid fa-trash"></i>
            </button>
            </td>
        </tr>`).join('')}
            document.getElementById('btnAjouter')?.addEventListener('click',async()=>{
                editId=null;document.getElementById('titreModal').textContent='Ajouter un arrêt';
                nom.value='';
                ordre.value='';
                lat.value='';
                lng.value='';
                await lignes();
                modal.style.display='flex'});
                document.getElementById('annuler')?.addEventListener('click',()=>modal.style.display='none');
                document.getElementById('enregistrer')?.addEventListener('click',async()=>{
                    const body={nom:nom.value.trim(),latitude:lat.value||null,longitude:lng.value||null,ligne_id:ligne.value||null,ordre:ordre.value||null};
                if(!body.nom)return alert('Nom requis');
                const r=await fetch(editId?API+'/'+editId:API,{method:editId?'PUT':'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});
                const d=await r.json();if(!r.ok)return alert(d.message||'Erreur');modal.style.display='none';load()});window.edit=async id=>{editId=id;
                    const a=await fetch(API+'/'+id).then(r=>r.json());nom.value=a.nom;lat.value=a.latitude??'';lng.value=a.longitude??'';
                    await lignes();
                    if(a.ligne_id)ligne.value=a.ligne_id;ordre.value=a.ordre??'';
                    document.getElementById('titreModal').textContent='Modifier un arrêt';modal.style.display='flex'};window.removeArret=async id=>{if(!confirm('Supprimer cet arrêt et ses associations ?'))return;
                        const r=await fetch(API+'/'+id,{method:'DELETE',credentials:'include'});if(!r.ok)alert((await r.json()).message||'Erreur');load()};
                        search?.addEventListener('input',()=>document.querySelectorAll('#tbody tr').forEach(tr=>tr.style.display=tr.innerText.toLowerCase().includes(search.value.toLowerCase())?'':'none'));
    load();
    