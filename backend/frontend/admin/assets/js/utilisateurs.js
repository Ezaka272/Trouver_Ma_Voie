const tbody = document.querySelector("tbody");
const search = document.getElementById("recherche");

const modal = document.getElementById("modal");
const titreModal = document.getElementById("titreModal");
const nomInput = document.getElementById("nom");
const emailInput = document.getElementById("email");
const roleInput = document.getElementById("role");
const passwordInput = document.getElementById("motDePasse");
const btnAjouter = document.getElementById("btnAjouter");
const btnAnnuler = document.getElementById("annuler");
const btnEnregistrer = document.getElementById("enregistrer");

let editId = null;
let utilisateurs = [];

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function afficherErreur(message) {
    console.error(message);
    alert(message);
}

async function load() {
    try {
        const response = await fetch("/api/utilisateurs", {
            credentials: "include",
            cache: "no-store"
        });

        if (response.status === 401 || response.status === 403) {
            location.href = "/auth/login.html?admin=1";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Impossible de charger les utilisateurs.");
        }

        utilisateurs = Array.isArray(data) ? data : [];
        renderUsers();
    } catch (error) {
        afficherErreur(error.message);
    }
}

function renderUsers() {
    if (!tbody) return;

    const query = String(search?.value || "").trim().toLowerCase();

    const filtered = utilisateurs.filter((u) =>
        [u.nom, u.email, u.role, u.actif ? "actif" : "inactif"]
            .join(" ")
            .toLowerCase()
            .includes(query)
    );

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">Aucun utilisateur trouvé.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map((u) => {
        const actif = Number(u.actif) === 1;
        const isSelf = Number(u.id) === Number(window.ADMIN_USER_ID);

        return `
            <tr>
                <td>${escapeHtml(u.nom)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${escapeHtml(u.role)}</td>
                <td>
                    <span class="status ${actif ? "status-active" : "status-inactive"}">
                        ${actif ? "Actif" : "Inactif"}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn-edit" type="button" data-action="edit" data-id="${u.id}" title="Modifier">
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        class="btn-status ${actif ? "danger" : "success"}"
                        type="button"
                        data-action="toggle"
                        data-id="${u.id}"
                        ${isSelf ? "disabled title=\"Vous ne pouvez pas désactiver votre propre compte\"" : ""}
                    >
                        <i class="fa-solid ${actif ? "fa-user-slash" : "fa-user-check"}"></i>
                        ${actif ? "Désactiver" : "Activer"}
                    </button>

                    <button
                        class="btn-delete"
                        type="button"
                        data-action="delete"
                        data-id="${u.id}"
                        ${isSelf ? "disabled title=\"Vous ne pouvez pas supprimer votre propre compte\"" : ""}
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function openModal(user = null) {
    editId = user ? Number(user.id) : null;

    titreModal.textContent = user
        ? "Modifier un utilisateur"
        : "Ajouter un utilisateur";

    nomInput.value = user?.nom || "";
    emailInput.value = user?.email || "";
    roleInput.value = user?.role || "voyageur";
    passwordInput.value = "";
    passwordInput.placeholder = user
        ? "Laisser vide pour conserver le mot de passe"
        : "Mot de passe (6 caractères minimum)";

    modal.style.display = "flex";
    nomInput.focus();
}

function closeModal() {
    editId = null;
    modal.style.display = "none";
}

btnAjouter?.addEventListener("click", () => openModal());
btnAnnuler?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
});

search?.addEventListener("input", renderUsers);

btnEnregistrer?.addEventListener("click", async () => {
    const nom = nomInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const role = roleInput.value;
    const password = passwordInput.value;

    if (nom.length < 2) {
        return afficherErreur("Le nom doit contenir au moins 2 caractères.");
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return afficherErreur("Veuillez saisir une adresse email valide.");
    }

    if (!["voyageur", "admin"].includes(role)) {
        return afficherErreur("Rôle invalide.");
    }

    if (!editId && password.length < 6) {
        return afficherErreur("Le mot de passe doit contenir au moins 6 caractères.");
    }

    if (editId && password && password.length < 6) {
        return afficherErreur("Le mot de passe doit contenir au moins 6 caractères.");
    }

    const body = { nom, email, role };
    if (password) body.password = password;

    btnEnregistrer.disabled = true;
    btnEnregistrer.textContent = "Enregistrement...";

    try {
        const response = await fetch(
            editId
                ? `/api/utilisateurs/${editId}`
                : "/api/utilisateurs",
            {
                method: editId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Enregistrement impossible.");
        }

        closeModal();
        await load();
    } catch (error) {
        afficherErreur(error.message);
    } finally {
        btnEnregistrer.disabled = false;
        btnEnregistrer.textContent = "Enregistrer";
    }
});

tbody?.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    const user = utilisateurs.find((u) => Number(u.id) === id);

    if (!user) return afficherErreur("Utilisateur introuvable.");

    if (action === "edit") {
        openModal(user);
        return;
    }

    if (action === "toggle") {
        await toggleUser(id, Number(user.actif) === 1 ? 0 : 1);
        return;
    }

    if (action === "delete") {
        await deleteUser(id);
    }
});

async function toggleUser(id, actif) {
    try {
        const response = await fetch(`/api/utilisateurs/${id}/actif`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ actif: Boolean(Number(actif)) })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Impossible de modifier le statut.");
        }

        await load();
    } catch (error) {
        afficherErreur(error.message);
    }
}

async function deleteUser(id) {
    if (!confirm("Supprimer cet utilisateur ? Cette action est irréversible.")) return;

    try {
        const response = await fetch(`/api/utilisateurs/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Impossible de supprimer l'utilisateur.");
        }

        await load();
    } catch (error) {
        afficherErreur(error.message);
    }
}

(async function initUsersPage() {
    try {
        const response = await fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store"
        });

        if (!response.ok) {
            location.href = "/auth/login.html?admin=1";
            return;
        }

        const data = await response.json();

        if (data.user?.role !== "admin") {
            location.href = "/auth/login.html?admin=1";
            return;
        }

        window.ADMIN_USER_ID = Number(data.user.id);
        await load();
    } catch (error) {
        afficherErreur("Impossible de vérifier la session administrateur.");
    }
})();
