const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const db = require("../config/db");
const { requireAuth, requireAdmin } = require("../middlewares/auth");
const { hashPassword } = require("../config/initDb");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads/profils");
fs.mkdirSync(uploadDir, { recursive: true });

function photoUrl(req, filename) {
    return `${req.protocol}://${req.get("host")}/uploads/profils/${filename}`;
}

function normalizeUserBody(body) {
    return {
        nom: String(body.nom || "").trim(),
        email: String(body.email || "").trim().toLowerCase(),
        role: String(body.role || "voyageur").trim()
    };
}

function validEmail(email) {
    return /^\S+@\S+\.\S+$/.test(email);
}

function validRole(role) {
    return role === "voyageur" || role === "admin";
}

/* ===========================
   ADMIN - LISTE UTILISATEURS
=========================== */
router.get("/", requireAdmin, async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT id, nom, email, role, photo, actif, created_at
            FROM utilisateurs
            ORDER BY created_at DESC
        `);

        res.json(rows);
    } catch (error) {
        next(error);
    }
});

/* ===========================
   ADMIN - AJOUTER UTILISATEUR
=========================== */
router.post("/", requireAdmin, async (req, res, next) => {
    try {
        const { nom, email, role } = normalizeUserBody(req.body);
        const password = String(req.body.password || "");

        if (nom.length < 2) {
            return res.status(400).json({
                message: "Le nom doit contenir au moins 2 caractères."
            });
        }

        if (!validEmail(email)) {
            return res.status(400).json({
                message: "Adresse email invalide."
            });
        }

        if (!validRole(role)) {
            return res.status(400).json({
                message: "Rôle invalide."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Le mot de passe doit contenir au moins 6 caractères."
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM utilisateurs WHERE email = ? LIMIT 1",
            [email]
        );

        if (existing.length) {
            return res.status(409).json({
                message: "Cet email est déjà utilisé."
            });
        }

        const [result] = await db.query(
            `INSERT INTO utilisateurs
                (nom, email, mot_de_passe, role, actif)
             VALUES (?, ?, ?, ?, 1)`,
            [nom, email, hashPassword(password), role]
        );

        const [rows] = await db.query(
            `SELECT id, nom, email, role, photo, actif, created_at
             FROM utilisateurs
             WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: "Utilisateur créé avec succès.",
            user: rows[0]
        });
    } catch (error) {
        next(error);
    }
});

/* ===========================
   PROFIL CONNECTÉ
=========================== */
router.get("/me", requireAuth, async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT id, nom, email, role, photo, actif
             FROM utilisateurs
             WHERE id = ?`,
            [req.user.id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        const [fav] = await db.query(
            "SELECT COUNT(*) AS n FROM favoris WHERE utilisateur_id = ?",
            [req.user.id]
        );

        res.json({
            ...rows[0],
            favoris: Number(fav[0].n)
        });
    } catch (error) {
        next(error);
    }
});

/* ===========================
   MODIFIER SON PROFIL
=========================== */
router.put("/me", requireAuth, async (req, res, next) => {
    try {
        const nom = String(req.body.nom || req.user.nom).trim();
        const email = String(req.body.email || req.user.email).trim().toLowerCase();

        if (nom.length < 2 || !validEmail(email)) {
            return res.status(400).json({
                message: "Nom ou email invalide."
            });
        }

        const [duplicate] = await db.query(
            "SELECT id FROM utilisateurs WHERE email = ? AND id <> ?",
            [email, req.user.id]
        );

        if (duplicate.length) {
            return res.status(409).json({
                message: "Email déjà utilisé."
            });
        }

        await db.query(
            "UPDATE utilisateurs SET nom = ?, email = ? WHERE id = ?",
            [nom, email, req.user.id]
        );

        const [rows] = await db.query(
            "SELECT id, nom, email, role, photo FROM utilisateurs WHERE id = ?",
            [req.user.id]
        );

        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

/* ===========================
   ADMIN - MODIFIER UTILISATEUR
=========================== */
router.put("/:id", requireAdmin, async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID utilisateur invalide."
            });
        }

        const { nom, email, role } = normalizeUserBody(req.body);
        const password = String(req.body.password || "");

        if (nom.length < 2) {
            return res.status(400).json({
                message: "Le nom doit contenir au moins 2 caractères."
            });
        }

        if (!validEmail(email)) {
            return res.status(400).json({
                message: "Adresse email invalide."
            });
        }

        if (!validRole(role)) {
            return res.status(400).json({
                message: "Rôle invalide."
            });
        }

        if (password && password.length < 6) {
            return res.status(400).json({
                message: "Le mot de passe doit contenir au moins 6 caractères."
            });
        }

        const [users] = await db.query(
            "SELECT id, role FROM utilisateurs WHERE id = ?",
            [id]
        );

        if (!users.length) {
            return res.status(404).json({
                message: "Utilisateur introuvable."
            });
        }

        if (id === Number(req.user.id) && role !== "admin") {
            return res.status(400).json({
                message: "Vous ne pouvez pas retirer votre propre rôle administrateur."
            });
        }

        const [duplicate] = await db.query(
            "SELECT id FROM utilisateurs WHERE email = ? AND id <> ?",
            [email, id]
        );

        if (duplicate.length) {
            return res.status(409).json({
                message: "Cet email est déjà utilisé."
            });
        }

        if (password) {
            await db.query(
                `UPDATE utilisateurs
                 SET nom = ?, email = ?, role = ?, mot_de_passe = ?
                 WHERE id = ?`,
                [nom, email, role, hashPassword(password), id]
            );
        } else {
            await db.query(
                `UPDATE utilisateurs
                 SET nom = ?, email = ?, role = ?
                 WHERE id = ?`,
                [nom, email, role, id]
            );
        }

        const [rows] = await db.query(
            `SELECT id, nom, email, role, photo, actif, created_at
             FROM utilisateurs
             WHERE id = ?`,
            [id]
        );

        res.json({
            message: "Utilisateur modifié avec succès.",
            user: rows[0]
        });
    } catch (error) {
        next(error);
    }
});

/* ===========================
   PHOTO DU PROFIL
=========================== */
router.post("/me/photo", requireAuth, async (req, res, next) => {
    try {
        const data = String(req.body.image || "");
        const match = data.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);

        if (!match) {
            return res.status(400).json({
                message: "Image invalide."
            });
        }

        const buffer = Buffer.from(match[3], "base64");

        if (buffer.length > 5 * 1024 * 1024) {
            return res.status(413).json({
                message: "Image trop grande (5 Mo maximum)."
            });
        }

        const ext = match[2] === "jpeg" || match[2] === "jpg"
            ? "jpg"
            : match[2];

        const filename = `user-${req.user.id}-${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, filename);

        fs.writeFileSync(filePath, buffer);

        const url = photoUrl(req, filename);

        const [old] = await db.query(
            "SELECT photo FROM utilisateurs WHERE id = ?",
            [req.user.id]
        );

        await db.query(
            "UPDATE utilisateurs SET photo = ? WHERE id = ?",
            [url, req.user.id]
        );

        if (old[0]?.photo) {
            try {
                const oldUrl = new URL(old[0].photo);
                const oldPath = path.join(
                    __dirname,
                    "..",
                    oldUrl.pathname.replace(/^\/+/, "")
                );

                if (oldPath.startsWith(uploadDir) && fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            } catch {
                // Ancienne photo externe/invalide : on ne bloque pas l'upload.
            }
        }

        res.json({ photo: url });
    } catch (error) {
        next(error);
    }
});

/* ===========================
   ADMIN - SUPPRIMER
=========================== */
router.delete("/:id", requireAdmin, async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID utilisateur invalide."
            });
        }

        if (id === Number(req.user.id)) {
            return res.status(400).json({
                message: "Vous ne pouvez pas supprimer votre propre compte."
            });
        }

        const [result] = await db.query(
            "DELETE FROM utilisateurs WHERE id = ?",
            [id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Utilisateur introuvable."
            });
        }

        res.json({
            message: "Utilisateur supprimé avec succès."
        });
    } catch (error) {
        next(error);
    }
});

/* ===========================
   ADMIN - ACTIVER / DÉSACTIVER
=========================== */
router.patch("/:id/actif", requireAdmin, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const actif = req.body.actif;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID utilisateur invalide."
            });
        }

        if (typeof actif !== "boolean" && actif !== 0 && actif !== 1) {
            return res.status(400).json({
                message: "Valeur actif invalide."
            });
        }

        if (id === Number(req.user.id)) {
            return res.status(400).json({
                message: "Vous ne pouvez pas désactiver votre propre compte."
            });
        }

        const nouvelEtat = actif === true || actif === 1 ? 1 : 0;

        const [result] = await db.query(
            "UPDATE utilisateurs SET actif = ? WHERE id = ?",
            [nouvelEtat, id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Utilisateur introuvable."
            });
        }

        res.json({
            message: nouvelEtat ? "Utilisateur activé." : "Utilisateur désactivé.",
            id,
            actif: nouvelEtat
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
