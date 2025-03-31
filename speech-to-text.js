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
      <header class="app-header">
        <div class="logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15 8H9V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8Z" fill="#007bff"/>
          </svg>
          <h1>BforBank<span>Assistant</span></h1>
        </div>
        <div class="app-description">Reconnaissance vocale intelligente</div>
      </header>

      <div class="main-content">
        <div class="card recording-card">
          <div class="card-header">
            <h2><i class="icon mic-icon"></i>Enregistrement</h2>
          </div>
          <div class="card-body">
            <div class="controls">
              <button id="recordButton" class="record-btn">
                <i class="icon rec-icon"></i>
                <span>Commencer l'enregistrement</span>
              </button>
              <div id="status" class="status">
                <i class="icon ready-icon"></i>
                <span>Prêt</span>
              </div>
            </div>
            <div class="audio-visualizer">
              <div class="visualizer-container">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card result-card">
          <div class="card-header">
            <h2><i class="icon doc-icon"></i>Transcription</h2>
          </div>
          <div class="card-body">
            <div id="transcription" class="transcription"></div>
          </div>
        </div>

        <div class="card analysis-card">
          <div class="card-header">
            <h2><i class="icon analysis-icon"></i>Analyse</h2>
          </div>
          <div class="card-body">
            <div id="analysis" class="analysis"></div>
          </div>
        </div>
      </div>

      <footer class="app-footer">
        <p>BforBank Assistant © ${new Date().getFullYear()} | Propulsé par IA</p>
      </footer>
    </div>
  `;
  document.body.appendChild(app);

  // Ajout du style CSS
  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f7fa;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* Header */
    .app-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0;
      margin-bottom: 30px;
      border-bottom: 1px solid #e1e5ea;
    }

    .logo {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }

    .logo svg {
      margin-right: 10px;
    }

    .logo h1 {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
    }

    .logo h1 span {
      font-weight: 300;
      color: #007bff;
    }

    .app-description {
      font-size: 16px;
      color: #6c757d;
      font-style: italic;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
      grid-gap: 20px;
    }

    /* Cards */
    .card {
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 7px 15px rgba(0, 0, 0, 0.07), 0 3px 5px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      padding: 15px 20px;
      background: linear-gradient(to right, #007bff, #6610f2);
      color: white;
    }

    .card-header h2 {
      font-size: 18px;
      font-weight: 500;
      display: flex;
      align-items: center;
    }

    .card-header h2 .icon {
      margin-right: 10px;
      font-size: 20px;
    }

    .card-body {
      padding: 20px;
    }

    /* Controls */
    .controls {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .record-btn {
      display: flex;
      align-items: center;
      background-color: #007bff;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 50px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      box-shadow: 0 4px 6px rgba(0, 123, 255, 0.25);
      transition: all 0.3s ease;
    }

    .record-btn:hover {
      background-color: #0069d9;
      box-shadow: 0 5px 8px rgba(0, 123, 255, 0.35);
    }

    .record-btn.recording {
      background-color: #dc3545;
      animation: pulse 1.5s infinite;
    }

    .record-btn .icon {
      margin-right: 8px;
    }

    .status {
      display: flex;
      align-items: center;
      margin-left: 20px;
      font-style: italic;
      color: #6c757d;
    }

    .status .icon {
      margin-right: 8px;
      color: #28a745;
    }

    /* Visualizer */
    .audio-visualizer {
      height: 60px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .visualizer-container {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
      max-width: 200px;
      justify-content: space-between;
    }

    .bar {
      width: 8px;
      background-color: #e9ecef;
      border-radius: 10px;
      height: 5px;
      transition: height 0.2s ease;
    }

    /* Animation pour simuler l'activité audio */
    @keyframes equalize {
      0% { height: 5px; }
      50% { height: 40px; }
      100% { height: 5px; }
    }

    .recording .bar:nth-child(1) { animation: equalize 1.0s ease-in-out infinite; }
    .recording .bar:nth-child(2) { animation: equalize 1.3s ease-in-out infinite 0.2s; }
    .recording .bar:nth-child(3) { animation: equalize 1.5s ease-in-out infinite 0.1s; }
    .recording .bar:nth-child(4) { animation: equalize 1.2s ease-in-out infinite 0.3s; }
    .recording .bar:nth-child(5) { animation: equalize 1.1s ease-in-out infinite 0.15s; }

    /* Animation pour le bouton d'enregistrement */
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.6); }
      70% { box-shadow: 0 0 0 15px rgba(220, 53, 69, 0); }
      100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
    }

    /* Loading animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    .loading-indicator {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 60px;
    }

    .dot {
      width: 12px;
      height: 12px;
      background-color: #007bff;
      border-radius: 50%;
      margin: 0 6px;
      display: inline-block;
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }

    .fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }

    /* Error messages */
    .error-message {
      padding: 20px;
      text-align: center;
      color: #721c24;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
    }

    .error-details {
      margin-top: 10px;
      font-size: 14px;
      opacity: 0.8;
    }

    .big-error-icon {
      font-size: 40px;
      color: #dc3545;
      margin-bottom: 15px;
    }

    /* Icônes supplémentaires */
    .error-icon {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="%23dc3545"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>');
    }

    .big-error-icon {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="%23dc3545"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>');
      width: 40px;
      height: 40px;
    }

    .loading-icon {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="%23007bff"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>');
      animation: spin 1.5s linear infinite;
    }

    .analysis-loading-icon {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="%23fd7e14"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>');
      animation: spin 1.5s linear infinite;
    }

    .success-icon {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="%2328a745"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>');
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Résultats */
    .transcription, .analysis {
      min-height: 100px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      background-color: #f8f9fa;
      font-size: 15px;
      line-height: 1.7;
      transition: all 0.3s ease;
    }

    .transcription:empty:before, .analysis:empty:before {
      content: "En attente d'enregistrement...";
      color: #adb5bd;
      font-style: italic;
    }

    .transcription:not(:empty), .analysis:not(:empty) {
      border-color: #b8daff;
      background-color: #f0f7ff;
    }

    .analysis {
      white-space: pre-line;
    }

    /* Sections style */
    .section-title {
      color: #007bff;
      display: block;
      margin-top: 12px;
      margin-bottom: 5px;
      font-size: 16px;
    }

    /* Résolution styles */
    .resolution-facile {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
      box-shadow: 0 2px 5px rgba(40, 167, 69, 0.1);
    }

    .resolution-facile h3 {
      color: #155724;
      margin-top: 0;
      font-size: 18px;
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }

    .resolution-facile h3:before {
      content: '✅';
      margin-right: 10px;
    }

    .resolution-transfert {
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
      box-shadow: 0 2px 5px rgba(255, 193, 7, 0.1);
    }

    .resolution-transfert h3 {
      color: #856404;
      margin-top: 0;
      font-size: 18px;
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }

    .resolution-transfert h3:before {
      content: '🔄';
      margin-right: 10px;
    }

    .method-steps {
      background-color: #e2e3e5;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }

    .method-steps h4 {
      color: #383d41;
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 16px;
      display: flex;
      align-items: center;
    }

    /* Footer */
    .app-footer {
      text-align: center;
      padding: 20px 0;
      margin-top: 30px;
      color: #6c757d;
      font-size: 14px;
      border-top: 1px solid #e1e5ea;
    }

    /* Icons */
    .icon {
      display: inline-block;
      width: 24px;
      height: 24px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }

    .mic-icon {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>');
    }

    .rec-icon {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white"><circle cx="12" cy="12" r="8"/></svg>');
    }

    .ready-icon {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="%2328a745"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>');
    }

    .doc-icon {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>');
    }

    .analysis-icon {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>');
    }

    /* Responsive */
    @media (min-width: 768px) {
      .main-content {
        grid-template-columns: repeat(2, 1fr);
      }

      .recording-card {
        grid-column: 1 / -1;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1a1a1a;
        color: #e0e0e0;
      }

      .app-header {
        border-bottom-color: #333;
      }

      .logo h1 {
        color: #e0e0e0;
      }

      .card {
        background-color: #2d2d2d;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      }

      .transcription, .analysis {
        background-color: #333;
        border-color: #444;
        color: #e0e0e0;
      }

      .transcription:not(:empty), .analysis:not(:empty) {
        background-color: #2a3a4a;
        border-color: #3a5a8a;
      }

      .app-footer {
        border-top-color: #333;
        color: #aaa;
      }

      .resolution-facile {
        background-color: rgba(40, 167, 69, 0.2);
        border-color: rgba(40, 167, 69, 0.3);
      }

      .resolution-transfert {
        background-color: rgba(255, 193, 7, 0.2);
        border-color: rgba(255, 193, 7, 0.3);
      }

      .method-steps {
        background-color: rgba(226, 227, 229, 0.1);
      }
    }
  `;
  document.head.appendChild(style);

  // Ajout des gestionnaires d'événements
  const recordButton = document.getElementById('recordButton');
  const status = document.getElementById('status');
  const visualizer = document.querySelector('.visualizer-container');

  recordButton.addEventListener('click', async () => {
    if (!isRecording) {
      startRecording();
      recordButton.innerHTML = '<i class="icon rec-icon"></i><span>Arrêter l\'enregistrement</span>';
      recordButton.classList.add('recording');
      status.innerHTML = '<i class="icon ready-icon"></i><span>Enregistrement en cours...</span>';
      visualizer.classList.add('recording');
    } else {
      stopRecording();
      recordButton.innerHTML = '<i class="icon rec-icon"></i><span>Commencer l\'enregistrement</span>';
      recordButton.classList.remove('recording');
      status.innerHTML = '<i class="icon ready-icon"></i><span>Traitement en cours...</span>';
      visualizer.classList.remove('recording');
    }
  });

  // Ajout des métadonnées pour mobile
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0';
  document.head.appendChild(meta);
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
    document.getElementById('status').innerHTML = '<i class="icon error-icon"></i><span>Enregistrement trop court, veuillez réessayer</span>';
    return;
  }

  // Mettre à jour les éléments d'interface pour la transcription
  const statusEl = document.getElementById('status');
  const transcriptionEl = document.getElementById('transcription');
  const analysisEl = document.getElementById('analysis');

  // Réinitialiser les résultats précédents avec animation
  transcriptionEl.classList.add('loading');
  analysisEl.classList.add('loading');

  transcriptionEl.innerHTML = '<div class="loading-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
  analysisEl.innerHTML = '';

  statusEl.innerHTML = '<i class="icon loading-icon"></i><span>Transcription en cours...</span>';

  // Transcrire l'audio
  try {
    const transcription = await transcribeAudio(audioBlob);

    // Afficher la transcription avec animation
    transcriptionEl.classList.remove('loading');
    transcriptionEl.textContent = transcription;
    transcriptionEl.classList.add('fade-in');

    // Mettre à jour l'état pour l'analyse
    statusEl.innerHTML = '<i class="icon analysis-loading-icon"></i><span>Analyse en cours...</span>';
    analysisEl.innerHTML = '<div class="loading-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';

    // Analyser la transcription
    const analysis = await analyzeTranscription(transcription);

    // Formatage visuel de l'analyse
    let formattedAnalysis = analysis;

    // Mise en forme des sections clés
    const sections = {
      'BESOIN:': '<strong class="section-title">BESOIN:</strong>',
      'DÉLAI:': '<strong class="section-title">DÉLAI:</strong>',
      'EXPERTISE:': '<strong class="section-title">EXPERTISE:</strong>',
      'PRIORITÉ:': '<strong class="section-title">PRIORITÉ:</strong>',
      'RÉSOLUTION:': '<strong class="section-title">RÉSOLUTION:</strong>',
      'MÉTHODE DE RÉSOLUTION:': '<strong class="section-title">MÉTHODE DE RÉSOLUTION:</strong>',
      'BRANCHE COMPÉTENTE:': '<strong class="section-title">BRANCHE COMPÉTENTE:</strong>',
      'JUSTIFICATION:': '<strong class="section-title">JUSTIFICATION:</strong>'
    };

    Object.keys(sections).forEach(key => {
      formattedAnalysis = formattedAnalysis.replace(key, sections[key]);
    });

    // Détection de résolution facile ou transfert
    if (analysis.includes('RÉSOLUTION: Oui') || analysis.includes('RÉSOLUTION: oui')) {
      // Extraction de la méthode de résolution
      const methodMatch = analysis.match(/MÉTHODE DE RÉSOLUTION:([\s\S]*?)(?=BRANCHE COMPÉTENTE:|JUSTIFICATION:|$)/);
      let methodContent = '';

      if (methodMatch && methodMatch[1]) {
        methodContent = `<div class="method-steps">
          <h4>📋 Étapes à suivre:</h4>
          ${methodMatch[1].trim()}
        </div>`;
      }

      formattedAnalysis = `<div class="resolution-facile">
        <h3>✅ RÉSOLUTION FACILE</h3>
        ${formattedAnalysis.replace(/MÉTHODE DE RÉSOLUTION:([\s\S]*?)(?=BRANCHE COMPÉTENTE:|JUSTIFICATION:|$)/, `<strong class="section-title">MÉTHODE DE RÉSOLUTION:</strong>${methodContent}`)}
      </div>`;
    } else if (analysis.includes('BRANCHE COMPÉTENTE:')) {
      // Extraction de la branche compétente
      const brancheMatch = analysis.match(/BRANCHE COMPÉTENTE:([^\n]+)/);
      const branche = brancheMatch ? brancheMatch[1].trim() : 'Indéterminée';

      formattedAnalysis = `<div class="resolution-transfert">
        <h3>🔄 TRANSFERT REQUIS: ${branche}</h3>
        ${formattedAnalysis}
      </div>`;
    }

    // Afficher l'analyse avec animation après un court délai
    setTimeout(() => {
      analysisEl.classList.remove('loading');
      analysisEl.innerHTML = formattedAnalysis;
      analysisEl.classList.add('fade-in');
      statusEl.innerHTML = '<i class="icon success-icon"></i><span>Prêt</span>';
    }, 300);

  } catch (error) {
    console.error('Erreur lors du traitement audio:', error);
    transcriptionEl.classList.remove('loading');
    analysisEl.classList.remove('loading');
    statusEl.innerHTML = '<i class="icon error-icon"></i><span>Erreur de traitement, veuillez réessayer</span>';

    // Afficher une notification d'erreur
    const errorMessage = `<div class="error-message">
      <i class="icon big-error-icon"></i>
      <p>Impossible de traiter l'enregistrement audio.</p>
      <p class="error-details">${error.message}</p>
    </div>`;

    transcriptionEl.innerHTML = '';
    analysisEl.innerHTML = errorMessage;
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
  5. RÉSOLUTION: Évaluez si le problème peut être résolu facilement et directement par le conseiller (oui/non)
  6. MÉTHODE DE RÉSOLUTION: Si résolution facile, décrivez précisément les étapes à suivre en 2-3 points
  7. BRANCHE COMPÉTENTE: Si résolution complexe, indiquez la branche à laquelle transférer la demande parmi:
     - MO AV et Succession (assurance vie, décès, héritage)
     - MO Administratif et reglementaire (conformité, documents légaux)
     - MO débiteur et Crédit (prêts, découverts)
     - MO Entrée en Relation (nouveaux clients, ouverture de compte)
     - MO Flux Sepa & Internationaux (virements internationaux)
     - MO fraude (suspicion de fraude, contestations)
     - MO Moyen de Paiments (cartes, chèques)
     - MO Réconciliations Bancaires (anomalies sur comptes)
     - MO Titres (investissements, bourse)
     - MO trasitions (changements de produits/services)
     - MO Vie du compte (opérations courantes)
  8. JUSTIFICATION: Expliquez en 1-2 phrases pourquoi ce cas devrait être traité par cette branche spécifique

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