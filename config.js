// Fichier de configuration pour charger les variables d'environnement
const config = {
  // La clé API est récupérée depuis le fichier .env
  // En production, utilisez un système sécurisé pour gérer les clés API
  API_KEY: ''
};

// Fonction pour charger les variables d'environnement depuis le fichier .env
async function loadEnvVariables() {
  try {
    const response = await fetch('./.env');

    if (!response.ok) {
      console.error('Impossible de charger le fichier .env');
      return;
    }

    const text = await response.text();

    // Analyse du fichier .env
    const lines = text.split('\n');
    lines.forEach(line => {
      const parts = line.split('=');
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();

        // Stockage de la clé API
        if (key === 'OPENAI_API_KEY') {
          config.API_KEY = value;
        }
      }
    });

    console.log('Variables d\'environnement chargées avec succès');
  } catch (error) {
    console.error('Erreur lors du chargement des variables d\'environnement:', error);
  }
}

export { config, loadEnvVariables };