const crypto = require("crypto");
const db = require("../config/db");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function readCookie(req, name) {
  const header = req.headers.cookie || "";
  const part = header.split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  return part ? decodeURIComponent(part.substring(name.length + 1)) : null;
}

async function getUser(req) {
  const token = readCookie(req, "taxibe_session");
  if (!token) return null;
  const [rows] = await db.query(`
    SELECT u.id,u.nom,u.email,u.role,u.photo,u.actif
    FROM sessions s JOIN utilisateurs u ON u.id=s.utilisateur_id
    WHERE s.token_hash=? AND s.expires_at > NOW() AND u.actif=1
    LIMIT 1`, [hashToken(token)]);
  return rows[0] || null;
}

async function requireAuth(req,res,next) {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({message:"Connexion requise"});
    req.user = user;
    next();
  } catch (e) { next(e); }
}

async function requireAdmin(req,res,next) {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({message:"Connexion requise"});
    if (user.role !== "admin") return res.status(403).json({message:"Accès administrateur refusé"});
    req.user = user;
    next();
  } catch (e) { next(e); }
}

async function adminPageGuard(req,res,next) {
  try {
    const user = await getUser(req);
    if (!user || user.role !== "admin") return res.redirect("/auth/login.html?admin=1");
    req.user = user;
    next();
  } catch (e) { next(e); }
}

module.exports = { hashToken, readCookie, getUser, requireAuth, requireAdmin, adminPageGuard };
