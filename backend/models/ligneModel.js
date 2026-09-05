const db = require("../config/db");

class Ligne {

    static async getAll() {

        const [rows] = await db.query(`
            SELECT *
            FROM ligne
            ORDER BY CAST(numero AS UNSIGNED)
        `);

        return rows;
    }

    static async getById(id) {

        const [rows] = await db.query(`
            SELECT *
            FROM ligne
            WHERE id = ?
        `,[id]);

        return rows[0];
    }

    static async create(data){

        const {
            numero,
            depart,
            destination,
            prix,
            temps,
            couleur
        } = data;

        const [result] = await db.query(

            `INSERT INTO ligne
            (numero,depart,destination,prix,temps,couleur)
            VALUES(?,?,?,?,?,?)`,

            [
                numero,
                depart,
                destination,
                prix,
                temps,
                couleur || "#16C65B"
            ]

        );

        return result.insertId;

    }

    static async update(id,data){

        const {
            numero,
            depart,
            destination,
            prix,
            temps,
            couleur
        }=data;

        await db.query(

            `UPDATE ligne SET

            numero=?,
            depart=?,
            destination=?,
            prix=?,
            temps=?,
            couleur=?

            WHERE id=?`,

            [
                numero,
                depart,
                destination,
                prix,
                temps,
                couleur,
                id
            ]

        );

    }

    static async delete(id){

        await db.query(

            `DELETE FROM ligne
             WHERE id=?`,

            [id]

        );

    }

   static async rechercherTrajet(depart, destination) {
    const deptClean = depart ? depart.trim() : '';
    const destClean = destination ? destination.trim() : '';
    const [rows] = await db.query(
        `
        SELECT DISTINCT
            l.id,
            l.numero,
            l.depart AS terminus_depart,
            l.destination AS terminus_destination,
            l.prix,
            l.temps,
            l.couleur,
            ad.nom AS arret_depart_nom,
            aa.nom AS arret_destination_nom,
            ld.ordre AS ordre_depart,
            la.ordre AS ordre_arrivee
        FROM ligne l
        
        INNER JOIN ligne_arret ld ON l.id = ld.ligne_id
        INNER JOIN arret ad ON ld.arret_id = ad.id
        
        INNER JOIN ligne_arret la ON l.id = la.ligne_id
        INNER JOIN arret aa ON la.arret_id = aa.id
        WHERE 
            LOWER(ad.nom) LIKE LOWER(?)
        AND 
            LOWER(aa.nom) LIKE LOWER(?)
        ORDER BY l.numero ASC
        `,
        [`%${deptClean}%`, `%${destClean}%`]
    );

    return rows;
}

static async rechercherCorrespondance(depart, destination) {

    const [rows] = await db.query(

        `
        SELECT DISTINCT

            l1.id AS ligne1_id,
            l1.numero AS ligne1_numero,

            l2.id AS ligne2_id,
            l2.numero AS ligne2_numero,

            ac.nom AS correspondance

        FROM ligne l1

        INNER JOIN ligne_arret ld
            ON l1.id = ld.ligne_id

        INNER JOIN arret ad
            ON ld.arret_id = ad.id

        INNER JOIN ligne_arret lc1
            ON l1.id = lc1.ligne_id

        INNER JOIN arret ac
            ON lc1.arret_id = ac.id

        INNER JOIN ligne_arret lc2
            ON ac.id = lc2.arret_id

        INNER JOIN ligne l2
            ON lc2.ligne_id = l2.id

        INNER JOIN ligne_arret la
            ON l2.id = la.ligne_id

        INNER JOIN arret aa
            ON la.arret_id = aa.id

        WHERE

            ad.nom = ?
            AND aa.nom = ?
            AND l1.id <> l2.id

        `,

        [depart, destination]

    );

    return rows;

}

}




module.exports=Ligne;