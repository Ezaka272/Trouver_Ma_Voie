const express = require("express");
const db = require("../config/db");
const { requireAdmin } = require("../middlewares/auth");

const router = express.Router();

async function ensureTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS parametres (
            id INT PRIMARY KEY,
            nom_application VARCHAR(100) NOT NULL DEFAULT 'TaxiBe',
            ville VARCHAR(100) NOT NULL DEFAULT 'Antananarivo',
            couleur_principale VARCHAR(20) NOT NULL DEFAULT '#0d6efd',
            couleur_secondaire VARCHAR(20) NOT NULL DEFAULT '#00b894',
            mode VARCHAR(20) NOT NULL DEFAULT 'light',
            langue VARCHAR(10) NOT NULL DEFAULT 'fr'
        )
    `);
    await db.query(`
        INSERT INTO parametres
            (id, nom_application, ville, couleur_principale, couleur_secondaire, mode, langue)
        VALUES (1, 'TaxiBe', 'Antananarivo', '#0d6efd', '#00b894', 'light', 'fr')
        ON DUPLICATE KEY UPDATE id = id
    `);
}

ensureTable().catch(err => console.error("Initialisation parametres:", err.message));

router.get("/", async (req, res, next) => {
    try {
        await ensureTable();
        const [rows] = await db.query("SELECT * FROM parametres WHERE id = 1 LIMIT 1");
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

router.put("/", requireAdmin, async (req, res, next) => {
    try {
        await ensureTable();

        const nom_application = String(req.body.nom_application || "TaxiBe").trim().slice(0, 100);
        const ville = String(req.body.ville || "Antananarivo").trim().slice(0, 100);
        const couleur_principale = /^#[0-9a-fA-F]{6}$/.test(req.body.couleur_principale)
            ? req.body.couleur_principale
            : "#0d6efd";
        const couleur_secondaire = /^#[0-9a-fA-F]{6}$/.test(req.body.couleur_secondaire)
            ? req.body.couleur_secondaire
            : "#00b894";
        const mode = ["light", "dark", "system"].includes(req.body.mode)
            ? req.body.mode
            : "light";
        const langue = ["fr", "mg", "en"].includes(req.body.langue)
            ? req.body.langue
            : "fr";

        await db.query(`
            UPDATE parametres
            SET nom_application = ?,
                ville = ?,
                couleur_principale = ?,
                couleur_secondaire = ?,
                mode = ?,
                langue = ?
            WHERE id = 1
        `, [
            nom_application || "TaxiBe",
            ville || "Antananarivo",
            couleur_principale,
            couleur_secondaire,
            mode,
            langue
        ]);

        const [rows] = await db.query("SELECT * FROM parametres WHERE id = 1");
        res.json({
            message: "Paramètres enregistrés avec succès.",
            settings: rows[0]
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
