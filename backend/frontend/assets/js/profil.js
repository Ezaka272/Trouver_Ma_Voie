(() => {
    "use strict";

    const API = "/api";
    const image = document.getElementById("profileImage");
    const file = document.getElementById("photoProfil");
    const msg = document.getElementById("profilMessage");

    if (!document.getElementById("nomUtilisateur")) return;

    function message(text, type = "") {
        if (!msg) return;
        msg.textContent = text;
        msg.className = `auth-message ${type}`.trim();
    }

    async function load() {
        try {
            const response = await fetch(`${API}/utilisateurs/me`, {
                credentials: "include",
                cache: "no-store"
            });

            if (response.status === 401) {
                window.location.href = "/auth/login.html";
                return;
            }

            const user = await response.json();

            document.getElementById("nomUtilisateur").textContent = user.nom || "-";
            document.getElementById("emailUtilisateur").textContent = user.email || "-";

            const title = document.getElementById("nomTitre");
            if (title) title.textContent = user.nom || "Profil";

            const fav = document.getElementById("nbFavorisProfil");
            if (fav) fav.textContent = user.favoris || 0;

            if (user.photo && image) {
                image.src = user.photo;
            }
        } catch (error) {
            console.error("Profil :", error);
            message("Impossible de charger votre profil.", "error");
        }
    }

    if (file) {
        file.addEventListener("change", () => {
            const selected = file.files?.[0];
            if (!selected) return;

            if (!selected.type.startsWith("image/")) {
                message("Choisissez une image.", "error");
                file.value = "";
                return;
            }

            if (selected.size > 5 * 1024 * 1024) {
                message("5 Mo maximum.", "error");
                file.value = "";
                return;
            }

            const reader = new FileReader();

            reader.onload = async () => {
                try {
                    if (image) image.src = reader.result;

                    const response = await fetch(`${API}/utilisateurs/me/photo`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ image: reader.result })
                    });

                    const data = await response.json().catch(() => ({}));

                    if (!response.ok) {
                        throw new Error(data.message || "Erreur lors de l'enregistrement.");
                    }

                    if (image && data.photo) image.src = data.photo;

                    message("Photo enregistrée.", "success");
                } catch (error) {
                    message(error.message, "error");
                }
            };

            reader.readAsDataURL(selected);
        });
    }

    const modifier = document.getElementById("modifierProfil");

    if (modifier) {
        modifier.addEventListener("click", async () => {
            const oldNom = document.getElementById("nomUtilisateur").textContent;
            const oldEmail = document.getElementById("emailUtilisateur").textContent;

            const nom = prompt("Nom", oldNom);
            if (nom === null) return;

            const email = prompt("Email", oldEmail);
            if (email === null) return;

            try {
                const response = await fetch(`${API}/utilisateurs/me`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        nom: nom.trim(),
                        email: email.trim()
                    })
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.message || "Modification impossible.");
                }

                message("Profil mis à jour.", "success");
                load();
            } catch (error) {
                message(error.message, "error");
            }
        });
    }

    const logout = document.getElementById("deconnexion");

    if (logout) {
        logout.addEventListener("click", async () => {
            try {
                await fetch(`${API}/auth/logout`, {
                    method: "POST",
                    credentials: "include"
                });
            } finally {
                window.location.href = "/index.html";
            }
        });
    }

    load();
})();
