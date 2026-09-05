const API = "/api/auth";

const message = document.getElementById("message");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

function showMessage(text, type = "") {
    if (!message) return;
    message.textContent = text;
    message.className = `auth-message ${type}`.trim();
}

async function send(url, body) {
    const response = await fetch(API + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({
        message: "Réponse invalide du serveur."
    }));

    if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue.");
    }

    return data;
}

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        showMessage("Connexion en cours...");

        try {
            const data = await send("/login", { email, password });

            if (data.user?.role === "admin") {
                window.location.href = "/admin/dashboard.html";
            } else {
                window.location.href = "/index.html";
            }
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nom = document.getElementById("nom").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirm = document.getElementById("confirm").value;

        if (nom.length < 2) {
            showMessage("Le nom doit contenir au moins 2 caractères.", "error");
            return;
        }

        if (password.length < 6) {
            showMessage("Le mot de passe doit contenir au moins 6 caractères.", "error");
            return;
        }

        if (password !== confirm) {
            showMessage("Les mots de passe ne correspondent pas.", "error");
            return;
        }

        showMessage("Création du compte...");

        try {
            await send("/register", { nom, email, password });
            showMessage("Compte créé avec succès. Redirection...", "success");

            setTimeout(() => {
                window.location.href = "/index.html";
            }, 700);
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}

const togglePassword = document.getElementById("togglePassword");

if (togglePassword) {
    togglePassword.addEventListener("click", () => {
        const password = document.getElementById("password");
        if (!password) return;

        const icon = togglePassword.querySelector("i");
        const visible = password.type === "text";

        password.type = visible ? "password" : "text";

        if (icon) {
            icon.className = visible
                ? "fa-solid fa-eye"
                : "fa-solid fa-eye-slash";
        }
    });
}
