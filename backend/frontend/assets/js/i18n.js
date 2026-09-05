(() => {
    "use strict";

    const DICT = {
        fr: {
            "Dashboard":"Dashboard","Lignes":"Lignes","Arrêts":"Arrêts","Tarifs":"Tarifs","Carte":"Carte",
            "Utilisateurs":"Utilisateurs","Paramètres":"Paramètres","Déconnexion":"Déconnexion",
            "Accueil":"Accueil","Favoris":"Favoris","Profil":"Profil","Rechercher":"Rechercher",
            "Rechercher une ligne":"Rechercher une ligne","Départ":"Départ","Destination":"Destination",
            "Résultats":"Résultats","Aucune ligne":"Aucune ligne","Enregistrer":"Enregistrer",
            "Annuler":"Annuler","Ajouter":"Ajouter","Modifier":"Modifier","Supprimer":"Supprimer",
            "Actif":"Actif","Inactif":"Inactif","Nom":"Nom","Email":"Email","Rôle":"Rôle",
            "Mot de passe":"Mot de passe","Administrateur":"Administrateur","Voyageur":"Voyageur",
            "Informations générales":"Informations générales","Nom de l'application":"Nom de l'application",
            "Ville":"Ville","Couleur principale":"Couleur principale","Couleur secondaire":"Couleur secondaire",
            "Mode d'affichage":"Mode d'affichage","Clair":"Clair","Sombre":"Sombre","Système":"Système",
            "Langue":"Langue","Français":"Français","Malagasy":"Malagasy","English":"English",
            "Paramètres enregistrés avec succès.":"Paramètres enregistrés avec succès.",
            "Erreur lors de l'enregistrement.":"Erreur lors de l'enregistrement.",
            "Bienvenue chez TaxiBe":"Bienvenue chez TaxiBe"
        },
        mg: {
            "Dashboard":"Tabilao","Lignes":"Lalana","Arrêts":"Toerana fiantsonana","Tarifs":"Saran-dalana",
            "Carte":"Sarintany","Utilisateurs":"Mpampiasa","Paramètres":"Fikirana","Déconnexion":"Hivoaka",
            "Accueil":"Fandraisana","Favoris":"Tiana","Profil":"Mombamomba","Rechercher":"Hikaroka",
            "Rechercher une ligne":"Mitadiava lalana","Départ":"Fiandohana","Destination":"Toerana haleha",
            "Résultats":"Vokatra","Aucune ligne":"Tsy misy lalana","Enregistrer":"Tehirizo",
            "Annuler":"Aoka ihany","Ajouter":"Ampio","Modifier":"Ovay","Supprimer":"Fafao",
            "Actif":"Miasa","Inactif":"Tsy miasa","Nom":"Anarana","Email":"Email","Rôle":"Andraikitra",
            "Mot de passe":"Tenimiafina","Administrateur":"Mpandrindra","Voyageur":"Mpandeha",
            "Informations générales":"Mombamomba ankapobeny","Nom de l'application":"Anaran'ny rindranasa",
            "Ville":"Tanàna","Couleur principale":"Loko lehibe","Couleur secondaire":"Loko faharoa",
            "Mode d'affichage":"Fomba fisehoana","Clair":"Mazava","Sombre":"Maizina","Système":"Rafitra",
            "Langue":"Fiteny","Français":"Frantsay","Malagasy":"Malagasy","English":"Anglisy",
            "Paramètres enregistrés avec succès.":"Voatahiry soa aman-tsara ny fikirana.",
            "Erreur lors de l'enregistrement.":"Nisy olana nandritra ny fitahirizana.",
            "Bienvenue chez TaxiBe":"Tongasoa eto amin'ny TaxiBe"
        },
        en: {
            "Dashboard":"Dashboard","Lignes":"Lines","Arrêts":"Stops","Tarifs":"Fares","Carte":"Map",
            "Utilisateurs":"Users","Paramètres":"Settings","Déconnexion":"Log out","Accueil":"Home",
            "Favoris":"Favorites","Profil":"Profile","Rechercher":"Search","Rechercher une ligne":"Search a line",
            "Départ":"Departure","Destination":"Destination","Résultats":"Results","Aucune ligne":"No line",
            "Enregistrer":"Save","Annuler":"Cancel","Ajouter":"Add","Modifier":"Edit","Supprimer":"Delete",
            "Actif":"Active","Inactif":"Inactive","Nom":"Name","Email":"Email","Rôle":"Role",
            "Mot de passe":"Password","Administrateur":"Administrator","Voyageur":"Passenger",
            "Informations générales":"General information","Nom de l'application":"Application name",
            "Ville":"City","Couleur principale":"Primary color","Couleur secondaire":"Secondary color",
            "Mode d'affichage":"Display mode","Clair":"Light","Sombre":"Dark","Système":"System",
            "Langue":"Language","Français":"French","Malagasy":"Malagasy","English":"English",
            "Paramètres enregistrés avec succès.":"Settings saved successfully.",
            "Erreur lors de l'enregistrement.":"Error while saving settings.",
            "Bienvenue chez TaxiBe":"Welcome to TaxiBe"
        }
    };

    const fallback = {
        fr: {code:"fr-FR", name:"Français"},
        mg: {code:"mg-MG", name:"Malagasy"},
        en: {code:"en-US", name:"English"}
    };

    let settings = {
        nom_application: "TaxiBe",
        ville: "Antananarivo",
        couleur_principale: "#0d6efd",
        couleur_secondaire: "#00b894",
        mode: "light",
        langue: "fr"
    };

    function translateString(value, lang) {
        const s = String(value ?? "").trim();
        return (DICT[lang] && DICT[lang][s]) || s;
    }

    function translateElement(el, lang) {
        if (el.dataset && el.dataset.i18n) {
            el.textContent = translateString(el.dataset.i18n, lang);
        }
        if (el.dataset && el.dataset.i18nPlaceholder) {
            el.placeholder = translateString(el.dataset.i18nPlaceholder, lang);
        }
        if (el.dataset && el.dataset.i18nTitle) {
            el.title = translateString(el.dataset.i18nTitle, lang);
        }

        for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const raw = node.nodeValue;
                const trimmed = raw.trim();
                if (!trimmed) continue;
                const translated = translateString(trimmed, lang);
                if (translated !== trimmed) {
                    node.nodeValue = raw.replace(trimmed, translated);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                translateElement(node, lang);
            }
        }
    }

    function applyTheme() {
        const root = document.documentElement;
        root.style.setProperty("--taxibe-primary", settings.couleur_principale);
        root.style.setProperty("--taxibe-secondary", settings.couleur_secondaire);

        let mode = settings.mode;
        if (mode === "system") {
            mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }

        document.body.classList.toggle("taxibe-dark", mode === "dark");
        document.documentElement.dataset.theme = mode;
        document.documentElement.lang = settings.langue;
        document.title = `${settings.nom_application || "TaxiBe"} | ${translateString(
            document.querySelector("main h1, main h2, title")?.textContent || "TaxiBe",
            settings.langue
        )}`;
    }

    function applyTranslations() {
        const lang = settings.langue;
        document.documentElement.lang = lang;
        document.querySelectorAll("[data-i18n], [data-i18n-placeholder], [data-i18n-title]").forEach(el => {
            translateElement(el, lang);
        });
        // Traduction progressive des textes courants déjà présents dans les pages.
        document.querySelectorAll("body *").forEach(el => {
            if (el.children.length === 0) translateElement(el, lang);
        });
        document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(el => {
            el.placeholder = translateString(el.placeholder, lang);
        });
    }

    async function loadSettings() {
        try {
            const response = await fetch("/api/parametres", { credentials: "include", cache: "no-store" });
            if (response.ok) {
                const data = await response.json();
                settings = {...settings, ...data};
            }
        } catch (_) {
            const saved = localStorage.getItem("taxibe_settings");
            if (saved) {
                try { settings = {...settings, ...JSON.parse(saved)}; } catch (_) {}
            }
        }

        localStorage.setItem("taxibe_settings", JSON.stringify(settings));
        applyTheme();
        applyTranslations();
        window.dispatchEvent(new CustomEvent("taxibe:settings", {detail: settings}));
    }

    window.TaxiBeI18n = {
        getSettings: () => ({...settings}),
        dictionary: DICT,
        translate: translateString,
        apply: () => { applyTheme(); applyTranslations(); }
    };

    const observer = new MutationObserver(() => {
        clearTimeout(window.__taxibeI18nTimer);
        window.__taxibeI18nTimer = setTimeout(applyTranslations, 50);
    });

    document.addEventListener("DOMContentLoaded", () => {
        loadSettings();
        observer.observe(document.body, {childList:true, subtree:true});
    });
})();
