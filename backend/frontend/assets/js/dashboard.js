async function chargerDashboard() {
    const nbLignes = document.getElementById("nbLignes");
    const nbArrets = document.getElementById("nbArrets");
    const nbRecherche = document.getElementById("nbRecherche");
    const nbFavoris = document.getElementById("nbFavoris");
    const dernieresLignes = document.getElementById("dernieresLignes");
    const date = document.getElementById("date");
    const activite = document.getElementById("activite");

    try {
        const response = await fetch("/api/stats", {
            credentials: "include",
            cache: "no-store"
        });

        if (response.status === 401 || response.status === 403) {
            location.href = "/auth/login.html?admin=1";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Impossible de charger le dashboard.");
        }

        if (nbLignes) nbLignes.textContent = data.lignes ?? 0;
        if (nbArrets) nbArrets.textContent = data.arrets ?? 0;
        if (nbRecherche) nbRecherche.textContent = data.recherches ?? 0;
        if (nbFavoris) nbFavoris.textContent = data.favoris ?? 0;

        if (dernieresLignes) {
            const lignes = Array.isArray(data.recentes) ? data.recentes : [];

            dernieresLignes.innerHTML = lignes.map((ligne) => `
                <tr>
                    <td>${ligne.numero ?? ""}</td>
                    <td>${ligne.depart ?? ""}</td>
                    <td>${ligne.destination ?? ""}</td>
                </tr>
            `).join("") || `
                <tr>
                    <td colspan="3">Aucune ligne</td>
                </tr>
            `;
        }

        if (date) {
            date.textContent = new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
        }

        if (activite) {
            activite.innerHTML = `
                <div class="activity">
                    <i class="fa-solid fa-road"></i>
                    <div>
                        <strong>${data.lignes ?? 0} lignes</strong>
                        <p>référencées</p>
                    </div>
                </div>

                <div class="activity">
                    <i class="fa-solid fa-location-dot"></i>
                    <div>
                        <strong>${data.arrets ?? 0} arrêts</strong>
                        <p>référencés</p>
                    </div>
                </div>

                <div class="activity">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <div>
                        <strong>${data.recherches ?? 0} recherches</strong>
                        <p>enregistrées</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Erreur dashboard :", error);
    }
}

chargerDashboard();
