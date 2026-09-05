(() => {
    "use strict";

    const params = new URLSearchParams(window.location.search);
    const depart = (params.get("depart") || "").trim();
    const destination = (params.get("destination") || "").trim();

    const box = document.getElementById("listeResultats");
    const txtDepart = document.getElementById("txtDepart");
    const txtDestination = document.getElementById("txtDestination");

    if (txtDepart) txtDepart.textContent = depart || "-";
    if (txtDestination) txtDestination.textContent = destination || "-";

    if (!box) return;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function afficherMessage(message, type = "") {
        box.innerHTML = `
            <div class="result-message ${type}">
                <i class="fa-solid ${type === "error"
                    ? "fa-triangle-exclamation"
                    : "fa-route"}"></i>
                <p>${escapeHtml(message)}</p>
                <a href="index.html" class="btn-stop">
                    <i class="fa-solid fa-arrow-left"></i>
                    Nouvelle recherche
                </a>
            </div>
        `;
    }

    function normalize(value) {
        return String(value || "")
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    async function getJSON(url) {
        const response = await fetch(url, {
            cache: "no-store",
            credentials: "include",
            headers: { "Accept": "application/json" }
        });

        const contentType = response.headers.get("content-type") || "";

        // This prevents the page from trying to parse a returned HTML document.
        if (!contentType.includes("application/json")) {
            const text = await response.text();
            throw new Error(
                `Le serveur a renvoyé une page HTML au lieu de JSON (${response.status}). ` +
                `Vérifiez que TaxiBe est lancé avec "node backend/server.js".`
            );
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Erreur HTTP ${response.status}`);
        }

        return data;
    }

    async function rechercher() {
        if (!depart || !destination) {
            afficherMessage("Départ ou destination manquant.");
            return;
        }

        box.innerHTML = `
            <div class="result-message">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Recherche de votre trajet...</p>
            </div>
        `;

        let lignes = [];

        // A. Search by stops in ligne_arret.
        try {
            const data = await getJSON(
                `/api/lignes/trajet?depart=${encodeURIComponent(depart)}&destination=${encodeURIComponent(destination)}`
            );
            lignes = Array.isArray(data) ? data : [];
        } catch (error) {
            console.warn("Recherche par arrêts :", error.message);
        }

        // B. Fallback: some databases store depart/destination directly in ligne.
        if (!lignes.length) {
            try {
                const data = await getJSON("/api/lignes");
                const all = Array.isArray(data) ? data : [];

                const d = normalize(depart);
                const dest = normalize(destination);

                lignes = all.filter(ligne => {
                    const ld = normalize(ligne.depart);
                    const la = normalize(ligne.destination);

                    return (
                        (ld === d && la === dest) ||
                        (ld.includes(d) && la.includes(dest))
                    );
                });
            } catch (error) {
                console.warn("Recherche de secours :", error.message);
            }
        }

        if (!lignes.length) {
            afficherMessage(
                `Aucune ligne trouvée pour « ${depart} » → « ${destination} ».`
            );
            return;
        }

        afficherResultats(lignes);
    }

    function afficherResultats(lignes) {
        box.innerHTML = "";

        lignes.forEach(ligne => {
            const card = document.createElement("article");
            card.className = "result-card";

            const color = ligne.couleur || "#16C65B";
            const prix = ligne.prix ?? ligne.tarif ?? "-";
            const temps = ligne.temps ?? "-";

            card.innerHTML = `
                <div class="result-header">
                    <div class="result-line-info">
                        <div class="badge-ligne" style="background:${escapeHtml(color)}">
                            ${escapeHtml(ligne.numero || "-")}
                        </div>

                        <div class="result-title">
                            <h3>${escapeHtml(ligne.depart || depart)}</h3>
                            <p>${escapeHtml(ligne.destination || destination)}</p>
                        </div>
                    </div>

                    <div class="prix">${escapeHtml(prix)} Ar</div>
                </div>

                <div class="infos">
                    <div class="info">
                        <strong>${escapeHtml(temps)}</strong>
                        <span>minutes</span>
                    </div>

                    <div class="info">
                        <strong>${escapeHtml(ligne.numero || "-")}</strong>
                        <span>Ligne</span>
                    </div>

                    <div class="info">
                        <strong>Direct</strong>
                        <span>Trajet</span>
                    </div>
                </div>

                <div class="actions">
                    <button class="btn-stop stops" type="button">
                        <i class="fa-solid fa-location-dot"></i>
                        Voir les arrêts
                    </button>

                    <button class="btn-map map" type="button">
                        <i class="fa-solid fa-map-location-dot"></i>
                        Carte
                    </button>

                    <button class="btn-stop fav" type="button"
                            title="Ajouter aux favoris">
                        <i class="fa-regular fa-star"></i>
                    </button>
                </div>
            `;

            const openMap = () => {
                if (!ligne.id) {
                    alert("Cette ligne n'a pas d'identifiant.");
                    return;
                }

                window.location.href =
                    `carte.html?ligne=${encodeURIComponent(ligne.id)}`;
            };

                card.querySelector(".stops").addEventListener("click", openMap);
            card.querySelector(".map").addEventListener("click", openMap);

            card.querySelector(".fav").addEventListener("click", async event => {
                const button = event.currentTarget;

                if (!ligne.id) {
                    alert("Cette ligne n'a pas d'identifiant.");
                    return;
                }

                try {
                    const response = await fetch(
                        `/api/favoris/${encodeURIComponent(ligne.id)}`,
                        {
                            method: "POST",
                            credentials: "include",
                            headers: { "Accept": "application/json" }
                        }
                    );

                    const contentType =
                        response.headers.get("content-type") || "";

                    if (response.status === 401) {
                        window.location.href = "/auth/login.html";
                        return;
                    }

                    const data = contentType.includes("application/json")
                        ? await response.json()
                        : {};

                    if (!response.ok) {
                        throw new Error(
                            data.message || "Impossible d'ajouter ce favori."
                        );
                    }

                    button.innerHTML =
                        '<i class="fa-solid fa-star"></i>';
                    button.classList.add("selected");
                } catch (error) {
                    alert(error.message);
                }
            });

            box.appendChild(card);
        });
    }

    rechercher();
})();
