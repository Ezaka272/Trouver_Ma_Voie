(() => {
    "use strict";

    const params = new URLSearchParams(window.location.search);
    const id = params.get("ligne") || params.get("id");

    const map = L.map("map", {
        zoomControl: false,
        scrollWheelZoom: true
    }).setView([-18.8792, 47.5079], 13);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    let allPoints = [];
    let routeLayer = null;
    let markersLayer = L.layerGroup().addTo(map);

    const $ = id => document.getElementById(id);

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function markerIcon(number, type = "stop") {
        let className = "taxibe-marker";

        if (type === "start") className += " marker-start";
        if (type === "end") className += " marker-end";

        const label = type === "start"
            ? "D"
            : type === "end"
                ? "A"
                : number;

        return L.divIcon({
            className: "",
            html: `<div class="${className}">
                        <span>${escapeHtml(label)}</span>
                   </div>`,
            iconSize: [48, 58],
            iconAnchor: [24, 52],
            popupAnchor: [0, -48]
        });
    }

    function formatDistance(a, b) {
        if (!a || !b) return "";

        const R = 6371;
        const lat1 = Number(a.latitude) * Math.PI / 180;
        const lat2 = Number(b.latitude) * Math.PI / 180;
        const dLat = (Number(b.latitude) - Number(a.latitude)) * Math.PI / 180;
        const dLng = (Number(b.longitude) - Number(a.longitude)) * Math.PI / 180;

        const x =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) ** 2;

        const km = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

        if (km < 1) return `${Math.round(km * 1000)} m`;
        return `${km.toFixed(1)} km`;
    }

    function addMarkers(arrets) {
        markersLayer.clearLayers();

        const points = arrets.filter(a =>
            a.latitude !== null &&
            a.longitude !== null &&
            !Number.isNaN(Number(a.latitude)) &&
            !Number.isNaN(Number(a.longitude))
        );

        points.forEach((a, index) => {
            const position = [
                Number(a.latitude),
                Number(a.longitude)
            ];

            let type = "stop";

            if (index === 0) type = "start";
            else if (index === points.length - 1) type = "end";

            const marker = L.marker(position, {
                icon: markerIcon(index + 1, type),
                title: `${index + 1}. ${a.nom}`
            });

            const badge =
                type === "start"
                    ? "Départ"
                    : type === "end"
                        ? "Destination"
                        : `Arrêt ${index + 1}`;

            marker.bindPopup(`
                <div class="popup-stop">
                    <span class="popup-badge">${escapeHtml(badge)}</span>
                    <strong>${escapeHtml(a.nom)}</strong>
                    <small>${index + 1} / ${points.length}</small>
                </div>
            `);

            marker.addTo(markersLayer);
        });
    }

    function drawRoute(points) {
        if (routeLayer) {
            map.removeLayer(routeLayer);
        }

        if (points.length < 2) return;

        routeLayer = L.polyline(points, {
            color: "#16C65B",
            weight: 7,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round"
        }).addTo(map);

        L.polyline(points, {
            color: "#ffffff",
            weight: 11,
            opacity: 0.25,
            lineCap: "round",
            lineJoin: "round"
        }).addTo(map);
    }

    function updateStopList(arrets) {
        const list = $("listeArrets");
        const count = $("stopCount");

        count.textContent = `${arrets.length} arrêt${arrets.length > 1 ? "s" : ""}`;

        if (!arrets.length) {
            list.innerHTML = `
                <div class="empty-stops">
                    <i class="fa-solid fa-location-dot"></i>
                    <strong>Aucun arrêt trouvé</strong>
                    <span>Cette ligne ne possède pas encore d'arrêts géolocalisés.</span>
                </div>
            `;
            return;
        }

        $("startName").textContent = arrets[0]?.nom || "--";
        $("endName").textContent = arrets[arrets.length - 1]?.nom || "--";

        list.innerHTML = arrets.map((a, index) => {
            const type =
                index === 0 ? "start" :
                index === arrets.length - 1 ? "end" :
                "stop";

            const icon =
                type === "start" ? "D" :
                type === "end" ? "A" :
                index + 1;

            const distance = index > 0
                ? formatDistance(arrets[index - 1], a)
                : "";

            return `
                <button class="stop-card ${type}"
                        type="button"
                        data-lat="${a.latitude ?? ""}"
                        data-lng="${a.longitude ?? ""}">

                    <span class="stop-number">${icon}</span>

                    <span class="stop-content">
                        <strong>${escapeHtml(a.nom)}</strong>
                        <small>
                            ${type === "start"
                                ? "Départ de la ligne"
                                : type === "end"
                                    ? "Destination de la ligne"
                                    : `Arrêt ${index + 1}`}
                            ${distance ? ` • ${distance}` : ""}
                        </small>
                    </span>

                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            `;
        }).join("");

        list.querySelectorAll(".stop-card").forEach(card => {
            card.addEventListener("click", () => {
                const lat = Number(card.dataset.lat);
                const lng = Number(card.dataset.lng);

                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

                map.flyTo([lat, lng], 17, {
                    duration: 0.8
                });

                markersLayer.eachLayer(marker => {
                    const pos = marker.getLatLng();

                    if (
                        Math.abs(pos.lat - lat) < 0.00001 &&
                        Math.abs(pos.lng - lng) < 0.00001
                    ) {
                        marker.openPopup();
                    }
                });
            });
        });
    }

    async function charger() {
        if (!id) {
            $("titreTrajet").textContent = "Aucune ligne sélectionnée";
            $("listeArrets").innerHTML = `
                <div class="empty-stops">
                    <i class="fa-solid fa-route"></i>
                    <strong>Aucun trajet sélectionné</strong>
                    <span>Retournez à la recherche pour choisir une ligne.</span>
                </div>
            `;
            return;
        }

        try {
            const [ligneResponse, arretsResponse] = await Promise.all([
                fetch(`/api/lignes/${encodeURIComponent(id)}`),
                fetch(`/api/arrets/ligne/${encodeURIComponent(id)}`)
            ]);

            if (!ligneResponse.ok) {
                throw new Error("Impossible de charger la ligne.");
            }

            if (!arretsResponse.ok) {
                throw new Error("Impossible de charger les arrêts.");
            }

            const ligne = await ligneResponse.json();
            const arrets = await arretsResponse.json();

            $("numeroLigne").textContent = ligne.numero || "-";

            $("titreTrajet").textContent =
                `${ligne.depart || "-"} → ${ligne.destination || "-"}`;

            $("prixTemps").textContent =
                `${ligne.prix ?? "-"} Ar • ${ligne.temps ?? "-"} min`;

            updateStopList(Array.isArray(arrets) ? arrets : []);

            allPoints = (Array.isArray(arrets) ? arrets : [])
                .filter(a =>
                    a.latitude !== null &&
                    a.longitude !== null &&
                    Number.isFinite(Number(a.latitude)) &&
                    Number.isFinite(Number(a.longitude))
                )
                .map(a => [
                    Number(a.latitude),
                    Number(a.longitude)
                ]);

            addMarkers(Array.isArray(arrets) ? arrets : []);
            drawRoute(allPoints);

            if (allPoints.length) {
                const bounds = L.latLngBounds(allPoints);

                map.fitBounds(bounds, {
                    paddingTopLeft: [45, 150],
                    paddingBottomRight: [45, 45],
                    maxZoom: 16
                });
            }
        } catch (error) {
            console.error("Erreur carte :", error);

            $("listeArrets").innerHTML = `
                <div class="empty-stops error">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <strong>Impossible de charger le trajet</strong>
                    <span>Vérifiez que le serveur TaxiBe est bien démarré.</span>
                </div>
            `;
        }
    }
// pour arriver dans les arrêts
    document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const ligneId = params.get("ligne");

    if (!ligneId) {
        return;
    }

    const stopsPanel = document.getElementById("stopsPanel");

    if (stopsPanel) {
        stopsPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    console.log("Ligne reçue :", ligneId);
});

    $("recenterBtn").addEventListener("click", () => {
        if (!allPoints.length) return;

        map.fitBounds(L.latLngBounds(allPoints), {
            padding: [50, 50],
            maxZoom: 16
        });
    });

    $("toggleStops").addEventListener("click", () => {
        document.body.classList.toggle("stops-open");

        $("toggleStops").querySelector("span").textContent =
            document.body.classList.contains("stops-open")
                ? "Masquer les arrêts"
                : "Voir les arrêts";
    });

    charger();
})();
