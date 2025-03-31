// Import du module de configuration
import { config, loadEnvVariables } from './config.js';

// Variables globales
let API_KEY = ''; // La clé sera chargée depuis .env
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioBlob;

// Fonction d'initialisation
document.addEventListener('DOMContentLoaded', async () => {
  // Chargement des variables d'environnement
  await loadEnvVariables();
  API_KEY = config.API_KEY;

  if (!API_KEY) {
    console.error('Clé API non trouvée. Assurez-vous que le fichier .env contient OPENAI_API_KEY.');
  }

  // Création des éléments d'interface
  const app = document.createElement('div');
  app.innerHTML = `
    <div class="container">
      <h1>Assistant Bancaire - Reconnaissance Vocale</h1>
      <div class="controls">
        <button id="recordButton" class="record-btn">Commencer l'enregistrement</button>
        <div id="status" class="status">Prêt</div>
      </div>
      <div class="result-container">
        <h2>Transcription</h2>
        <div id="transcription" class="transcription"></div>
      </div>
      <div class="result-container">
        <h2>Analyse</h2>
        <div id="analysis" class="analysis"></div>
      </div>
    </div>
  `;
  document.body.appendChild(app);

  // Ajout du style CSS
  const style = document.createElement('style');
  style.textContent = `
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    .controls {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    .record-btn {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    .record-btn.recording {
      background-color: #dc3545;
    }
    .status {
      margin-left: 20px;
      font-style: italic;
    }
    .result-container {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .transcription, .analysis {
      min-height: 100px;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 10px;
      background-color: white;
    }
    .analysis {
      white-space: pre-line;
    }
  `;
  document.head.appendChild(style);

  // Ajout des gestionnaires d'événements
  const recordButton = document.getElementById('recordButton');
  const status = document.getElementById('status');

  recordButton.addEventListener('click', async () => {
    if (!isRecording) {
      startRecording();
      recordButton.textContent = 'Arrêter l\'enregistrement';
      recordButton.classList.add('recording');
      status.textContent = 'Enregistrement en cours...';
    } else {
      stopRecording();
      recordButton.textContent = 'Commencer l\'enregistrement';
      recordButton.classList.remove('recording');
      status.textContent = 'Traitement en cours...';
    }
  });
});

// Fonction pour démarrer l'enregistrement
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    isRecording = true;
    audioChunks = [];

    mediaRecorder.addEventListener('dataavailable', event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener('stop', processAudio);
    mediaRecorder.start();
  } catch (error) {
    console.error('Erreur lors de l\'accès au microphone:', error);
    document.getElementById('status').textContent = 'Erreur: impossible d\'accéder au microphone';
  }
}

// Fonction pour arrêter l'enregistrement
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
}

// Fonction pour traiter l'audio enregistré
async function processAudio() {
  audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

  // Afficher la durée de l'enregistrement
  const audioDuration = await getAudioDuration(audioBlob);
  console.log(`Durée d'enregistrement: ${audioDuration.toFixed(2)} secondes`);

  // Vérifier si l'enregistrement est trop court
  if (audioDuration < 0.5) {
    document.getElementById('status').textContent = 'Enregistrement trop court, veuillez réessayer';
    return;
  }

  document.getElementById('status').textContent = 'Transcription en cours...';

  // Transcrire l'audio
  try {
    const transcription = await transcribeAudio(audioBlob);
    document.getElementById('transcription').textContent = transcription;
    document.getElementById('status').textContent = 'Analyse en cours...';

    // Analyser la transcription
    const analysis = await analyzeTranscription(transcription);
    document.getElementById('analysis').textContent = analysis;
    document.getElementById('status').textContent = 'Prêt';
  } catch (error) {
    console.error('Erreur lors du traitement audio:', error);
    document.getElementById('status').textContent = 'Erreur de traitement, veuillez réessayer';
  }
}

// Fonction pour obtenir la durée de l'audio
function getAudioDuration(blob) {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(blob);
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
  });
}

// Fonction pour envoyer l'audio à l'API OpenAI pour transcription
async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'fr');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur OpenAI: ${errorData.error?.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Erreur de transcription:', error);
    throw error;
  }
}

// Fonction pour analyser la transcription avec l'API OpenAI
async function analyzeTranscription(text) {
  if (!text || text.trim() === '') {
    return 'Aucun texte à analyser.';
  }

  const prompt = `
  Vous êtes un assistant spécialisé pour les conseillers bancaires. Analysez la demande du client suivante et fournissez:

  1. BESOIN: Une synthèse claire du besoin du client en 1-2 phrases
  2. DÉLAI: Une estimation du délai nécessaire pour traiter cette demande (immédiat, quelques jours, semaines)
  3. EXPERTISE: Le domaine d'expertise bancaire concerné (crédit, épargne, assurance, placement, opérations courantes, etc.)
  4. PRIORITÉ: Niveau d'urgence (faible, moyenne, élevée)
  5. ACTIONS RECOMMANDÉES: 2-3 actions concrètes que le conseiller devrait entreprendre

  Demande du client: "${text}"`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Vous êtes un assistant spécialisé dans l\'analyse des demandes bancaires. Répondez de manière structurée et concise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur OpenAI: ${errorData.error?.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erreur d\'analyse:', error);
    throw error;
  }
}