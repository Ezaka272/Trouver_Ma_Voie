const API="/api/lignes";
const tbody=document.getElementById("tbody");
const search=document.getElementById("recherche");
const modal=document.getElementById("modal");
const numero=document.getElementById("numero");
const depart=document.getElementById("depart");
const destination=document.getElementById("destination");
const prix=document.getElementById("prix");
const temps=document.getElementById("temps");
let editId=null;
// async function lignes(){
//     const a=await fetch('/api/lignes').then(r=>r.json());
//     ligne.innerHTML='<option value="">Choisir une ligne</option>'+a.map(x=>`<option value="${x.id}">${x.numero} — ${x.depart} → ${x.destination}</option>`).join('')}
    async function load(){
        const a=await fetch(API).then(r=>r.json());
        tbody.innerHTML=a.map(x=>
        `<tr>
            <td>${x.numero}</td>
            <td>${x.depart||'-'}</td>
            <td>${x.destination||'-'}</td>
            <td>${x.prix??''}</td>
            <td>${x.temps??''}</td>
            <td>
            <button class="btn-edit" onclick="edit(${x.id})">
             <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-delete" onclick="removeLigne(${x.id})">
             <i class="fa-solid fa-trash"></i>
            </button>
            </td>
        </tr>`).join('')}
            document.getElementById('btnAjouter')?.addEventListener('click',async()=>{
                editId=null;document.getElementById('titreModal').textContent='Ajouter une ligne';
                numero.value='';
                depart.value='';
                destination.value='';
                prix.value='';
                temps.value='';
                // await lignes();
                modal.style.display='flex'});
                document.getElementById('annuler')?.addEventListener('click',()=>modal.style.display='none');
                document.getElementById('enregistrer')?.addEventListener('click',async()=>{
                    const body={numero:numero.value.trim(),depart:depart.value||null,destination:destination.value||null,prix:prix.value||null,temps:temps.value||null};
                if(!body.nom)return alert('Nom requis');
                const r=await fetch(editId?API+'/'+editId:API,{method:editId?'PUT':'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});
                const d=await r.json();if(!r.ok)return alert(d.message||'Erreur');modal.style.display='none';load()});window.edit=async id=>{editId=id;
                    const a=await fetch(API+'/'+id).then(r=>r.json());numero.value=a.numero;depart.value=a.depart??'';destination.value=a.destination??'';prix.value=a.prix;temps.value=a.temps;
                    // await lignes();
                    // if(a.ligne_id)ligne.value=a.ligne_id;ordre.value=a.ordre??'';
                    document.getElementById('titreModal').textContent='Modifier une ligne';modal.style.display='flex'};window.removeLigne=async id=>{if(!confirm('Supprimer cette ligne et ses associations ?'))return;
                        const r=await fetch(API+'/'+id,{method:'DELETE',credentials:'include'});if(!r.ok)alert((await r.json()).message||'Erreur');load()};
                        search?.addEventListener('input',()=>document.querySelectorAll('#tbody tr').forEach(tr=>tr.style.display=tr.innerText.toLowerCase().includes(search.value.toLowerCase())?'':'none'));
    load();
    