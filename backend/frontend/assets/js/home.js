(() => {
    "use strict";

    const API_ARRETS = "/api/arrets/search";
    const API_LIGNES = "/api/lignes";

    const depart = document.getElementById("depart");
    const destination = document.getElementById("destination");
    const btnRecherche = document.getElementById("btnRecherche");
    const listeDepart = document.getElementById("listeDepart");
    const listeDestination = document.getElementById("listeDestination");

    let departId = null;
    let destinationId = null;

    if (!depart || !destination || !btnRecherche) return;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    async function suggest(input, list, setId) {
        const q = input.value.trim();
        setId(null);

        if (q.length < 2) {
            list.innerHTML = "";
            list.style.display = "none";
            return;
        }

        try {
            const response = await fetch(
                `${API_ARRETS}?q=${encodeURIComponent(q)}`,
                { cache: "no-store" }
            );

            if (!response.ok) throw new Error("Recherche impossible.");

            const data = await response.json();
            const arrets = Array.isArray(data) ? data : [];

            list.innerHTML = "";

            if (!arrets.length) {
                list.style.display = "none";
                return;
            }

            arrets.forEach((arret) => {
                const item = document.createElement("button");
                item.type = "button";
                item.className = "suggestion";
                item.innerHTML = `
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${escapeHtml(arret.nom)}</span>
                `;

                item.addEventListener("click", () => {
                    input.value = arret.nom;
                    setId(arret.id);
                    list.innerHTML = "";
                    list.style.display = "none";
                });

                list.appendChild(item);
            });

            list.style.display = "block";
        } catch (error) {
            console.warn("Suggestions indisponibles :", error);
            list.innerHTML = "";
            list.style.display = "none";
        }
    }

    depart.addEventListener("input", () => {
        suggest(depart, listeDepart, value => { departId = value; });
    });

    destination.addEventListener("input", () => {
        suggest(destination, listeDestination, value => { destinationId = value; });
    });

    document.addEventListener("click", (event) => {
        if (!depart.contains(event.target) && !listeDepart.contains(event.target)) {
            listeDepart.innerHTML = "";
            listeDepart.style.display = "none";
        }

        if (!destination.contains(event.target) && !listeDestination.contains(event.target)) {
            listeDestination.innerHTML = "";
            listeDestination.style.display = "none";
        }
    });

    // Important:
    // We do NOT require departId/destinationId anymore.
    // The user can type the stop names manually and go to resultat.html.
    btnRecherche.addEventListener("click", () => {
        const d = depart.value.trim();
        const dest = destination.value.trim();

        if (!d || !dest) {
            alert("Veuillez saisir un départ et une destination.");
            return;
        }

        window.location.href =
            `resultat.html?depart=${encodeURIComponent(d)}&destination=${encodeURIComponent(dest)}`;
    });

    [depart, destination].forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                btnRecherche.click();
            }
        });
    });

    async function chargerPopulaires() {
        const box = document.getElementById("popularLines");
        if (!box) return;

        try {
            const response = await fetch(API_LIGNES, { cache: "no-store" });
            if (!response.ok) throw new Error("Impossible de charger les lignes.");

            const data = await response.json();
            const lignes = Array.isArray(data) ? data : [];

            if (!lignes.length) {
                box.innerHTML = "<p>Aucune ligne disponible.</p>";
                return;
            }

            box.innerHTML = "";

            lignes.slice(0, 6).forEach(ligne => {
                const card = document.createElement("button");
                card.type = "button";
                card.className = "ligne-card";

                card.innerHTML = `
                    <div class="numero" style="background:${escapeHtml(ligne.couleur || "#16C65B")}">
                        ${escapeHtml(ligne.numero)}
                    </div>
                    <div>
                        <h3>${escapeHtml(ligne.depart)}</h3>
                        <p>${escapeHtml(ligne.destination)}</p>
                    </div>
                    <i class="fa-solid fa-chevron-right"></i>
                `;

                card.addEventListener("click", () => {
                    if (!ligne.depart || !ligne.destination) {
                        alert("Cette ligne ne contient pas de trajet complet.");
                        return;
                    }

                    window.location.href =
                        `resultat.html?depart=${encodeURIComponent(ligne.depart)}&destination=${encodeURIComponent(ligne.destination)}`;
                });

                box.appendChild(card);
            });
       }catch (error) {
            console.error("Lignes :", error);
            box.innerHTML = "<p>Impossible de charger les lignes.</p>";
        }
    }

    async function chargerAvatar() {
        const img = document.getElementById("homeAvatar");
        if (!img) return;

        try {
            const response = await fetch("/api/auth/me", {
                credentials: "include",
                cache: "no-store"
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data.user?.photo) img.src = data.user.photo;
        } catch (_) {}
    }

    window.addEventListener("load", () => {
        document.querySelector(".loader")?.classList.add("hide");
    });

    chargerPopulaires();
    chargerAvatar();
})();
