const Arret = require("../models/arretModel");

// ==============================
// Tous les arrêts
// ==============================
exports.getAll = async (req, res) => {

    try {

        const arrets = await Arret.getAll();

        res.json(arrets);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur serveur"
        });

    }

};

// ==============================
// Un arrêt
// ==============================
exports.getById = async (req, res) => {

    try {

        const arret = await Arret.getById(req.params.id);

        if (!arret) {

            return res.status(404).json({
                message: "Arrêt introuvable"
            });

        }

        res.json(arret);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur serveur"
        });

    }

};

// ==============================
// Ajouter
// ==============================
exports.create = async (req, res) => {

    try {

        const id = await Arret.create(req.body);

        res.status(201).json({

            message: "Arrêt ajouté avec succès",

            id

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur serveur"
        });

    }

};

// ==============================
// Modifier
// ==============================
exports.update = async (req, res) => {

    try {

        const arret = await Arret.getById(req.params.id);

        if (!arret) {

            return res.status(404).json({
                message: "Arrêt introuvable"
            });

        }

        await Arret.update(req.params.id, req.body);

        res.json({

            message: "Arrêt modifié avec succès"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur serveur"
        });

    }

};

// ==============================
// Supprimer
// ==============================
exports.remove = async (req, res) => {

    try {

        const arret = await Arret.getById(req.params.id);

        if (!arret) {

            return res.status(404).json({
                message: "Arrêt introuvable"
            });

        }

        await Arret.remove(req.params.id);

        res.json({

            message: "Arrêt supprimé avec succès"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur serveur"
        });

    }

};

// ==============================
// Recherche intelligente
// ==============================
exports.search = async (req, res) => {

    try {

        const mot = req.query.q || "";

        const arrets = await Arret.search(mot);

        res.json(arrets);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur serveur"
        });

    }

};

// ==============================
// Arrêts d'une ligne
// ==============================
exports.getByLigne = async (req, res) => {

    try {

        const { ligneId } = req.params;

        const arrets = await Arret.getByLigne(ligneId);

        res.json(arrets);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur serveur"
        });

    }

};