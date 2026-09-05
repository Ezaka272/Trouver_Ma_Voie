(() => {
    "use strict";

    window.TaxiBeUser = {
        async fetchJSON(url, options = {}) {
            const response = await fetch(url, {
                credentials: "include",
                ...options,
                headers: {
                    ...(options.headers || {})
                }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const error = new Error(data.message || `Erreur HTTP ${response.status}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        },

        escape(value) {
            return String(value ?? "")
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#039;");
        },

        goLogin() {
            window.location.href = "/auth/login.html";
        }
    };
})();
