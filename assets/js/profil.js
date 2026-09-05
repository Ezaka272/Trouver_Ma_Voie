// ================================
// PROFIL VOYAGEUR
// ================================

const photoProfil = document.getElementById("photoProfil");
const profileImage = document.getElementById("profileImage");


// ================================
// CHARGER LA PHOTO
// ================================

const photoSauvegardee = localStorage.getItem("photoVoyageur");

if (photoSauvegardee && profileImage) {

    profileImage.src = photoSauvegardee;

}


// ================================
// CHANGER LA PHOTO
// ================================

if (photoProfil) {

    photoProfil.addEventListener("change", function () {

        const fichier = this.files[0];

        if (!fichier) {
            return;
        }


        // Vérifier le type
        if (!fichier.type.startsWith("image/")) {

            alert("Veuillez sélectionner une image.");

            return;

        }


        // Vérifier la taille
        if (fichier.size > 5 * 1024 * 1024) {

            alert("L'image ne doit pas dépasser 5 Mo.");

            return;

        }


        const lecteur = new FileReader();


        lecteur.onload = function (event) {

            const image = event.target.result;


            // Afficher la photo
            profileImage.src = image;


            // Sauvegarder
            localStorage.setItem(
                "photoVoyageur",
                image
            );

        };


        lecteur.readAsDataURL(fichier);

    });

}


// ================================
// MODIFIER PROFIL
// ================================

const modifierProfil =
    document.getElementById("modifierProfil");

if (modifierProfil) {

    modifierProfil.addEventListener("click", function () {

        alert("La modification du profil sera disponible prochainement.");

    });

}


// ================================
// DÉCONNEXION
// ================================

const deconnexion =
    document.getElementById("deconnexion");

if (deconnexion) {

    deconnexion.addEventListener("click", function () {

        const confirmation = confirm(
            "Voulez-vous vraiment vous déconnecter ?"
        );

        if (confirmation) {

            localStorage.removeItem("photoVoyageur");

            window.location.href = "../index.html";

        }

    });

}