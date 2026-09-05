(() => {
    "use strict";

    const box = document.getElementById("listeLignesUtilisateur");

    if (!box) return;

    /* =========================================
       CONFIGURATION
    ========================================= */

    const API_LIGNES = "/api/lignes";
    const API_FAVORIS = "/api/favoris";

    let lignes = [];
    let recherche = "";
    let filtre = "all";


    /* =========================================
       ELEMENTS OPTIONNELS
    ========================================= */

    const inputRecherche = document.getElementById("rechercheLigne");
    const triLignes = document.getElementById("triLignes");
    const nombreLignes = document.getElementById("nombreLignes");
    const aucuneLigne = document.getElementById("aucuneLigne");
    const clearSearch = document.getElementById("clearSearch");
    const filterButtons = document.querySelectorAll(".filter-btn");

    /* =========================================
       SECURITE HTML
    ========================================= */

    const esc = value =>
        String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    /* =========================================
       NORMALISATION RECHERCHE
    ========================================= */
    function normaliser(value) {

        return String(value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    }

    /* =========================================
       FAVORIS LOCAUX
       Permet de fonctionner même si l'API
       favoris n'est pas encore disponible.
    ========================================= */
    function getFavorisLocaux() {
        try {
            return JSON.parse(
                localStorage.getItem("taxibe_favoris_lignes")
            ) || [];

        } catch {
            return [];
        }
    }

    function sauvegarderFavorisLocaux(favoris) {
        localStorage.setItem(
            "taxibe_favoris_lignes",
            JSON.stringify(favoris)
        );
    }

    function estFavori(id) {
        return getFavorisLocaux()
            .map(Number)
            .includes(Number(id));
    }

    function ajouterFavoriLocal(id) {
        const favoris = getFavorisLocaux();
        if (!favoris.map(Number).includes(Number(id))) {
            favoris.push(Number(id));
        }
        sauvegarderFavorisLocaux(favoris);
    }

    function retirerFavoriLocal(id) {
        const favoris = getFavorisLocaux()
                .filter(value => Number(value) !== Number(id));
        sauvegarderFavorisLocaux(favoris);
    }

    /* =========================================
       CHARGER LES LIGNES
    ========================================= */
    async function load() {
        afficherChargement();
        try {
            const response = await fetch(API_LIGNES, {
                    method: "GET",
                    cache: "no-store",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                });

            const type = response.headers.get("content-type") || "";
            /*
             * Empêche le problème :
             * "je reçois une page HTML au lieu
             * des données JSON"
             */
            if (!type.includes("application/json")) {
                throw new Error(
                    "Le serveur n'a pas renvoyé les données des lignes au format JSON."
                );
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message ||"Impossible de charger les lignes.");
            }


            lignes = Array.isArray(data)? data: [];
          afficherLignes();
        }catch (error) {
            console.error(
                "Erreur chargement lignes :", error
            );

           box.innerHTML = `            
                <div class="empty-stops">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <strong>Impossible de charger les lignes</strong>
                    <p>
                        ${esc(error.message)}
                    </p>
                    <button
                        type="button"
                        id="retryLignes"
                        class="btn-stop">
                        <i class="fa-solid fa-rotate"></i>
                        Réessayer
                    </button>
                </div>             
            
            `;

            const retry = document.getElementById("retryLignes");
            if (retry) {
                retry.addEventListener("click", load);
            }
        }
    }

    /* =========================================
       CHARGEMENT
    ========================================= */
    function afficherChargement() {
        box.innerHTML = `
            <div class="empty-stops">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>
                    Chargement des lignes...
                </p>
            </div>
        `;
    }


    /* =========================================
       FILTRER
    ========================================= */

    function filtrerLignes() {

        let resultat =
            [...lignes];


        /* RECHERCHE */

        const texte = normaliser(recherche);

        if (texte) {
            resultat =
                resultat.filter(ligne => {
                    const numero = normaliser(ligne.numero);
                    const depart = normaliser(ligne.depart);
                    const destination = normaliser(ligne.destination);
                    return (numero.includes(texte) || depart.includes(texte) || destination.includes(texte)
                    );
                });
        }

        /* FAVORIS */
        if (filtre === "favorites") {
            resultat = resultat.filter(
                    ligne => estFavori(ligne.id)
                );
        }

        /* TRI */
        const valeurTri = triLignes?.value || "numero";
        resultat.sort((a, b) => {
            let A;
            let B;
            if (valeurTri === "depart") {
                A = normaliser(a.depart);
                B = normaliser(b.depart);
            }
            else if (
                valeurTri === "destination"
            ) {
                A = normaliser(a.destination);
                B = normaliser(b.destination);
            }
            else {
                A = normaliser(a.numero);
                B = normaliser(b.numero);
            }

            return A.localeCompare(
                B, "fr",
                {
                    numeric: true
                }
            );

        });
        return resultat;
    }


    /* =========================================
       AFFICHER LES LIGNES
    ========================================= */
    function afficherLignes() {
        const resultat = filtrerLignes();
        if (nombreLignes) {
            nombreLignes.textContent = resultat.length;
        }
        if (aucuneLigne) {
            aucuneLigne.hidden = resultat.length !== 0;
        }

        // if (!resultat.length) {
        //     box.innerHTML = `
        //         <div class="result-message">
        //             <i class="fa-solid fa-road"></i>
        //             <h3>
       //                 Aucune ligne trouvée
        //             </h3>
        //             <p>
        //                 Essayez une autre recherche
        //                 ou consultez toutes les lignes.
        //             </p>
        //         </div>
        //     `;
        //     return;
        // }

        box.innerHTML = "";
        resultat.forEach(
            ligne => {
                afficherCarteLigne(
                    ligne
                );
            }
        );
    }

    /* =========================================
       CARTE D'UNE LIGNE
    ========================================= */
    function afficherCarteLigne(ligne) {
        const card = document.createElement("article");
        card.className = "result-card";
        const favorite = estFavori(ligne.id);
        const couleur = ligne.couleur || "#16C65B";
        /*
         * Ton API semble utiliser "prix".
         * On accepte aussi "tarif".
         */
        const tarif = ligne.prix ?? ligne.tarif ?? "-";
        card.innerHTML = `
            <div class="result-header">
                <div class="result-line-info">
                    <div
                        class="badge-ligne"
                        style="background:${esc(couleur)}">
                        ${esc(
                            ligne.numero || "-"
                        )}
                    </div>
                    <div class="result-title">
                        <h3>
                            ${esc(
                                ligne.depart ||
                                "Départ inconnu"
                            )}
                        </h3>
                        <p>
                            <i class="fa-solid fa-arrow-down"></i>
                            ${esc(
                                ligne.destination ||
                                "Destination inconnue"
                            )}
                        </p>
                    </div>
                </div>
                <div class="prix">
                    ${esc(tarif)} Ar
                </div>
            </div>
            <div class="ligne-actions-user">
                <button
                    type="button"
                    class="btn-stop btn-favori
                    ${favorite ? "active" : ""}"
                    title="${
                        favorite
                            ? "Retirer des favoris"
                            : "Ajouter aux favoris"
                    }">

                    <i class="fa-${
                        favorite
                            ? "solid"
                            : "regular"
                    } fa-star"></i>

                    ${
                        favorite
                            ? "Favori"
                            : "Ajouter"
                    }

                </button>


                <button
                    type="button"
                    class="btn-stop btn-carte">

                    <i class="fa-solid fa-map-location-dot"></i>

                    Voir la carte

                </button>


                <button
                    type="button"
                    class="btn-stop btn-arrets">

                    <i class="fa-solid fa-location-dot"></i>

                    Voir les arrêts

                </button>

            </div>

        `;


        /* =====================================
           FAVORI
        ===================================== */

        const btnFavori =
            card.querySelector(
                ".btn-favori"
            );


        btnFavori.addEventListener(
            "click",
            async () => {

                await toggleFavori(
                    ligne,
                    btnFavori
                );

            }
        );


        /* =====================================
           CARTE
        ===================================== */

        const btnCarte =
            card.querySelector(
                ".btn-carte"
            );


        btnCarte.addEventListener(
            "click",
            () => {

                ouvrirCarte(
                    ligne
                );

            }
        );


        /* =====================================
           ARRETS
        ===================================== */

        const btnArrets =
            card.querySelector(
                ".btn-arrets"
            );


        btnArrets.addEventListener(
            "click",
            () => {

                ouvrirCarte(
                    ligne
                );

            }
        );


        box.appendChild(
            card
        );

    }


    /* =========================================
       AJOUTER / RETIRER FAVORI
    ========================================= */

    async function toggleFavori(
        ligne,
        button
    ) {

        if (!ligne.id) {

            alert(
                "Cette ligne ne possède pas d'identifiant."
            );

            return;

        }


        const favorite =
            estFavori(ligne.id);


        button.disabled = true;


        try {

            /*
             * On essaie d'abord ton API.
             */

            const response =
                await fetch(
                    `${API_FAVORIS}/${encodeURIComponent(ligne.id)}`,
                    {
                        method:
                            favorite
                                ? "DELETE"
                                : "POST",

                        credentials:
                            "include",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            /*
             * Si ton endpoint n'existe pas encore,
             * fonctionnement local.
             */

            if (
                response.status === 404 ||
                response.status === 405
            ) {

                utiliserFavoriLocal(
                    ligne.id,
                    favorite
                );

                return;

            }


            /*
             * Si l'utilisateur n'est pas connecté.
             */

            if (response.status === 401) {

                alert(
                    "Connectez-vous pour gérer vos favoris."
                );

                return;

            }


            const type =
                response.headers.get(
                    "content-type"
                ) || "";


            if (
                type.includes(
                    "application/json"
                )
            ) {

                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Erreur avec les favoris."
                    );

                }

            }


            /*
             * API OK
             */

            utiliserFavoriLocal(
                ligne.id,
                favorite
            );

        }

        catch (error) {

            console.error(
                "Erreur favori :",
                error
            );


            /*
             * Fallback local
             */

            utiliserFavoriLocal(
                ligne.id,
                favorite
            );

        }

        finally {

            button.disabled =
                false;

            afficherLignes();

        }

    }


    /* =========================================
       FAVORI LOCAL
    ========================================= */

    function utiliserFavoriLocal(
        id,
        dejaFavori
    ) {

        if (dejaFavori) {

            retirerFavoriLocal(
                id
            );

        }

        else {

            ajouterFavoriLocal(
                id
            );

        }

    }


    /* =========================================
       OUVRIR CARTE
    ========================================= */

    function ouvrirCarte(ligne) {

        if (!ligne.id) {

            alert(
                "Cette ligne ne possède pas d'identifiant."
            );

            return;

        }


        window.location.href =
            `carte.html?ligne=${encodeURIComponent(
                ligne.id
            )}`;

    }


    /* =========================================
       RECHERCHE
    ========================================= */

    if (inputRecherche) {

        inputRecherche.addEventListener(
            "input",
            () => {

                recherche =
                    inputRecherche.value;

                afficherLignes();

            }
        );

    }


    /* =========================================
       EFFACER
    ========================================= */

    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            () => {

                if (inputRecherche) {

                    inputRecherche.value =
                        "";

                }


                recherche =
                    "";

                afficherLignes();

            }
        );

    }


    /* =========================================
       TRI
    ========================================= */

    if (triLignes) {

        triLignes.addEventListener(
            "change",
            afficherLignes
        );

    }


    /* =========================================
       FILTRES
    ========================================= */

    filterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    filterButtons.forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    filtre =
                        button.dataset.filter ||
                        "all";


                    afficherLignes();

                }
            );

        }
    );


    /* =========================================
       DEMARRAGE
    ========================================= */

    load();

})();