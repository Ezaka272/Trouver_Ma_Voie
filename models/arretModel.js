const db = require("../config/db");

// ==============================
// Tous les arrêts
// ==============================
exports.getAll = async () => {

    const [rows] = await db.query(`
        SELECT
            a.id,
            a.nom,
            a.latitude,
            a.longitude,

            GROUP_CONCAT(
                l.numero
                ORDER BY la.ordre
                SEPARATOR ', '
            ) AS lignes,

            GROUP_CONCAT(
                la.ordre
                ORDER BY la.ordre
                SEPARATOR ', '
            ) AS ordres

        FROM arret AS a

        LEFT JOIN ligne_arret AS la
            ON la.arret_id = a.id

        LEFT JOIN ligne AS l
            ON l.id = la.ligne_id

        GROUP BY
            a.id,
            a.nom,
            a.latitude,
            a.longitude

        ORDER BY a.nom ASC
    `);

    return rows;
};


// ==============================
// Un arrêt par ID
// ==============================
exports.getById = async (id) => {

    const [rows] = await db.query(
        `
        SELECT
            a.*,
            la.ligne_id,
            la.ordre
        FROM arret AS a

        LEFT JOIN ligne_arret AS la
            ON la.arret_id = a.id

        WHERE a.id = ?

        ORDER BY la.ordre ASC

        LIMIT 1
        `,
        [id]
    );

    return rows[0];
};


// ==============================
// Ajouter un arrêt
// ==============================
exports.create = async (arret) => {

    const {
        nom,
        latitude,
        longitude,
        ligne_id,
        ordre
    } = arret;

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const [result] = await connection.query(
            `
            INSERT INTO arret
            (nom, latitude, longitude)
            VALUES (?, ?, ?)
            `,
            [
                nom,
                latitude,
                longitude
            ]
        );

        if (ligne_id) {

            await connection.query(
                `
                INSERT INTO ligne_arret
                (ligne_id, arret_id, ordre)
                VALUES (?, ?, ?)
                `,
                [
                    ligne_id,
                    result.insertId,
                    ordre || 1
                ]
            );
        }

        await connection.commit();

        return result.insertId;

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }
};


// ==============================
// Modifier un arrêt
// ==============================
exports.update = async (id, arret) => {

    const {
        nom,
        latitude,
        longitude,
        ligne_id,
        ordre
    } = arret;

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        await connection.query(
            `
            UPDATE arret
            SET
                nom = ?,
                latitude = ?,
                longitude = ?
            WHERE id = ?
            `,
            [
                nom,
                latitude,
                longitude,
                id
            ]
        );

        if (ligne_id) {

            await connection.query(
                `
                DELETE FROM ligne_arret
                WHERE arret_id = ?
                AND ligne_id = ?
                `,
                [
                    id,
                    ligne_id
                ]
            );

            await connection.query(
                `
                INSERT INTO ligne_arret
                (ligne_id, arret_id, ordre)
                VALUES (?, ?, ?)
                `,
                [
                    ligne_id,
                    id,
                    ordre || 1
                ]
            );
        }

        await connection.commit();

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }
};


// ==============================
// Supprimer un arrêt
// ==============================
exports.remove = async (id) => {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        await connection.query(
            "DELETE FROM ligne_arret WHERE arret_id = ?",
            [id]
        );

        await connection.query(
            "DELETE FROM arret WHERE id = ?",
            [id]
        );

        await connection.commit();

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }
};


// ==============================
// Recherche intelligente
// ==============================
exports.search = async (mot) => {

    const [rows] = await db.query(
        `
        SELECT
            id,
            nom
        FROM arret
        WHERE nom LIKE ?
        ORDER BY nom
        LIMIT 10
        `,
        [`%${mot}%`]
    );

    return rows;
};


// ==============================
// Arrêts d'une ligne
// ==============================
exports.getByLigne = async (ligneId) => {

    const [rows] = await db.query(
        `
        SELECT
            a.id,
            a.nom,
            a.latitude,
            a.longitude,
            la.ordre
        FROM ligne_arret AS la

        INNER JOIN arret AS a
            ON a.id = la.arret_id

        WHERE la.ligne_id = ?

        ORDER BY la.ordre ASC
        `,
        [ligneId]
    );

    return rows;
};