const crypto = require("crypto");
const db = require("./db");

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

async function ensureColumn(table, column, definition) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?`,
        [table, column]
    );

    if (Number(rows[0].count) === 0) {
        await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`Colonne ajoutée : ${table}.${column}`);
    }
}

async function initDb() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS utilisateurs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(120) NOT NULL,
            email VARCHAR(190) NOT NULL UNIQUE,
            mot_de_passe VARCHAR(255) NOT NULL,
            role ENUM('voyageur','admin') NOT NULL DEFAULT 'voyageur',
            photo VARCHAR(255) NULL,
            actif TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    `);

    /*
     * Important :
     * CREATE TABLE IF NOT EXISTS ne modifie pas une ancienne table.
     * Ces vérifications permettent donc de réparer automatiquement
     * une base TaxiBe créée avec une ancienne version du projet.
     */
    await ensureColumn("utilisateurs", "photo", "VARCHAR(255) NULL");
    await ensureColumn("utilisateurs", "actif", "TINYINT(1) NOT NULL DEFAULT 1");
    await ensureColumn("utilisateurs", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn(
        "utilisateurs",
        "updated_at",
        "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    );

    await db.query(`
        CREATE TABLE IF NOT EXISTS sessions (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            utilisateur_id INT NOT NULL,
            token_hash CHAR(64) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_session_user (utilisateur_id),
            CONSTRAINT fk_session_user
                FOREIGN KEY (utilisateur_id)
                REFERENCES utilisateurs(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB;
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS favoris (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            utilisateur_id INT NOT NULL,
            ligne_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_favori (utilisateur_id, ligne_id),
            INDEX idx_fav_user (utilisateur_id),
            CONSTRAINT fk_fav_user
                FOREIGN KEY (utilisateur_id)
                REFERENCES utilisateurs(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB;
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS recherches (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            utilisateur_id INT NULL,
            depart VARCHAR(150) NOT NULL,
            destination VARCHAR(150) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_recherche_user (utilisateur_id),
            INDEX idx_recherche_date (created_at),
            CONSTRAINT fk_recherche_user
                FOREIGN KEY (utilisateur_id)
                REFERENCES utilisateurs(id)
                ON DELETE SET NULL
        ) ENGINE=InnoDB;
    `);

    const [admins] = await db.query(
        "SELECT id FROM utilisateurs WHERE role = 'admin' LIMIT 1"
    );

    if (!admins.length) {
        const email = "admin@taxibe.mg";
        const password = hashPassword("Admin@1234");

        await db.query(
            `INSERT INTO utilisateurs
                (nom, email, mot_de_passe, role, actif)
             VALUES (?, ?, ?, 'admin', 1)`,
            ["Administrateur", email, password]
        );

        console.log("Compte admin créé : admin@taxibe.mg / Admin@1234");
    }
}

module.exports = {
    initDb,
    hashPassword
};
