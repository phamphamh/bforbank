# Assistant Bancaire avec Reconnaissance Vocale

Ce projet implémente un assistant pour conseillers bancaires utilisant la reconnaissance vocale d'OpenAI (Whisper) et l'analyse de texte par GPT pour comprendre les besoins des clients et proposer des actions adaptées.

## Fonctionnalités

- Enregistrement vocal depuis le navigateur
- Transcription du discours en texte via l'API OpenAI Whisper
- Analyse automatique de la demande client pour identifier :
  - Le besoin principal
  - Le délai estimé
  - Le domaine d'expertise bancaire concerné
  - Le niveau d'urgence
  - Les actions recommandées

## Prérequis

- Une clé API OpenAI valide
- Un navigateur moderne supportant l'API MediaRecorder
- Une connexion internet stable
- Un serveur local pour servir les fichiers (en raison des modules ES6)

## Installation

1. Clonez ce dépôt
2. Copiez le fichier `.env.example` en `.env` :
   ```
   cp .env.example .env
   ```
3. Modifiez le fichier `.env` et remplacez `votre_cle_api_openai_ici` par votre clé API OpenAI
4. Démarrez un serveur local, par exemple :
   ```
   npx serve
   ```
   ou
   ```
   python -m http.server
   ```
5. Ouvrez l'application dans votre navigateur à l'adresse indiquée (généralement http://localhost:8000 ou http://localhost:3000)

## Utilisation

1. Cliquez sur le bouton "Commencer l'enregistrement"
2. Parlez clairement dans votre microphone en présentant la demande du client
3. Cliquez à nouveau sur le bouton pour arrêter l'enregistrement
4. Patientez pendant que le système transcrit et analyse la demande
5. Consultez les résultats dans les sections "Transcription" et "Analyse"

## Prompt d'analyse

Le système utilise le prompt suivant pour analyser les demandes client :

```
Vous êtes un assistant spécialisé pour les conseillers bancaires. Analysez la demande du client suivante et fournissez:

1. BESOIN: Une synthèse claire du besoin du client en 1-2 phrases
2. DÉLAI: Une estimation du délai nécessaire pour traiter cette demande (immédiat, quelques jours, semaines)
3. EXPERTISE: Le domaine d'expertise bancaire concerné (crédit, épargne, assurance, placement, opérations courantes, etc.)
4. PRIORITÉ: Niveau d'urgence (faible, moyenne, élevée)
5. ACTIONS RECOMMANDÉES: 2-3 actions concrètes que le conseiller devrait entreprendre
```

## Structure des fichiers

- `index.html` : Page HTML principale
- `speech-to-text.js` : Script principal avec la logique de l'application
- `config.js` : Module de configuration pour charger les variables d'environnement
- `.env` : Fichier contenant la clé API OpenAI (non inclus dans le dépôt Git)
- `.env.example` : Exemple de fichier .env
- `.gitignore` : Configuration Git pour exclure les fichiers sensibles

## Sécurité

⚠️ Attention : Dans un environnement de production, cette approche de gestion des clés API n'est pas optimale. Pour une utilisation en production, implémentez un serveur backend qui gère les appels API et protège votre clé.

## Limitations

- L'enregistrement est limité par la qualité du microphone
- La transcription peut ne pas être parfaite, surtout avec des termes techniques
- L'analyse est basée sur l'IA et peut nécessiter une révision humaine
- Pour des raisons de sécurité CORS, l'application doit être servie via un serveur HTTP

## Licence

Ce projet est distribué sous la licence MIT.