const Ligne = require("../models/ligneModel");

class LigneController {

    static async getAll(req, res) {

        try {

            const lignes = await Ligne.getAll();

            res.status(200).json(lignes);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Erreur lors de la récupération des lignes."
            });

        }

    }

    static async getById(req, res) {

        try {

            const { id } = req.params;

            const ligne = await Ligne.getById(id);

            if (!ligne) {

                return res.status(404).json({
                    success: false,
                    message: "Ligne introuvable."
                });

            }

            res.status(200).json(ligne);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Erreur serveur."
            });

        }

    }

    static async create(req, res) {

        try {

            const {
                numero,
                depart,
                destination,
                prix,
                temps,
                couleur
            } = req.body;

            if (
                !numero ||
                !depart ||
                !destination ||
                !prix ||
                !temps
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Tous les champs sont obligatoires."
                });

            }

            const id = await Ligne.create({
                numero,
                depart,
                destination,
                prix,
                temps,
                couleur
            });

            res.status(201).json({
                success: true,
                message: "Ligne ajoutée avec succès.",
                id
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Impossible d'ajouter la ligne."
            });

        }

    }

    static async update(req, res) {

        try {

            const { id } = req.params;

            const ligne = await Ligne.getById(id);

            if (!ligne) {

                return res.status(404).json({
                    success: false,
                    message: "Ligne inexistante."
                });

            }

            await Ligne.update(id, req.body);

            res.status(200).json({
                success: true,
                message: "Ligne modifiée avec succès."
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Erreur lors de la modification."
            });

        }

    }

    static async delete(req, res) {

        try {

            const { id } = req.params;

            const ligne = await Ligne.getById(id);

            if (!ligne) {

                return res.status(404).json({
                    success: false,
                    message: "Ligne inexistante."
                });

            }

            await Ligne.delete(id);

            res.status(200).json({
                success: true,
                message: "Ligne supprimée."
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Erreur lors de la suppression."
            });

        }

    }

    static async rechercherTrajet(req, res) {

    try {

        const { depart, destination } = req.query;

        const lignes = await Ligne.rechercherTrajet(
            depart,
            destination
        );

        res.json(lignes);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur serveur"
        });

    }

}

static async rechercherCorrespondance(req, res) {
   

   


    try {
          console.log("Route correspondance appelée");

    res.json({ test: "OK" });
        const { depart, destination } = req.query;

        const result = await Ligne.rechercherCorrespondance(
            depart,
            destination
        );

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur serveur"
        });

    }

}
}



module.exports = LigneController;