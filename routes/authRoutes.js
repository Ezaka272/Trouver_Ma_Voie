const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const { hashPassword } = require("../config/initDb");
const { hashToken, getUser, requireAuth } = require("../middlewares/auth");
const router = express.Router();

function safeUser(u) { return {id:u.id, nom:u.nom, email:u.email, role:u.role, photo:u.photo}; }
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual,"hex"), Buffer.from(hash,"hex"));
}
async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  await db.query("INSERT INTO sessions (utilisateur_id,token_hash,expires_at) VALUES (?,?,DATE_ADD(NOW(), INTERVAL 30 DAY))", [userId, hashToken(token)]);
  res.setHeader("Set-Cookie", `taxibe_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`);
}

router.post("/register", async (req,res,next)=>{
  try {
    const nom = String(req.body.nom||"").trim();
    const email = String(req.body.email||"").trim().toLowerCase();
    const password = String(req.body.password||"");
    if (nom.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) return res.status(400).json({message:"Nom, email valide et mot de passe de 6 caractères minimum requis."});
    const [exists] = await db.query("SELECT id FROM utilisateurs WHERE email=? LIMIT 1", [email]);
    if (exists.length) return res.status(409).json({message:"Cet email est déjà utilisé."});
    const [r] = await db.query("INSERT INTO utilisateurs (nom,email,mot_de_passe,role) VALUES (?,?,?,'voyageur')", [nom,email,hashPassword(password)]);
    const [rows] = await db.query("SELECT * FROM utilisateurs WHERE id=?", [r.insertId]);
    await createSession(res, r.insertId);
    res.status(201).json({user:safeUser(rows[0])});
  } catch(e){ next(e); }
});

router.post("/login", async (req,res,next)=>{
  try {
    const email=String(req.body.email||"").trim().toLowerCase();
    const password=String(req.body.password||"");
    const [rows]=await db.query("SELECT * FROM utilisateurs WHERE email=? LIMIT 1",[email]);
    if(!rows.length || !rows[0].actif || !verifyPassword(password,rows[0].mot_de_passe)) return res.status(401).json({message:"Email ou mot de passe incorrect."});
    await createSession(res,rows[0].id);
    res.json({user:safeUser(rows[0])});
  }catch(e){next(e);}
});

router.post("/logout", async(req,res,next)=>{
  try{
    const user=await getUser(req);
    const cookie=req.headers.cookie||"";
    const match=cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("taxibe_session="));
    if(match){ const token=decodeURIComponent(match.split("=").slice(1).join("="));
       await db.query("DELETE FROM sessions WHERE token_hash=?",[hashToken(token)]); }
    res.setHeader("Set-Cookie","taxibe_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
    res.json({message:"Déconnexion réussie"});
  }catch(e){next(e);}
});

router.get("/me", requireAuth, (req,res)=>res.json({user:req.user}));
module.exports=router;
