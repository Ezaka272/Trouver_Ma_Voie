(() => {
    const $ = id => document.getElementById(id);

    function validHex(v) {
        return /^#[0-9a-fA-F]{6}$/.test(v);
    }

    function setColor(colorId, textId, value) {
        if (!validHex(value)) return;
        $(colorId).value = value;
        $(textId).value = value;
    }

    function preview() {
        const name = $("nom_application").value.trim() || "TaxiBe";
        const city = $("ville").value.trim() || "Antananarivo";
        const primary = $("couleur_principale").value;
        $("previewName").textContent = name;
        $("previewCity").textContent = city;
        $("preview").style.background = primary;
        document.documentElement.style.setProperty("--taxibe-primary", primary);
    }

    async function load() {
        try {
            const r = await fetch("/api/parametres", {credentials:"include", cache:"no-store"});
            if (!r.ok) throw new Error("Impossible de charger les paramètres.");
            const s = await r.json();

            $("nom_application").value = s.nom_application || "TaxiBe";
            $("ville").value = s.ville || "Antananarivo";
            $("langue").value = s.langue || "fr";
            $("mode").value = s.mode || "light";
            setColor("couleur_principale", "couleur_principale_text", s.couleur_principale || "#0d6efd");
            setColor("couleur_secondaire", "couleur_secondaire_text", s.couleur_secondaire || "#00b894");
            preview();
        } catch (e) {
            console.error(e);
        }
    }

    async function save() {
        const message = $("settingsMessage");
        const payload = {
            nom_application: $("nom_application").value.trim() || "TaxiBe",
            ville: $("ville").value.trim() || "Antananarivo",
            couleur_principale: $("couleur_principale_text").value.trim(),
            couleur_secondaire: $("couleur_secondaire_text").value.trim(),
            mode: $("mode").value,
            langue: $("langue").value
        };

        if (!validHex(payload.couleur_principale) || !validHex(payload.couleur_secondaire)) {
            message.textContent = "Couleur invalide.";
            return;
        }

        try {
            const r = await fetch("/api/parametres", {
                method: "PUT",
                credentials: "include",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify(payload)
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.message || "Erreur lors de l'enregistrement.");

            localStorage.setItem("taxibe_settings", JSON.stringify(data.settings));
            message.textContent = data.message;
            message.style.color = payload.couleur_principale;

            if (window.TaxiBeI18n) {
                window.TaxiBeI18n.apply();
            }
            preview();

            // Recharge pour que la langue soit appliquée à toute la page immédiatement.
            setTimeout(() => location.reload(), 250);
        } catch (e) {
            message.textContent = e.message;
            message.style.color = "#dc2626";
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        load();

        $("couleur_principale").addEventListener("input", e => {
            setColor("couleur_principale", "couleur_principale_text", e.target.value);
            preview();
        });
        $("couleur_principale_text").addEventListener("input", e => {
            if (validHex(e.target.value)) setColor("couleur_principale", "couleur_principale_text", e.target.value);
            preview();
        });
        $("couleur_secondaire").addEventListener("input", e => {
            setColor("couleur_secondaire", "couleur_secondaire_text", e.target.value);
            document.documentElement.style.setProperty("--taxibe-secondary", e.target.value);
        });
        $("couleur_secondaire_text").addEventListener("input", e => {
            if (validHex(e.target.value)) setColor("couleur_secondaire", "couleur_secondaire_text", e.target.value);
        });

        $("nom_application").addEventListener("input", preview);
        $("ville").addEventListener("input", preview);
        $("mode").addEventListener("change", () => {
            document.body.classList.toggle("taxibe-dark", $("mode").value === "dark");
        });
        $("saveSettings").addEventListener("click", save);
        $("logoutLink").addEventListener("click", async e => {
            e.preventDefault();
            await fetch("/api/auth/logout", {method:"POST", credentials:"include"});
            location.href = "/index.html";
        });
    });
})();
