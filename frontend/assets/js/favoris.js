(() => {
    "use strict";

    const box = document.getElementById("favorisListe");
    if (!box) return;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    async function load() {
        box.innerHTML = `
            <div class="result-message">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Chargement de vos favoris...</p>
            </div>
        `;

        try {
            const response = await fetch("/api/favoris", {
                credentials: "include",
                cache: "no-store"
            });

            if (response.status === 401) {
                box.innerHTML = `
                    <div class="empty-stops">
                        <i class="fa-regular fa-heart"></i>
                        <p>Connectez-vous pour gérer vos favoris.</p>
                        <a class="btn-stop" href="/auth/login.html">Se connecter</a>
                    </div>
                `;
                return;
            }

            const data = await response.json().catch(() => []);

            if (!response.ok) {
                throw new Error(data.message || "Impossible de charger les favoris.");
            }

            const favoris = Array.isArray(data) ? data : [];

            if (!favoris.length) {
                box.innerHTML = `
                    <div class="empty-stops">
                        <i class="fa-regular fa-heart"></i>
                        <p>Aucun favori pour le moment.</p>
                        <a class="btn-stop" href="index.html">Rechercher une ligne</a>
                    </div>
                `;
                return;
            }

            box.innerHTML = "";

            favoris.forEach((ligne) => {
                const card = document.createElement("article");
                card.className = "ligne-card";

                card.innerHTML = `
                    <div class="numero" style="background:${escapeHtml(ligne.couleur || "#16C65B")}">
                        ${escapeHtml(ligne.numero)}
                    </div>

                    <div class="favorite-info">
                        <h3>${escapeHtml(ligne.depart)}</h3>
                        <p>${escapeHtml(ligne.destination)}</p>

                        <div class="favorite-actions">
                            <button class="btn-map" type="button">
                                <i class="fa-solid fa-map"></i> Voir
                            </button>

                            <button class="btn-stop remove" type="button">
                                <i class="fa-solid fa-trash"></i> Retirer
                            </button>
                        </div>
                    </div>
                `;

                card.querySelector(".btn-map").addEventListener("click", () => {
                    window.location.href =
                        `carte.html?ligne=${encodeURIComponent(ligne.ligne_id || ligne.id)}`;
                });

                card.querySelector(".remove").addEventListener("click", async () => {
                    try {
                        const response = await fetch(
                            `/api/favoris/${encodeURIComponent(ligne.ligne_id || ligne.id)}`,
                            {
                                method: "DELETE",
                                credentials: "include"
                            }
                        );

                        if (!response.ok) {
                            const data = await response.json().catch(() => ({}));
                            throw new Error(data.message || "Suppression impossible.");
                        }

                        load();
                    } catch (error) {
                        alert(error.message);
                    }
                });

                box.appendChild(card);
            });
        } catch (error) {
            console.error("Favoris :", error);
            box.innerHTML = `
                <div class="empty-stops">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    load();
})();
