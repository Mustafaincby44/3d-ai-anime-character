import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRMUtils } from 'https://esm.sh/@pixiv/three-vrm@2.0.9';

// ===== GLOBAL VARIABLES =====
let scene, camera, renderer, controls, clock;
let vrm = null;
let particles;

// UI Elements
const statusText = document.getElementById('status-text');
const thinkingIndicator = document.getElementById('thinking-indicator');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const container = document.getElementById('canvas-container');

// Application State
let appState = 'loading'; // loading, idle, thinking, speaking
let isThinking = false;
let isSpeaking = false;

// Settings
let volumeLevel = 0.7; // 70% default
let autoTalkEnabled = false; // Default OFF

// System readiness tracking
let systemReady = false;
let messageCount = 0;

// API Settings & Tracking
let currentResponseModel = 'gemini-2.5-flash-lite';
let currentTTSModel = 'gemini-2.5-flash-preview-tts'; // Varsayılan Gemini TTS modeli
let currentTTSService = 'edge-tts';

// API Rate Limits (Google AI Studio) - Correct Limits
const API_LIMITS = {
    // Free Tier Limits (Corrected)
    free: {
        'gemini-2.5-flash': { rpm: 15, rpd: 250, name: 'Gemini 2.5 Flash' },
        'gemini-2.5-flash-lite': { rpm: 60, rpd: 1000, name: 'Gemini 2.5 Flash Lite' },
        'gemini-2.5-flash-preview-tts': { rpm: 30, rpd: 500, name: 'Gemini 2.5 Flash Preview TTS' },
        'gemini-2.0-flash-preview-tts': { rpm: 30, rpd: 500, name: 'Gemini 2.0 Flash Preview TTS' },
        'gemini-1.5-flash': { rpm: 15, rpd: 50, name: 'Gemini 1.5 Flash' },
        'gemini-1.5-pro': { rpm: 2, rpd: 100, name: 'Gemini 1.5 Pro' },
        'gemini-1.0-pro': { rpm: 60, rpd: 1500, name: 'Gemini 1.0 Pro' }
    },
    // Paid Tier 1 Limits
    tier1: {
        'gemini-2.5-flash': { rpm: 1000, rpd: 10000, name: 'Gemini 2.5 Flash' },
        'gemini-2.5-flash-lite': { rpm: 2000, rpd: 50000, name: 'Gemini 2.5 Flash Lite' },
        'gemini-2.5-flash-preview-tts': { rpm: 500, rpd: 10000, name: 'Gemini 2.5 Flash Preview TTS' },
        'gemini-2.0-flash-preview-tts': { rpm: 500, rpd: 10000, name: 'Gemini 2.0 Flash Preview TTS' },
        'gemini-1.5-flash': { rpm: 1000, rpd: 5000, name: 'Gemini 1.5 Flash' },
        'gemini-1.5-pro': { rpm: 360, rpd: 3000, name: 'Gemini 1.5 Pro' },
        'gemini-1.0-pro': { rpm: 1000, rpd: 30000, name: 'Gemini 1.0 Pro' }
    },
    // Enterprise Tier Limits
    enterprise: {
        'gemini-2.5-flash': { rpm: 10000, rpd: 1000000, name: 'Gemini 2.5 Flash' },
        'gemini-2.5-flash-lite': { rpm: 20000, rpd: 2000000, name: 'Gemini 2.5 Flash Lite' },
        'gemini-2.5-flash-preview-tts': { rpm: 5000, rpd: 100000, name: 'Gemini 2.5 Flash Preview TTS' },
        'gemini-2.0-flash-preview-tts': { rpm: 5000, rpd: 100000, name: 'Gemini 2.0 Flash Preview TTS' },
        'gemini-1.5-flash': { rpm: 10000, rpd: 500000, name: 'Gemini 1.5 Flash' },
        'gemini-1.5-pro': { rpm: 5000, rpd: 100000, name: 'Gemini 1.5 Pro' },
        'gemini-1.0-pro': { rpm: 10000, rpd: 1000000, name: 'Gemini 1.0 Pro' }
    }
};

// Usage tracking - Persistent across page reloads
let apiUsage = {
    responseRequests: 0,
    ttsRequests: 0,
    lastReset: new Date().toDateString(),
    tier: 'free', // Will be detected
    responseApiKey: '', // Response API key
    ttsApiKey: '', // TTS API key (separate)
    realUsage: { // Actual API usage from headers
        response: { used: 0, limit: 0 },
        tts: { used: 0, limit: 0 }
    }
};

// Global erişim için window objesine ekle
window.apiUsage = apiUsage;

// Edge TTS sesleri - Gelişmiş ses listesi
const EDGE_TTS_VOICES = {
    "tr": {
        "Emel": "tr-TR-EmelNeural",
        "Ahmet": "tr-TR-AhmetNeural"
    },
    "en": {
        "Jenny": "en-US-JennyNeural",
        "Guy": "en-US-GuyNeural",
        "Ana": "en-US-AnaNeural",
        "Aria": "en-US-AriaNeural",
        "Christopher": "en-US-ChristopherNeural",
        "Eric": "en-US-EricNeural",
        "Michelle": "en-US-MichelleNeural",
        "Roger": "en-US-RogerNeural",
        "Natasha": "en-AU-NatashaNeural",
        "William": "en-AU-WilliamNeural",
        "Clara": "en-CA-ClaraNeural",
        "Liam": "en-CA-LiamNeural",
        "Libby": "en-GB-LibbyNeural",
        "Maisie": "en-GB-MaisieNeural",
        "Ryan": "en-GB-RyanNeural",
        "Sonia": "en-GB-SoniaNeural",
        "Thomas": "en-GB-ThomasNeural",
        "Sam": "en-HK-SamNeural",
        "Yan": "en-HK-YanNeural",
        "Connor": "en-IE-ConnorNeural",
        "Emily": "en-IE-EmilyNeural",
        "Neerja": "en-IN-NeerjaNeural",
        "Prabhat": "en-IN-PrabhatNeural",
        "Asilia": "en-KE-AsiliaNeural",
        "Chilemba": "en-KE-ChilembaNeural",
        "Abeo": "en-NG-AbeoNeural",
        "Ezinne": "en-NG-EzinneNeural",
        "Mitchell": "en-NZ-MitchellNeural",
        "James": "en-PH-JamesNeural",
        "Rosa": "en-PH-RosaNeural",
        "Luna": "en-SG-LunaNeural",
        "Wayne": "en-SG-WayneNeural",
        "Elimu": "en-TZ-ElimuNeural",
        "Imani": "en-TZ-ImaniNeural",
        "Leah": "en-ZA-LeahNeural",
        "Luke": "en-ZA-LukeNeural"
    },
    "ja": {
        "Nanami": "ja-JP-NanamiNeural",
        "Keita": "ja-JP-KeitaNeural"
    },
    "ko": {
        "Sun-Hi": "ko-KR-SunHiNeural",
        "InJoon": "ko-KR-InJoonNeural"
    },
    "de": {
        "Katja": "de-DE-KatjaNeural",
        "Amala": "de-DE-AmalaNeural",
        "Conrad": "de-DE-ConradNeural",
        "Killian": "de-DE-KillianNeural",
        "Ingrid": "de-AT-IngridNeural",
        "Jonas": "de-AT-JonasNeural",
        "Jan": "de-CH-JanNeural",
        "Leni": "de-CH-LeniNeural"
    },
    "fr": {
        "Denise": "fr-FR-DeniseNeural",
        "Eloise": "fr-FR-EloiseNeural",
        "Henri": "fr-FR-HenriNeural",
        "Sylvie": "fr-CA-SylvieNeural",
        "Antoine": "fr-CA-AntoineNeural",
        "Jean": "fr-CA-JeanNeural",
        "Ariane": "fr-CH-ArianeNeural",
        "Fabrice": "fr-CH-FabriceNeural",
        "Charline": "fr-BE-CharlineNeural",
        "Gerard": "fr-BE-GerardNeural"
    },
    "es": {
        "Elena": "es-AR-ElenaNeural",
        "Tomas": "es-AR-TomasNeural",
        "Marcelo": "es-BO-MarceloNeural",
        "Sofia": "es-BO-SofiaNeural",
        "Gonzalo": "es-CO-GonzaloNeural",
        "Salome": "es-CO-SalomeNeural",
        "Juan": "es-CR-JuanNeural",
        "Maria": "es-CR-MariaNeural",
        "Belkys": "es-CU-BelkysNeural",
        "Emilio": "es-DO-EmilioNeural",
        "Ramona": "es-DO-RamonaNeural",
        "Andrea": "es-EC-AndreaNeural",
        "Luis": "es-EC-LuisNeural",
        "Alvaro": "es-ES-AlvaroNeural",
        "Elvira": "es-ES-ElviraNeural",
        "Teresa": "es-GQ-TeresaNeural",
        "Andres": "es-GT-AndresNeural",
        "Marta": "es-GT-MartaNeural",
        "Carlos": "es-HN-CarlosNeural",
        "Karla": "es-HN-KarlaNeural",
        "Federico": "es-NI-FedericoNeural",
        "Yolanda": "es-NI-YolandaNeural",
        "Margarita": "es-PA-MargaritaNeural",
        "Roberto": "es-PA-RobertoNeural",
        "Alex": "es-PE-AlexNeural",
        "Camila": "es-PE-CamilaNeural",
        "Karina": "es-PR-KarinaNeural",
        "Victor": "es-PR-VictorNeural",
        "Mario": "es-PY-MarioNeural",
        "Tania": "es-PY-TaniaNeural",
        "Lorena": "es-SV-LorenaNeural",
        "Rodrigo": "es-SV-RodrigoNeural",
        "Alonso": "es-US-AlonsoNeural",
        "Paloma": "es-US-PalomaNeural",
        "Mateo": "es-UY-MateoNeural",
        "Valentina": "es-UY-ValentinaNeural",
        "Paola": "es-VE-PaolaNeural",
        "Sebastian": "es-VE-SebastianNeural"
    },
    "it": {
        "Isabella": "it-IT-IsabellaNeural",
        "Diego": "it-IT-DiegoNeural",
        "Elsa": "it-IT-ElsaNeural"
    },
    "ru": {
        "Svetlana": "ru-RU-SvetlanaNeural",
        "Dmitry": "ru-RU-DmitryNeural"
    }
};

// Load saved usage immediately
function loadSavedUsage() {
    const saved = localStorage.getItem('apiUsage');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const today = new Date().toDateString();
            
            // Always load API keys
            if (parsed.responseApiKey) {
                apiUsage.responseApiKey = parsed.responseApiKey;
            }
            if (parsed.ttsApiKey) {
                apiUsage.ttsApiKey = parsed.ttsApiKey;
            }
            
            // Load usage only if same day
            if (parsed.lastReset === today) {
                apiUsage.responseRequests = parsed.responseRequests || 0;
                apiUsage.ttsRequests = parsed.ttsRequests || 0;
                apiUsage.tier = parsed.tier || 'free';
                apiUsage.realUsage = parsed.realUsage || apiUsage.realUsage;
                console.log('📊 Restored daily usage from localStorage');
            } else {
                // New day - reset counters but keep API key
                apiUsage.responseRequests = 0;
                apiUsage.ttsRequests = 0;
                apiUsage.lastReset = today;
                console.log('📅 New day - usage reset');
            }
        } catch (error) {
            console.error('❌ Failed to load saved usage:', error);
        }
    }
}

// Initialize usage loading
loadSavedUsage();

// Audio System
let audioContext = null;
let analyser = null;
let audioDataArray = null;
let currentAudioSource = null;

// ===== AUDIO ANALYSIS FUNCTIONS =====
// Global audio analysis functions for WAV playback
window.startAudioAnalysis = function() {
    if (!audioContext) return;
    
    try {
        // Create analyser for mouth animation
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        audioDataArray = new Uint8Array(analyser.frequencyBinCount);
        
        console.log('🎵 Audio analysis started for mouth animation');
        
    } catch (error) {
        console.error('❌ Failed to start audio analysis:', error);
    }
};

window.stopAudioAnalysis = function() {
    if (analyser) {
        try {
            analyser.disconnect();
            analyser = null;
            audioDataArray = null;
            console.log('🎵 Audio analysis stopped');
        } catch (error) {
            console.error('❌ Error stopping audio analysis:', error);
        }
    }
};

// WAV Conversion Function
async function audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // WAV header (44 bytes)
    const buffer = new ArrayBuffer(44 + length * numChannels * 2);
    const view = new DataView(buffer);
    
    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + length * numChannels * 2, true); // File size
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, numChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * numChannels * 2, true); // Byte rate
    view.setUint16(32, numChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    
    // data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, length * numChannels * 2, true); // Data size
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
}

// Mouth Animation
let mouthOpenValue = 0.0;
let targetMouthOpen = 0.0;
let mouthAnimationSpeed = 0.15;

// Simple mouth control - no complex calibration needed

// Model URLs
const modelUrl = 'https://mustafaincby44.github.io/A-_AnimeGirl/public/AIAnimeGirl.vrm';
const fallbackModelUrl = 'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm';

// API Key - Ayarlardan alınacak
// const API_KEY = "AIzaSyDVKrvvjIc5dQkiEwpPHYOOzF1TI7ennks";

// ===== INITIALIZATION =====
function init() {
    // Scene setup
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0.0, 1.3, 2.0);
    
    // Initialize Brain System
    initializeBrainSystem();
    
    // Initialize API tracking (delayed for UI readiness)
    setTimeout(() => {
        initializeAPITracking();
    }, 500);
    
    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 2.0));
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(1, 2, 3).normalize();
    scene.add(directionalLight);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.0, 1.1, 0.0);
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 3.0;
    controls.maxPolarAngle = Math.PI / 2;
    
    // Particles
    createParticles();
    
    // Audio context
    initAudio();
    
    // Load model and start
    loadModel();
    animate();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleUserInput();
    });
    
    // Settings event listeners
    initializeSettings();
    
    // API Limit Toggle event listener
    const limitToggle = document.getElementById('api-limit-toggle');
    if (limitToggle) {
        limitToggle.addEventListener('click', toggleLimitPanel);
    }
}

function createParticles() {
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 10;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 0.005, color: 0x6366F1 });
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Pre-resume audio context to avoid delays
        if (audioContext.state === 'suspended') {
            // Add user interaction listener to resume audio context
            const resumeAudio = () => {
                audioContext.resume().then(() => {
                    console.log('Audio context resumed');
                });
                document.removeEventListener('click', resumeAudio);
                document.removeEventListener('keydown', resumeAudio);
            };
            document.addEventListener('click', resumeAudio);
            document.addEventListener('keydown', resumeAudio);
        }
        
        console.log('Audio system initialized');
    } catch (error) {
        console.error('Audio not supported:', error);
    }
}

function loadModel() {
    setAppState('loading');
    
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    loader.load(modelUrl,
        (gltf) => {
            if (vrm) scene.remove(vrm.scene);
            
            vrm = gltf.userData.vrm;
            VRMUtils.rotateVRM0(vrm);
            scene.add(vrm.scene);
            
            setAppState('idle');
        },
        (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            updateStatus(`Model indiriliyor... ${percent}%`);
        },
        (error) => {
            console.error('Model loading failed:', error);
            if (modelUrl !== fallbackModelUrl) {
                loadModel(fallbackModelUrl);
            } else {
                setAppState('error');
            }
        }
    );
}

// ===== ANIMATION LOOP =====
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Update particles
    if (particles) {
        particles.rotation.y += delta * 0.02;
    }
    
    // Update VRM and mouth animation
    if (vrm && vrm.expressionManager) {
        vrm.update(delta);
        updateMouthAnimation();
    }
    
    // Update controls and render
    if (controls) controls.update();
    renderer.render(scene, camera);
}

function updateMouthAnimation() {
    if (!vrm?.expressionManager) return;
    
    // STRICT mouth control - only open when actually speaking
    if (appState === 'speaking' && isSpeaking && (analyser || currentAudioSource)) {
        if (analyser && audioDataArray) {
            // Simple and effective audio analysis
            analyser.getByteFrequencyData(audioDataArray);
            
            let sum = 0;
            let count = 0;
            // Use more frequency bins for better analysis
            for (let i = 2; i < 12; i++) {
                if (audioDataArray[i] > 0) {
                    sum += audioDataArray[i];
                    count++;
                }
            }
            
            if (count > 0) {
                const average = sum / count;
                // Simple formula - no calibration complexity
                // Reduced sensitivity to prevent screaming
                targetMouthOpen = Math.min(0.3, (average / 200.0) * 0.5);
            } else {
                targetMouthOpen = 0.0;
            }
        } else {
            // Simple fallback animation when no audio
            targetMouthOpen = 0.08 + (Math.sin(Date.now() * 0.008) * 0.12);
        }
    } else {
        // Force mouth closed in all other states
        targetMouthOpen = 0.0;
        mouthOpenValue = 0.0; // Immediate reset when not speaking
    }
    
    // Smooth mouth animation only when speaking
    if (appState === 'speaking' && isSpeaking) {
        mouthOpenValue = THREE.MathUtils.lerp(mouthOpenValue, targetMouthOpen, mouthAnimationSpeed);
    } else {
        // Immediate close when not speaking
        mouthOpenValue = 0.0;
        targetMouthOpen = 0.0;
    }
    
    // Apply to VRM
    vrm.expressionManager.setValue('aa', mouthOpenValue);
    
    // Simple but effective: if not speaking, close mouth immediately
    if (!isSpeaking || appState !== 'speaking') {
        targetMouthOpen = 0.0;
        mouthOpenValue = 0.0;
        vrm.expressionManager.setValue('aa', 0);
    }
}

// ===== API TRACKING FUNCTIONS =====
async function detectAPITier() {
    if (!apiUsage.responseApiKey) {
        console.log('⚠️ No response API key provided - cannot detect tier');
        apiUsage.tier = 'free';
        return 'free';
    }

    try {
        console.log('🔍 Analyzing API key and detecting tier...');
        
        // Test with a simple request to determine tier and get usage info
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiUsage.responseApiKey}`;
        const testPayload = {
            contents: [{ parts: [{ text: "test tier detection" }] }]
        };

        const response = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        console.log('🔍 API Response status:', response.status);
        console.log('🔍 API Response headers:', Object.fromEntries(response.headers.entries()));

        // Check if API key is valid first
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key');
            } else if (response.status === 429) {
                // Rate limit hit - this means API key is valid
                console.log('🚫 Rate limit hit - API key is valid');
                apiUsage.tier = 'free'; // Default to free tier
                saveAPIUsage();
                return 'free';
            } else {
                throw new Error(`API request failed: ${response.status}`);
            }
        }

        // Try to get response body for more info
        try {
            const responseBody = await response.json();
            console.log('🔍 API Response body:', responseBody);
        } catch (parseError) {
            console.log('🔍 Could not parse response body');
        }

        // Check rate limit headers to get real usage and limits
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining-requests');
        const rateLimitLimit = response.headers.get('x-ratelimit-limit-requests');
        const rateLimitUsed = response.headers.get('x-ratelimit-used-requests');
        
        // Alternative header names
        const remaining = rateLimitRemaining || response.headers.get('x-ratelimit-remaining');
        const limit = rateLimitLimit || response.headers.get('x-ratelimit-limit');
        const used = rateLimitUsed || response.headers.get('x-ratelimit-used');

        if (limit) {
            const limitValue = parseInt(limit);
            const usedValue = used ? parseInt(used) : 0;
            const remainingValue = remaining ? parseInt(remaining) : (limitValue - usedValue);
            
            console.log(`📊 Real API Usage - Used: ${usedValue}, Remaining: ${remainingValue}, Limit: ${limitValue}`);
            
            // Update real usage data
            apiUsage.realUsage.response.used = usedValue;
            apiUsage.realUsage.response.limit = limitValue;
            
            // Determine tier based on limits
            if (limitValue >= 100000) {
                apiUsage.tier = 'enterprise';
            } else if (limitValue >= 3000) {
                apiUsage.tier = 'tier1';
            } else {
                apiUsage.tier = 'free';
            }
            
            console.log(`🎯 API Tier detected: ${apiUsage.tier} (limit: ${limitValue})`);
            
        } else {
            console.log('⚠️ No rate limit headers found - checking API key format for tier hints');
            
            // Try to determine tier from API key format or other indicators
            if (apiUsage.responseApiKey.length > 50) {
                // Longer API keys might indicate paid tier
                console.log('🔍 Long API key detected - might be paid tier');
                apiUsage.tier = 'tier1';
            } else {
                console.log('🔍 Standard API key format - assuming free tier');
                apiUsage.tier = 'free';
            }
        }
        
        saveAPIUsage();
        return apiUsage.tier;
        
    } catch (error) {
        console.error('❌ Failed to detect API tier:', error);
        if (error.message.includes('Invalid API key')) {
            throw error; // Re-throw for UI handling
        }
        apiUsage.tier = 'free'; // Safe default
        return 'free';
    }
}

function trackAPIUsage(type, response = null) {
    // Reset daily usage if needed
    const today = new Date().toDateString();
    if (apiUsage.lastReset !== today) {
        apiUsage.responseRequests = 0;
        apiUsage.ttsRequests = 0;
        apiUsage.lastReset = today;
        console.log('📅 Daily usage reset');
    }
    
    // Update real usage from API response headers if available
    if (response && response.headers) {
        const remaining = response.headers.get('x-ratelimit-remaining') || response.headers.get('x-ratelimit-remaining-requests');
        const limit = response.headers.get('x-ratelimit-limit') || response.headers.get('x-ratelimit-limit-requests');
        const used = response.headers.get('x-ratelimit-used') || response.headers.get('x-ratelimit-used-requests');
        
        if (limit) {
            const limitValue = parseInt(limit);
            const usedValue = used ? parseInt(used) : (limitValue - parseInt(remaining || 0));
            
            if (type === 'response') {
                apiUsage.realUsage.response.used = usedValue;
                apiUsage.realUsage.response.limit = limitValue;
            } else if (type === 'tts') {
                apiUsage.realUsage.tts.used = usedValue;
                apiUsage.realUsage.tts.limit = limitValue;
            }
            
            console.log(`📊 Real API Usage Updated - ${type}: ${usedValue}/${limitValue}`);
        }
    }
    
    // Increment local usage counter
    if (type === 'response') {
        apiUsage.responseRequests++;
    } else if (type === 'tts') {
        apiUsage.ttsRequests++;
    }
    
    // Update UI
    updateLimitDisplay();
    updateLimitPanel();
    
    // Save to localStorage
    saveAPIUsage();
    
    console.log(`📊 API Usage - Response: ${apiUsage.responseRequests}, TTS: ${apiUsage.ttsRequests}`);
}

function updateLimitDisplay() {
    const tier = apiUsage.tier;
    const responseLimits = API_LIMITS[tier] && API_LIMITS[tier][currentResponseModel] 
        ? API_LIMITS[tier][currentResponseModel] 
        : { rpm: 0, rpd: 0, name: 'Unknown Model' };
    const ttsLimits = API_LIMITS[tier] && API_LIMITS[tier][currentTTSModel] 
        ? API_LIMITS[tier][currentTTSModel] 
        : responseLimits;
    
    // Use real usage data if available, otherwise use local counters
    const responseUsed = apiUsage.realUsage.response.used > 0 ? apiUsage.realUsage.response.used : apiUsage.responseRequests;
    const responseLimit = apiUsage.realUsage.response.limit > 0 ? apiUsage.realUsage.response.limit : responseLimits.rpd;
    const ttsUsed = apiUsage.realUsage.tts.used > 0 ? apiUsage.realUsage.tts.used : apiUsage.ttsRequests;
    const ttsLimit = apiUsage.realUsage.tts.limit > 0 ? apiUsage.realUsage.tts.limit : ttsLimits.rpd;
    
    // Update top display
    const topResponseUsed = document.getElementById('top-response-used');
    const topResponseLimit = document.getElementById('top-response-limit');
    const topTTSUsed = document.getElementById('top-tts-used');
    const topTTSLimit = document.getElementById('top-tts-limit');
    const topCurrentModel = document.getElementById('top-current-model');
    
    if (topResponseUsed) topResponseUsed.textContent = responseUsed;
    if (topResponseLimit) topResponseLimit.textContent = responseLimit;
    if (topTTSUsed) topTTSUsed.textContent = ttsUsed;
    if (topTTSLimit) topTTSLimit.textContent = ttsLimit;
    if (topCurrentModel) topCurrentModel.textContent = responseLimits.name;
    
    // Update settings display
    const responseUsedSpan = document.getElementById('response-used');
    const ttsUsedSpan = document.getElementById('tts-used');
    
    if (responseUsedSpan) responseUsedSpan.textContent = apiUsage.responseRequests;
    if (ttsUsedSpan) ttsUsedSpan.textContent = apiUsage.ttsRequests;
    
    // Update limit info text
    const responseLimitInfo = document.getElementById('response-limit-info');
    const ttsLimitInfo = document.getElementById('tts-limit-info');
    
    if (responseLimitInfo) {
        responseLimitInfo.innerHTML = `📊 ${tier.toUpperCase()}: ${responseLimits.rpd} istek/gün | Kullanılan: <span id="response-used">${apiUsage.responseRequests}</span>`;
    }
    
    if (ttsLimitInfo) {
        ttsLimitInfo.innerHTML = `📊 ${tier.toUpperCase()}: ${ttsLimits.rpd} istek/gün | Kullanılan: <span id="tts-used">${apiUsage.ttsRequests}</span>`;
    }
    
    // Limit panel'i güncelle
    updateLimitPanel();
}

function getCurrentLimits() {
    const tier = apiUsage.tier;
    return {
        response: API_LIMITS[tier][currentResponseModel],
        tts: API_LIMITS[tier][currentTTSModel] || API_LIMITS[tier][currentResponseModel]
    };
}

// ===== SYSTEM RESET FUNCTIONS =====
function resetMouthState() {
    console.log('🔄 Resetting mouth state');
    mouthOpenValue = 0.0;
    targetMouthOpen = 0.0;
    
    if (vrm?.expressionManager) {
        vrm.expressionManager.setValue('aa', 0);
    }
    
    // Reset audio analysis
    if (analyser) {
        try {
            analyser.disconnect();
        } catch (e) {
            // Ignore disconnect errors
        }
        analyser = null;
        audioDataArray = null;
    }
    
    // Reset audio source
    if (currentAudioSource) {
        try {
            currentAudioSource.onended = null;
            currentAudioSource.stop();
            currentAudioSource.disconnect();
        } catch (e) {
            // Ignore stop errors
        }
        currentAudioSource = null;
    }
}

function resetSystemState() {
    console.log('🔄 Full system reset');
    isThinking = false;
    isSpeaking = false;
    resetMouthState();
    setAppState('idle');
}

// ===== USER INTERACTION =====
async function handleUserInput() {
    const text = userInput.value.trim();
    if (!text || appState === 'thinking' || appState === 'speaking') return;
    
    // Don't process if system not ready
    if (!systemReady) {
        console.log('⚠️ System not ready yet, ignoring input');
        return;
    }
    
    // Check if response API key is provided
    if (!apiUsage.responseApiKey) {
        updateStatus('⚠️ Response API key gerekli! Lütfen ayarlardan API key girin.');
        console.log('❌ No response API key provided');
        return;
    }
    
    // TTS API key kontrolü - sadece Gemini TTS için gerekli
    if (currentTTSService === 'gemini-tts' && !apiUsage.ttsApiKey) {
        updateStatus('⚠️ Gemini TTS için API key gerekli! Lütfen ayarlardan TTS API key girin.');
        console.log('❌ No TTS API key provided for Gemini TTS');
        return;
    }
    
    userInput.value = '';
    messageCount++;
    console.log(`📨 Processing message #${messageCount}: "${text}"`);
    
    // Reset mouth state before starting
    resetMouthState();
    
    setAppState('thinking');
    
    try {
        // Use brain system for enhanced response
        let response;
        if (window.brainSystem && window.brainSystem.isInitialized) {
            console.log('🧠 Using brain system for response');
            response = await getAIResponseWithBrain(text);
        } else {
            console.log('⚠️ Brain system not available, using standard response');
            response = await getAIResponse(text);
        }
        
        // Set emotion
        setEmotion(response.duygu);
        
        // Speak response
        await speakText(response.cevap);
        
    } catch (error) {
        console.error('❌ Interaction failed:', error);
        console.log('🔄 Forcing system reset due to error');
        
        // Force reset everything on error
        resetSystemState();
        
        // Show error briefly then reset
        setAppState('error');
        setTimeout(() => {
            resetSystemState();
        }, 1000);
    }
}

async function getAIResponse(prompt) {
    // Track API usage
    trackAPIUsage('response');
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentResponseModel}:generateContent?key=${apiUsage.responseApiKey}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: `Sen sevimli, zeki ve biraz utangaç bir anime karakterisin. Kullanıcının mesajına her zaman en az 3 kelimeden oluşan, sevimli ve kişiliğine uygun kısa bir cümle ile cevap ver. Asla tek kelimelik veya boş cevap verme. Cevabının genel duygusunu da 'happy' veya 'sad' kelimelerinden biriyle belirt. Cevabını JSON formatında şu şekilde ver: {"cevap": "...", "duygu": "..."}. Kullanıcının sözü: "${prompt}"`
            }]
        }]
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.candidates?.[0]?.content?.parts?.[0]) {
        throw new Error('Invalid API response');
    }

    const text = result.candidates[0].content.parts[0].text;
    return JSON.parse(text.replaceAll("```json", "").replaceAll("```", "").trim());
}

async function speakText(text) {
    if (!text || text.trim().length < 2) return;

    setAppState('speaking');
    isSpeaking = true;

    console.log(`🎵 speakText çağrıldı. service: ${currentTTSService}, model: ${currentTTSModel}`);

    try {
        // TTS modeline göre ses üret
        if (currentTTSService === 'edge-tts') {
            // Edge TTS kullan
            console.log('🎵 Using Edge TTS...');
            
            // Kullanıcının seçtiği ayarları kullan (otomatik değiştirme yok)
            const edgeVoice = document.getElementById('edge-voice')?.value || 'tr-TR-EmelNeural';
            const edgeSpeed = parseFloat(document.getElementById('edge-speed')?.value || 1.0);
            
            console.log(`🎭 Using selected voice: ${edgeVoice}, speed: ${edgeSpeed}x`);
            
            const audioBuffer = await generateEdgeTTS(text, edgeVoice, edgeSpeed);
            if (audioBuffer) {
                console.log('✅ Edge TTS successful, playing audio');
                playAudio(audioBuffer);
                return;
            } else {
                console.log('❌ Edge TTS returned null - using text simulation');
                throw new Error('Edge TTS returned no audio buffer');
            }
            
        } else {
            // Gemini TTS kullan
            console.log('🎵 Attempting Gemini TTS generation...');
            const audioBuffer = await generateTTS(text);
            if (audioBuffer) {
                console.log('✅ Gemini TTS successful, playing audio');
                playAudio(audioBuffer);
                return;
            } else {
                console.log('❌ Gemini TTS returned null - using text simulation');
                throw new Error('Gemini TTS returned no audio buffer');
            }
        }
        
    } catch (error) {
        console.error('❌ TTS failed, using text simulation:', error);
        
        // Check if it's a rate limit error (429)
        if (error.message.includes('429')) {
            console.log('🚫 TTS rate limit exceeded - using text simulation');
            updateStatus('TTS limit aşıldı - metin simülasyonu kullanılıyor...');
        } else {
            console.log('⚠️ TTS error - using text simulation');
            updateStatus('TTS hatası - metin simülasyonu kullanılıyor...');
        }
        
        // Fallback: simulate speech
        console.log('🎭 Using simulated speech for:', text);
        simulateSpeech(text);
        return;
    }
}

async function generateTTS(text) {
    console.log('🎵 Starting Gemini TTS generation with model:', currentTTSModel);

    // Check if TTS API key is available for Gemini TTS
    if (!apiUsage.ttsApiKey) {
        console.error('❌ No TTS API key available for Gemini TTS');
        throw new Error('TTS API key required for Gemini TTS');
    }
    
    // Track TTS API usage
    trackAPIUsage('tts');
    
    try {
        // Use the multimodal API for speech generation
        // Use correct endpoint for TTS models
        let apiUrl;
        if (currentTTSModel === 'gemini-2.5-flash-preview-tts') {
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiUsage.ttsApiKey}`;
        } else if (currentTTSModel === 'gemini-2.5-pro-preview-tts') {
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent?key=${apiUsage.ttsApiKey}`;
        } else if (currentTTSModel === 'gemini-2.0-flash-preview-tts') {
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-tts:generateContent?key=${apiUsage.ttsApiKey}`;
        } else {
            console.error('❌ Unsupported Gemini TTS model:', currentTTSModel);
            throw new Error(`Unsupported Gemini TTS model: ${currentTTSModel}`);
        }
        
        // Get selected Gemini voice from UI
        const geminiVoiceSelect = document.getElementById('gemini-voice');
        const selectedVoice = geminiVoiceSelect?.value || localStorage.getItem('geminiVoice') || 'alnilam';

        const payload = {
            contents: [{ 
                parts: [{ text: text }] 
            }],
            generationConfig: {
                responseModalities: ["Audio"],
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { 
                            voiceName: selectedVoice // Use selected voice
                        }
                    }
                }
            }
        };

        console.log('🎵 Gemini TTS Request payload:', JSON.stringify(payload, null, 2));
        console.log('🎵 Using voice:', selectedVoice);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // Track TTS usage from response headers (don't double count)
        // trackAPIUsage('tts', response); // Commented out to prevent double counting

        console.log('🎵 Gemini TTS Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ TTS API error:', response.status, errorText);
            throw new Error(`TTS API failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🎵 Gemini TTS Response result:', result);
        console.log('🎵 Checking for audio data...');
        console.log('🎵 Candidates:', result.candidates);
        console.log('🎵 First candidate:', result.candidates?.[0]);
        console.log('🎵 Content:', result.candidates?.[0]?.content);
        console.log('🎵 Parts:', result.candidates?.[0]?.content?.parts);
        console.log('🎵 First part:', result.candidates?.[0]?.content?.parts?.[0]);
        console.log('🎵 Inline data:', result.candidates?.[0]?.content?.parts?.[0]?.inlineData);
        
        // Check if we have audio data
        if (result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
            const audioData = result.candidates[0].content.parts[0].inlineData.data;
            const mimeType = result.candidates[0].content.parts[0].inlineData.mimeType;
            
            console.log('🎵 Gemini TTS audio data received:', {
                length: audioData.length,
                mimeType: mimeType || 'unknown'
            });
            
            // Handle different audio formats from Gemini TTS
            try {
                // Check for L16 PCM format (what Gemini TTS actually sends)
                if (mimeType && mimeType.includes('audio/L16') && mimeType.includes('pcm')) {
                    console.log('🎵 Detected L16 PCM format - extracting parameters...');
                    
                    // Parse MIME type for sample rate and channels
                    const rateMatch = mimeType.match(/rate=(\d+)/);
                    const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
                    
                    console.log('🎵 L16 PCM parameters:', { sampleRate, channels: 1 });
                    
                    try {
                        // Convert L16 PCM to WAV
                        const wavBlob = base64PcmToWav(audioData, sampleRate, 1);
                        console.log('✅ L16 PCM converted to WAV successfully');
                        
                        // Create audio buffer from WAV
                        const wavArrayBuffer = await wavBlob.arrayBuffer();
                        const audioBuffer = await audioContext.decodeAudioData(wavArrayBuffer);
                        audioBuffer.wavUrl = URL.createObjectURL(wavBlob);
                        
                        return audioBuffer;
                        
                    } catch (l16Error) {
                        console.error('❌ L16 PCM to WAV conversion failed:', l16Error);
                        throw new Error('L16 PCM conversion failed');
                    }
                    
                } else if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') {
                    // Already WAV format - convert base64 to blob
                    console.log('🎵 Audio is already WAV format');
                    const binaryString = atob(audioData);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    const wavBlob = new Blob([bytes.buffer], { type: 'audio/wav' });
                    console.log('✅ WAV blob created from base64');
                    
                    // Create audio buffer for playback
                    const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
                    audioBuffer.wavUrl = URL.createObjectURL(wavBlob);
                    
                    return audioBuffer;
                    
                } else {
                    // Unknown format - try PCM to WAV conversion as fallback
                    console.log('🎵 Unknown format, trying PCM to WAV conversion...');
                    
                    try {
                        const wavBlob = base64PcmToWav(audioData, 24000, 1);
                        console.log('✅ PCM converted to WAV successfully');
                        
                        const wavArrayBuffer = await wavBlob.arrayBuffer();
                        const audioBuffer = await audioContext.decodeAudioData(wavArrayBuffer);
                        audioBuffer.wavUrl = URL.createObjectURL(wavBlob);
                        
                        return audioBuffer;
                        
                    } catch (pcmError) {
                        console.log('⚠️ PCM to WAV failed, trying direct decode:', pcmError.message);
                        
                        // Final fallback: try direct decode
                        const binaryString = atob(audioData);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        
                        console.log('🎵 Attempting direct audio decode...');
                        const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
                        console.log('✅ Audio decoded successfully from raw data');
                        
                        // Convert to WAV for consistent playback
                        const wavBlob = await audioBufferToWav(audioBuffer);
                        audioBuffer.wavUrl = URL.createObjectURL(wavBlob);
                        
                        return audioBuffer;
                    }
                }
                
            } catch (formatError) {
                console.error('❌ Audio format handling failed:', formatError);
                throw new Error(`Audio format handling failed: ${formatError.message}`);
            }
            
        } else {
            console.error('❌ No audio data in Gemini TTS response');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Gemini TTS generation failed:', error);
        return null;
    }
}

function playAudio(audioBuffer) {
    if (!audioContext || !audioBuffer) return;
    
    // Check if we have WAV URL
    if (audioBuffer.wavUrl) {
        console.log('🎵 Playing WAV file from URL:', audioBuffer.wavUrl);
        playWavFile(audioBuffer.wavUrl);
        return;
    }
    
    // Fallback to original audio buffer playback
    console.log('🎵 Playing audio buffer directly');
    playAudioBuffer(audioBuffer);
}

function playWavFile(wavUrl) {
    // Create audio element for WAV playback
    const audio = new Audio(wavUrl);
    
    // Set volume
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        audio.volume = volumeSlider.value / 100;
    }
    
    // Start audio analysis for mouth animation
    startAudioAnalysis();
    
    // Play the audio
    audio.play().then(() => {
        console.log('🎵 WAV file playback started');
        
        // Set up audio analysis for mouth animation
        if (audioContext && analyser) {
            try {
                const source = audioContext.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                
                console.log('🎵 Audio analysis connected for mouth animation');
            } catch (error) {
                console.warn('⚠️ Could not connect audio analysis:', error);
            }
        }
        
        // Store current audio source
        currentAudioSource = audio;
        
        // Audio ended event
        audio.onended = () => {
            console.log('🛑 WAV file playback ended');
            stopAudioAnalysis();
            currentAudioSource = null;
            
            // Clean up WAV URL
            URL.revokeObjectURL(wavUrl);
            
            // IMPORTANT: Always stop speech when audio ends
            console.log('🔄 Audio ended, forcing speech stop');
            console.log('📊 Current state:', { isSpeaking, appState });
            stopSpeech();
        };
        
        // Safety timeout - force stop speech after audio duration + buffer
        const audioDuration = audio.duration * 1000; // Convert to milliseconds
        setTimeout(() => {
            if (isSpeaking && currentAudioSource === audio) {
                console.log('⏰ Safety timeout reached, forcing speech stop');
                stopSpeech();
            }
        }, audioDuration + 1000); // Add 1 second buffer
        
        // Audio error event
        audio.onerror = (error) => {
            console.error('❌ WAV file playback error:', error);
            stopAudioAnalysis();
            currentAudioSource = null;
        };
        
    }).catch(error => {
        console.error('❌ Failed to play WAV file:', error);
        stopAudioAnalysis();
    });
}

function playAudioBuffer(audioBuffer) {
    // Aggressively resume audio context
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('🔊 Audio context resumed immediately');
        });
    }
    
    // Apply volume adjustment
    const adjustedBuffer = applyVolumeToAudio(audioBuffer);
    
    // Create audio source
    const source = audioContext.createBufferSource();
    source.buffer = adjustedBuffer;
    currentAudioSource = source;
    
    // Create analyser for mouth animation
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    audioDataArray = new Uint8Array(analyser.frequencyBinCount);
    
    // Connect audio chain
    source.connect(analyser);
    analyser.stop = () => {
        source.stop();
        source.disconnect();
    };
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Handle audio end with improved cleanup
    source.onended = () => {
        console.log('Audio ended naturally');
        // Immediate cleanup without delay
        if (isSpeaking) {
            console.log('Stopping speech after audio end');
            stopSpeech();
        }
    };
    
    // Start audio immediately with zero delay
    source.start(0);
    console.log('🔊 Audio started playing with zero delay');
    
    // Add timeout protection in case onended doesn't fire
    const audioDuration = audioBuffer.duration * 1000; // Convert to milliseconds
    setTimeout(() => {
        if (isSpeaking && currentAudioSource === source) {
            console.log('Audio timeout reached, forcing stop');
            stopSpeech();
        }
    }, audioDuration + 500); // Reduced buffer to 500ms
}



function simulateSpeech(text) {
    const wordCount = text.split(' ').length;
    const duration = Math.max(2000, (wordCount / 150) * 60 * 1000); // Min 2 seconds, 150 wpm
    
    console.log(`🎭 Simulating speech: "${text}" for ${duration}ms`);
    updateStatus(`Konuşuyor: "${text}"`);
    
    let startTime = Date.now();
    let interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
            clearInterval(interval);
            interval = null;
            console.log('✅ Simulated speech completed');
            stopSpeech();
            return;
        }
        
        // Better simulate mouth movement with text rhythm
        const wordPhase = (progress * wordCount) % 1;
        const mouthIntensity = 0.1 + (Math.sin(wordPhase * Math.PI * 2) * 0.15);
        targetMouthOpen = mouthIntensity;
        
        // Update status with progress
        const progressPercent = Math.round(progress * 100);
        if (progressPercent % 20 === 0) { // Update every 20%
            updateStatus(`Konuşuyor... ${progressPercent}%`);
        }
    }, 50);
    
    // Add timeout protection
    setTimeout(() => {
        if (interval) {
            console.log('⏰ Simulated speech timeout, forcing stop');
            clearInterval(interval);
            interval = null;
            stopSpeech();
        }
    }, duration + 1000); // Add 1 second buffer
}

function stopSpeech() {
    console.log('🛑 Stopping speech...');
    console.log('📊 Before stop - isSpeaking:', isSpeaking, 'appState:', appState);
    
    // Reset all speech flags immediately
    isSpeaking = false;
    targetMouthOpen = 0.0;
    mouthOpenValue = 0.0;
    
    // Use the centralized reset function
    resetMouthState();
    
    // Force state to idle regardless of current state
    if (appState === 'speaking') {
        setAppState('idle');
    }
    
    console.log('📊 After stop - isSpeaking:', isSpeaking, 'appState:', appState);
    console.log('✅ Speech stopped, system clean');
}

// ===== UTILITY FUNCTIONS =====
function setAppState(newState) {
    console.log(`State change: ${appState} -> ${newState}`);
    appState = newState;
    
    // Update global state for brain system
    window.appState = newState;
    
    // Mark system as ready when first time reaching idle
    if (newState === 'idle' && !systemReady) {
        systemReady = true;
        console.log('🚀 System marked as ready');
    }
    
    switch (newState) {
        case 'loading':
            updateStatus('Sahne hazırlanıyor...');
            enableUI(false);
            // Force mouth closed during loading
            if (vrm?.expressionManager) {
                vrm.expressionManager.setValue('aa', 0);
            }
            break;
        case 'idle':
            updateStatus('Sıradaki mesajını bekliyorum.');
            enableUI(true);
            isThinking = false;
            isSpeaking = false;
            // Force mouth closed in idle
            if (vrm?.expressionManager) {
                vrm.expressionManager.setValue('aa', 0);
            }
            break;
        case 'thinking':
            updateStatus('Düşünüyor...', true);
            enableUI(false);
            isThinking = true;
            isSpeaking = false;
            // Force mouth closed while thinking
            if (vrm?.expressionManager) {
                vrm.expressionManager.setValue('aa', 0);
            }
            break;
        case 'speaking':
            updateStatus('Konuşuyor...');
            enableUI(false);
            isThinking = false;
            isSpeaking = true;
            break;
        case 'error':
            updateStatus('Bir hata oluştu.');
            enableUI(true);
            // Force mouth closed on error
            if (vrm?.expressionManager) {
                vrm.expressionManager.setValue('aa', 0);
            }
            break;
    }
}

function updateStatus(text, showThinking = false) {
    if (statusText) statusText.textContent = text;
    if (thinkingIndicator) {
        thinkingIndicator.classList.toggle('hidden', !showThinking);
    }
}

function enableUI(enabled) {
    if (userInput) userInput.disabled = !enabled;
    if (sendButton) sendButton.disabled = !enabled;
}

function setEmotion(emotion) {
    if (!vrm?.expressionManager) return;
    
    // Reset all emotions
    vrm.expressionManager.setValue('happy', 0);
    vrm.expressionManager.setValue('sad', 0);
    
    // Set new emotion
    if (emotion === 'happy') {
        vrm.expressionManager.setValue('happy', 1.0);
    } else if (emotion === 'sad') {
        vrm.expressionManager.setValue('sad', 1.0);
    }
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function pcmToWav(pcmData, sampleRate) {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);
    
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length * 2, true);
    
    for (let i = 0; i < pcmData.length; i++) {
        view.setInt16(44 + i * 2, pcmData[i], true);
    }
    
    return buffer;
}

// NEW: Convert base64 PCM data to WAV for Gemini TTS
function base64PcmToWav(base64Data, sampleRate = 24000, numChannels = 1) {
    try {
        console.log('🔄 Converting base64 PCM to WAV...');
        console.log('📊 Input data:', {
            base64Length: base64Data.length,
            sampleRate,
            channels: numChannels
        });
        
        // Decode base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        console.log('📊 Binary data extracted:', {
            binaryLength: binaryString.length,
            bytesLength: bytes.length
        });
        
        // Check if data length is valid for 16-bit PCM
        if (bytes.length % 2 !== 0) {
            console.warn('⚠️ Odd number of bytes - might not be 16-bit PCM');
        }
        
        // Convert to 16-bit PCM array
        const pcmData = new Int16Array(bytes.buffer);
        
        console.log('📊 PCM data extracted:', {
            originalBytes: bytes.length,
            pcmSamples: pcmData.length,
            sampleRate,
            channels: numChannels,
            duration: (pcmData.length / sampleRate).toFixed(2) + 's'
        });
        
        // Validate PCM data
        if (pcmData.length === 0) {
            throw new Error('PCM data is empty');
        }
        
        // Check for extreme values that might indicate corruption
        const maxValue = Math.max(...pcmData);
        const minValue = Math.min(...pcmData);
        console.log('📊 PCM value range:', { min: minValue, max: maxValue });
        
        if (Math.abs(maxValue) > 32000 || Math.abs(minValue) > 32000) {
            console.warn('⚠️ PCM values seem extreme - data might be corrupted');
        }
        
        // Convert to WAV using our existing function
        const wavBuffer = pcmToWav(pcmData, sampleRate);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        
        console.log('✅ Base64 PCM to WAV conversion completed');
        console.log('📊 WAV file size:', wavBlob.size, 'bytes');
        
        return wavBlob;
        
    } catch (error) {
        console.error('❌ Base64 PCM to WAV conversion failed:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// ===== BRAIN SYSTEM INTEGRATION =====
function initializeBrainSystem() {
    if (!window.brainSystem) {
        console.error('❌ Brain system not loaded! Make sure brain.js is included.');
        return;
    }

    // Set up brain system callbacks
    window.brainSystem.setCallbacks(
        // Self-talk callback
        (thought, trigger) => {
            console.log(`🧠 Self-talk: ${thought.text} (${trigger})`);
            handleBrainSelfTalk(thought, trigger);
        },
        // Emotion change callback
        (emotion, trigger) => {
            console.log(`🧠 Emotion changed: ${emotion} (${trigger})`);
            handleBrainEmotionChange(emotion, trigger);
        }
    );

    // Initialize brain system (auto-talk OFF by default)
    window.brainSystem.initialize();
    
    // Auto-talk starts OFF - user must enable in settings
    if (window.brainSystem.selfTalkManager) {
        window.brainSystem.selfTalkManager.stop();
        console.log('🤐 Auto-talk disabled by default - enable in settings');
    }
    
    console.log('🧠 Brain system integrated with app.js!');
}

// Self-talk handler - FIXED for brain system
async function handleBrainSelfTalk(thought, trigger) {
    // Skip if currently speaking or thinking
    if (appState === 'speaking' || appState === 'thinking') {
        console.log('⏸️ Skipping self-talk - character is busy');
        return;
    }

    try {
        console.log(`🧠 Processing self-talk: "${thought.text}" (${trigger})`);
        
        setAppState('thinking');
        
        // Set emotion based on thought
        setEmotion(thought.emotion);
        
        // Minimal delay - no artificial waiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Speak the thought with proper cleanup
        await speakText(thought.text);
        
        // Reset mouth state after self-talk
        setTimeout(() => {
            if (appState === 'idle') {
                resetMouthState();
                console.log('🔧 Reset mouth after self-talk');
            }
        }, 200);
        
        console.log(`✅ Self-talk completed: ${thought.type}`);
        
    } catch (error) {
        console.error('❌ Self-talk failed:', error);
        resetSystemState();
    }
}

// Emotion change handler
function handleBrainEmotionChange(emotion, trigger) {
    // Update VRM emotion
    setEmotion(emotion);
    
    // Log emotion change
    console.log(`🎭 Character emotion: ${emotion} (caused by: ${trigger})`);
}

// Enhanced AI response with brain system
async function getAIResponseWithBrain(userMessage) {
    // Process message through brain system
    const enhancedPrompt = window.brainSystem.processUserMessage(userMessage);
    
    // Track API usage
    trackAPIUsage('response');
    
    // Call Gemini API with enhanced prompt (use current model)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentResponseModel}:generateContent?key=${apiUsage.responseApiKey}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: enhancedPrompt
            }]
        }]
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.candidates?.[0]?.content?.parts?.[0]) {
        throw new Error('Invalid API response');
    }

    const text = result.candidates[0].content.parts[0].text;
    return JSON.parse(text.replaceAll("```json", "").replaceAll("```", "").trim());
}

// ===== API TRACKING INITIALIZATION =====
async function initializeAPITracking() {
    console.log('🔍 Initializing API tracking...');
    
    // Detect API tier
    await detectAPITier();
    
    // Load saved usage from localStorage
    const savedUsage = localStorage.getItem('apiUsage');
    if (savedUsage) {
        const parsed = JSON.parse(savedUsage);
        const today = new Date().toDateString();
        
        // Only restore if same day
        if (parsed.lastReset === today) {
            apiUsage.responseRequests = parsed.responseRequests || 0;
            apiUsage.ttsRequests = parsed.ttsRequests || 0;
            console.log('📊 Restored daily usage from localStorage');
        }
    }
    
    // Update display
    updateLimitDisplay();
    updateResponseAPIStatus();
    updateTTSAPIStatus();
    
    console.log('✅ API tracking initialized');
}

// Save usage to localStorage
function saveAPIUsage() {
    localStorage.setItem('apiUsage', JSON.stringify(apiUsage));
}

// ===== SETTINGS MANAGEMENT =====
function initializeSettings() {
    // Get elements
    const settingsBtn = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const closeBtn = document.getElementById('close-settings');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    const autoTalkToggle = document.getElementById('auto-talk-toggle');
    const responseModelSelect = document.getElementById('response-model');
    const ttsModelSelect = document.getElementById('tts-model');
    const responseApiKeyInput = document.getElementById('response-api-key-input');
    const saveResponseApiKeyBtn = document.getElementById('save-response-api-key');
    const responseApiStatusDiv = document.getElementById('response-api-status');
    const responseApiTierInfo = document.getElementById('response-api-tier-info');
    const ttsApiKeyInput = document.getElementById('tts-api-key-input');
    const saveTtsApiKeyBtn = document.getElementById('save-tts-api-key');
    const ttsApiStatusDiv = document.getElementById('tts-api-status');
    const ttsApiTierInfo = document.getElementById('tts-api-tier-info');
    
    if (!settingsBtn || !settingsPanel) {
        console.error('❌ Settings elements not found');
        return;
    }
    
    // Settings button click
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
    });
    
    // Close button click
    closeBtn?.addEventListener('click', () => {
        settingsPanel.classList.add('hidden');
    });
    
    // Click outside to close
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
            settingsPanel.classList.add('hidden');
        }
    });
    
    // Volume slider
    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            volumeLevel = value / 100; // Convert to 0-1
            volumeValue.textContent = `${value}%`;
            
            // Apply volume to current audio
            if (audioContext && currentAudioSource) {
                // Note: Web Audio API doesn't have direct volume control on source
                // Volume is applied during audio creation
            }
            
            console.log(`🔊 Volume set to ${value}%`);
        });
    }
    
    // Auto talk toggle
    if (autoTalkToggle) {
        autoTalkToggle.addEventListener('change', (e) => {
            autoTalkEnabled = e.target.checked;
            
            if (window.brainSystem?.selfTalkManager) {
                if (autoTalkEnabled) {
                    window.brainSystem.selfTalkManager.start();
                    console.log('🗣️ Auto talk ENABLED');
                } else {
                    window.brainSystem.selfTalkManager.stop();
                    console.log('🤐 Auto talk DISABLED');
                }
            }
            
            console.log(`🤖 Auto talk: ${autoTalkEnabled ? 'ON' : 'OFF'}`);
        });
    }
    
    // Response model selection
    if (responseModelSelect) {
        responseModelSelect.addEventListener('change', (e) => {
            currentResponseModel = e.target.value;
            console.log(`📝 Response model changed to: ${currentResponseModel}`);
            updateLimitDisplay();
        });
    }
    
    // TTS model selection
    if (ttsModelSelect) {
        ttsModelSelect.addEventListener('change', (e) => {
            currentTTSModel = e.target.value;
            console.log(`🎵 TTS model changed to: ${currentTTSModel}`);
            updateLimitDisplay();
        });
    }
    
    // Response API Key input handlers
    if (responseApiKeyInput && saveResponseApiKeyBtn) {
        // Load saved response API key
        if (apiUsage.responseApiKey) {
            responseApiKeyInput.value = '••••••••••••••••••••';
            updateResponseAPIStatus();
        }
        
        // Save response API key
        saveResponseApiKeyBtn.addEventListener('click', async () => {
            const newApiKey = responseApiKeyInput.value.trim();
            if (newApiKey && newApiKey !== '••••••••••••••••••••') {
                console.log('💾 Saving new response API key...');
                apiUsage.responseApiKey = newApiKey;
                
                // Update status
                if (responseApiTierInfo) responseApiTierInfo.textContent = '🔍 Response API analiz ediliyor...';
                
                try {
                    // Detect tier with new API key
                    await detectAPITier();
                    
                    // Update UI
                    responseApiKeyInput.value = '••••••••••••••••••••';
                    updateResponseAPIStatus();
                    updateLimitDisplay();
                    
                    console.log('✅ Response API key saved and analyzed');
                    
                } catch (error) {
                    console.error('❌ Response API key validation failed:', error);
                    if (responseApiTierInfo) {
                        responseApiTierInfo.textContent = '❌ Geçersiz Response API key';
                    }
                    // Don't save invalid API key
                    apiUsage.responseApiKey = '';
                }
                
                saveAPIUsage();
            }
        });
        
        // Clear API key option
        responseApiKeyInput.addEventListener('focus', () => {
            if (responseApiKeyInput.value === '••••••••••••••••••••') {
                responseApiKeyInput.value = '';
            }
        });
    }
    
    // TTS API Key input handlers
    if (ttsApiKeyInput && saveTtsApiKeyBtn) {
        // Load saved TTS API key
        if (apiUsage.ttsApiKey) {
            ttsApiKeyInput.value = '••••••••••••••••••••';
            updateTTSAPIStatus();
        }
        
        // Save TTS API key
        saveTtsApiKeyBtn.addEventListener('click', async () => {
            const newApiKey = ttsApiKeyInput.value.trim();
            if (newApiKey && newApiKey !== '••••••••••••••••••••') {
                console.log('💾 Saving new TTS API key...');
                apiUsage.ttsApiKey = newApiKey;
                
                // Update status
                if (ttsApiTierInfo) ttsApiTierInfo.textContent = '🔍 TTS API analiz ediliyor...';
                
                try {
                    // Update UI
                    ttsApiKeyInput.value = '••••••••••••••••••••';
                    updateTTSAPIStatus();
                    updateLimitDisplay();
                    
                    console.log('✅ TTS API key saved and analyzed');
                    
                } catch (error) {
                    console.error('❌ TTS API key validation failed:', error);
                    if (ttsApiTierInfo) {
                        ttsApiTierInfo.textContent = '❌ Geçersiz TTS API key';
                    }
                    // Don't save invalid API key
                    apiUsage.ttsApiKey = '';
                }
                
                saveAPIUsage();
            }
        });
        
        // Clear API key option
        ttsApiKeyInput.addEventListener('focus', () => {
            if (ttsApiKeyInput.value === '••••••••••••••••••••') {
                ttsApiKeyInput.value = '';
            }
        });
    }
    
    console.log('⚙️ Settings initialized');
}

function updateResponseAPIStatus() {
    const apiTierInfo = document.getElementById('response-api-tier-info');
    if (apiTierInfo && apiUsage.responseApiKey) {
        const tier = apiUsage.tier.toUpperCase();
        const realUsage = apiUsage.realUsage.response;
        
        if (realUsage.limit > 0) {
            apiTierInfo.innerHTML = `✅ ${tier} Tier | Kullanım: ${realUsage.used}/${realUsage.limit}`;
        } else {
            apiTierInfo.textContent = `✅ ${tier} Tier aktif`;
        }
    }
}

async function detectTTSTier() {
    if (!apiUsage.ttsApiKey) {
        console.log('⚠️ No TTS API key provided - cannot detect tier');
        return 'free';
    }

    try {
        console.log('🔍 Analyzing TTS API key...');
        
        // Test TTS API with a simple request
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiUsage.ttsApiKey}`;
        const testPayload = {
            contents: [{ parts: [{ text: "test" }] }],
            generationConfig: {
                responseModalities: ["AUDIO"]
            }
        };

        const response = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        console.log('🔍 TTS API Response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid TTS API key');
            } else if (response.status === 429) {
                console.log('🚫 TTS Rate limit hit - API key is valid');
                return 'free';
            }
        }

        // Check TTS-specific headers or response
        const ttsLimit = response.headers.get('x-ratelimit-limit') || response.headers.get('x-ratelimit-limit-requests');
        
        if (ttsLimit) {
            const limitValue = parseInt(ttsLimit);
            apiUsage.realUsage.tts.limit = limitValue;
            
            if (limitValue >= 100000) return 'enterprise';
            else if (limitValue >= 3000) return 'tier1';
            else return 'free';
        }

        // Default tier detection for TTS
        if (apiUsage.ttsApiKey.length > 50) {
            return 'tier1';
        } else {
            return 'free';
        }
        
    } catch (error) {
        console.error('❌ Failed to detect TTS API tier:', error);
        return 'free';
    }
}

function updateTTSAPIStatus() {
    const apiTierInfo = document.getElementById('tts-api-tier-info');
    if (apiTierInfo && apiUsage.ttsApiKey) {
        // Try to detect TTS tier
        detectTTSTier().then(tier => {
            if (tier === 'free') {
                apiTierInfo.textContent = `✅ TTS API aktif (Free Tier)`;
            } else if (tier === 'tier1') {
                apiTierInfo.textContent = `✅ TTS API aktif (Tier 1)`;
            } else {
                apiTierInfo.textContent = `✅ TTS API aktif (Enterprise)`;
            }
        }).catch(() => {
            apiTierInfo.textContent = `✅ TTS API aktif`;
        });
    }
}

// Apply volume to audio buffer
function applyVolumeToAudio(audioBuffer) {
    if (!audioBuffer || volumeLevel === 1.0) return audioBuffer;
    
    // Create a new buffer with adjusted volume
    const adjustedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const originalData = audioBuffer.getChannelData(channel);
        const adjustedData = adjustedBuffer.getChannelData(channel);
        
        for (let i = 0; i < originalData.length; i++) {
            adjustedData[i] = originalData[i] * volumeLevel;
        }
    }
    
    return adjustedBuffer;
}

// ===== START APPLICATION =====
init();

// Event Listeners for Settings Modal
document.addEventListener('DOMContentLoaded', function() {
    // Settings button click
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
        settingsButton.addEventListener('click', openSettingsModal);
    }
    
    // Close settings button
    const closeSettingsBtn = document.getElementById('close-settings');
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', closeSettingsModal);
    }
    
    // Cancel settings button
    const cancelSettingsBtn = document.getElementById('cancel-settings');
    if (cancelSettingsBtn) {
        cancelSettingsBtn.addEventListener('click', closeSettingsModal);
    }
    
    // Save all settings button
    const saveAllSettingsBtn = document.getElementById('save-all-settings');
    if (saveAllSettingsBtn) {
        saveAllSettingsBtn.addEventListener('click', saveAllSettings);
    }
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.closest('.tab-btn').dataset.tab;
            showSettingsTab(tabName);
        });
    });
    
    // Modal backdrop click to close
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }
    
    // Input change listeners for unsaved changes
    document.querySelectorAll('.setting-group input, .setting-group select, .setting-group textarea').forEach(input => {
        input.addEventListener('change', markSettingsChanged);
        input.addEventListener('input', markSettingsChanged);
    });
    
    // Volume slider
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', updateVolumeDisplay);
    }
    
    // Edge speed slider
    const edgeSpeedSlider = document.getElementById('edge-speed');
    if (edgeSpeedSlider) {
        edgeSpeedSlider.addEventListener('input', updateEdgeSpeedDisplay);
    }
    
    // Animation speed slider
    const animationSpeedSlider = document.getElementById('animation-speed');
    if (animationSpeedSlider) {
        animationSpeedSlider.addEventListener('input', updateAnimationSpeedDisplay);
    }
    
    // Edge language change
    const edgeLanguageSelect = document.getElementById('edge-language');
    if (edgeLanguageSelect) {
        edgeLanguageSelect.addEventListener('change', updateEdgeVoiceOptions);
    }
    
    // Character personality change
    const characterPersonalitySelect = document.getElementById('character-personality');
    if (characterPersonalitySelect) {
        characterPersonalitySelect.addEventListener('change', updatePersonalityFields);
    }
    
    // TTS service change
    const ttsServiceSelect = document.getElementById('tts-service');
    if (ttsServiceSelect) {
        ttsServiceSelect.addEventListener('change', () => {
            currentTTSService = ttsServiceSelect.value;
            console.log(`🎤 TTS servisi değiştirildi: ${currentTTSService}`);
            updateTTSServiceSettings();
            updateLimitDisplay();
        });
    }
    
    // Export settings button
    const exportSettingsBtn = document.getElementById('export-settings');
    if (exportSettingsBtn) {
        exportSettingsBtn.addEventListener('click', exportSettings);
    }
    
    // Import settings file input
    const importSettingsInput = document.getElementById('import-settings');
    if (importSettingsInput) {
        importSettingsInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importSettings(e.target.files[0]);
            }
        });
    }
    
    // Reset settings button
    const resetSettingsBtn = document.getElementById('reset-settings');
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', resetAllSettings);
    }
    
    // Save individual API keys
    const saveResponseApiKeyBtn = document.getElementById('save-response-api-key');
    if (saveResponseApiKeyBtn) {
        saveResponseApiKeyBtn.addEventListener('click', () => {
            const apiKey = document.getElementById('response-api-key-input')?.value;
            if (apiKey) {
                localStorage.setItem('responseApiKey', apiKey);
                showNotification('✅ Response API Key kaydedildi!', 'success');
                markSettingsChanged();
            }
        });
    }
    
    const saveTtsApiKeyBtn = document.getElementById('save-tts-api-key');
    if (saveTtsApiKeyBtn) {
        saveTtsApiKeyBtn.addEventListener('click', () => {
            const apiKey = document.getElementById('tts-api-key-input')?.value;
            if (apiKey) {
                localStorage.setItem('ttsApiKey', apiKey);
                showNotification('✅ TTS API Key kaydedildi!', 'success');
                markSettingsChanged();
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC key to close settings
        if (e.key === 'Escape') {
            const modal = document.getElementById('settings-modal');
            if (modal && !modal.classList.contains('hidden')) {
                closeSettingsModal();
            }
        }
        
        // Ctrl+S to save all settings
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const modal = document.getElementById('settings-modal');
            if (modal && !modal.classList.contains('hidden')) {
                saveAllSettings();
            }
        }
    });
});

// Modal Ayarlar Sistemi
let currentSettingsTab = 'general';
let hasUnsavedChanges = false;

// Ayarlar modalını aç
function openSettingsModal() {
    console.log('🔧 Ayarlar modalı açılıyor...');
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // İlk tab'ı aktif et
        showSettingsTab('general');
        
        // Mevcut ayarları yükle
        loadCurrentSettings();
        
        console.log('✅ Ayarlar modalı açıldı');
    } else {
        console.error('❌ Settings modal bulunamadı!');
    }
}

// Ayarlar modalını kapat
function closeSettingsModal() {
    console.log('🔧 Ayarlar modalı kapatılıyor...');
    if (hasUnsavedChanges) {
        if (confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?')) {
            resetUnsavedChanges();
            const modal = document.getElementById('settings-modal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
                console.log('✅ Ayarlar modalı kapatıldı (değişiklikler iptal edildi)');
            }
        }
    } else {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            console.log('✅ Ayarlar modalı kapatıldı');
        }
    }
}

// Tab değiştir
function showSettingsTab(tabName) {
    console.log(`🔧 Tab değiştiriliyor: ${tabName}`);
    
    // Tüm tab'ları gizle
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Tüm tab butonlarını pasif et
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Seçilen tab'ı göster
    const selectedPanel = document.getElementById(`${tabName}-tab`);
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (selectedPanel) {
        selectedPanel.classList.add('active');
        console.log(`✅ ${tabName} tab'ı aktif edildi`);
    }
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    currentSettingsTab = tabName;
}

// Ayar değişikliği tespit et
function markSettingsChanged() {
    hasUnsavedChanges = true;
    const unsavedElement = document.getElementById('unsaved-changes');
    if (unsavedElement) {
        unsavedElement.style.display = 'block';
    }
    console.log('⚠️ Ayar değişikliği tespit edildi');
}

// Değişiklikleri sıfırla
function resetUnsavedChanges() {
    hasUnsavedChanges = false;
    const unsavedElement = document.getElementById('unsaved-changes');
    if (unsavedElement) {
        unsavedElement.style.display = 'none';
    }
    console.log('✅ Değişiklikler sıfırlandı');
}

// Mevcut ayarları yükle
function loadCurrentSettings() {
    console.log('🔧 Mevcut ayarlar yükleniyor...');

    try {
        // Ses seviyesi
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = localStorage.getItem('volume') || 70;
            updateVolumeDisplay();
        }

        // Otomatik konuşma
        const autoTalkToggle = document.getElementById('auto-talk-toggle');
        if (autoTalkToggle) {
            autoTalkToggle.checked = localStorage.getItem('autoTalk') === 'true';
        }

        // Varsayılan dil
        const defaultLanguage = document.getElementById('default-language');
        if (defaultLanguage) {
            defaultLanguage.value = localStorage.getItem('defaultLanguage') || 'tr';
        }

        // Response API Key
        const responseApiKeyInput = document.getElementById('response-api-key-input');
        if (responseApiKeyInput) {
            responseApiKeyInput.value = localStorage.getItem('responseApiKey') || '';
            apiUsage.responseApiKey = responseApiKeyInput.value; // Global değişkeni güncelle
        }

        // Response Model
        const responseModel = document.getElementById('response-model');
        if (responseModel) {
            responseModel.value = localStorage.getItem('responseModel') || 'gemini-2.5-flash-lite';
            currentResponseModel = responseModel.value; // Global değişkeni güncelle
        }

        // Karakter kişiliği
        const characterPersonality = document.getElementById('character-personality');
        if (characterPersonality) {
            characterPersonality.value = localStorage.getItem('characterPersonality') || 'cute';
            updatePersonalityFields();
        }

        // TTS API Key - Sadece Gemini TTS için gerekli
        const ttsApiKeyInput = document.getElementById('tts-api-key-input');
        if (ttsApiKeyInput) {
            ttsApiKeyInput.value = localStorage.getItem('ttsApiKey') || '';
            apiUsage.ttsApiKey = ttsApiKeyInput.value; // Global değişkeni güncelle
            console.log('🔑 TTS API Key yüklendi:', ttsApiKeyInput.value ? 'Mevcut' : 'Yok');
        }

        // TTS Servisi
        const ttsService = document.getElementById('tts-service');
        if (ttsService) {
            currentTTSService = localStorage.getItem('ttsService') || 'edge-tts';
            ttsService.value = currentTTSService;
            console.log('🎤 TTS servisi yüklendi:', currentTTSService);
            updateTTSServiceSettings();
        }

        // Edge TTS ayarları
        const edgeLanguage = document.getElementById('edge-language');
        if (edgeLanguage) {
            edgeLanguage.value = localStorage.getItem('edgeLanguage') || 'tr';
            console.log('🌍 Edge dili yüklendi:', edgeLanguage.value);
            updateEdgeVoiceOptions();
        }

        const edgeSpeed = document.getElementById('edge-speed');
        if (edgeSpeed) {
            edgeSpeed.value = localStorage.getItem('edgeSpeed') || 1.0;
            updateEdgeSpeedDisplay();
        }

        // Gemini TTS ayarları
        const geminiTtsModel = document.getElementById('gemini-tts-model');
        if (geminiTtsModel) {
            const storedGeminiModel = localStorage.getItem('geminiTtsModel');
            const allowedModels = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts', 'gemini-2.0-flash-preview-tts'];
            const initialModel = allowedModels.includes(storedGeminiModel) ? storedGeminiModel : 'gemini-2.5-flash-preview-tts';
            geminiTtsModel.value = initialModel;
            currentTTSModel = initialModel;
        }

        const geminiVoice = document.getElementById('gemini-voice');
        if (geminiVoice) {
            geminiVoice.value = localStorage.getItem('geminiVoice') || 'alnilam';
        }

        // Karakter ayarları
        const characterTheme = document.getElementById('character-theme');
        if (characterTheme) {
            characterTheme.value = localStorage.getItem('characterTheme') || 'default';
        }

         // UI Theme
        const mainUIThemeSelect = document.getElementById('main-ui-theme');
        if (mainUIThemeSelect) {
            mainUIThemeSelect.value = localStorage.getItem('main-ui-theme') || 'modern';
        }

        // Default Emotion
        const defaultEmotion = document.getElementById('default-emotion');
        if (defaultEmotion) {
            defaultEmotion.value = localStorage.getItem('defaultEmotion') || 'happy';
        }

        const animationSpeed = document.getElementById('animation-speed');
        if (animationSpeed) {
            animationSpeed.value = localStorage.getItem('animationSpeed') || 1.0;
            updateAnimationSpeedDisplay();
        }

        // Gelişmiş ayarlar
        const debugMode = document.getElementById('debug-mode');
        if (debugMode) {
            debugMode.checked = localStorage.getItem('debugMode') === 'true';
        }

        const autoBackup = document.getElementById('auto-backup');
        if (autoBackup) {
            autoBackup.checked = localStorage.getItem('autoBackup') === 'true';
        }

        console.log('✅ Ayarlar başarıyla yüklendi');
        
        // Limit panel'i güncelle
        updateLimitPanel();

    } catch (error) {
        console.error('❌ Ayarlar yüklenirken hata:', error);
    }
}

// TTS servis ayarlarını güncelle
function updateTTSServiceSettings() {
    const ttsService = document.getElementById('tts-service')?.value || 'edge-tts';
    const edgeSettings = document.getElementById('edge-tts-settings');
    const geminiSettings = document.getElementById('gemini-tts-settings');
    const geminiApiGroup = document.getElementById('gemini-tts-api-group');
    
    console.log('🎭 TTS servisi değişti:', ttsService);
    
    if (ttsService === 'edge-tts') {
        // Edge TTS seçildi - API key gerekmez
        if (edgeSettings) edgeSettings.style.display = 'block';
        if (geminiSettings) geminiSettings.style.display = 'none';
        if (geminiApiGroup) geminiApiGroup.style.display = 'none';
        console.log('✅ Edge TTS seçildi - API key gerekmez');
    } else {
        // Gemini TTS seçildi - API key gerekir
        if (edgeSettings) edgeSettings.style.display = 'none';
        if (geminiSettings) geminiSettings.style.display = 'block';
        if (geminiApiGroup) geminiApiGroup.style.display = 'block';
        console.log('🔑 Gemini TTS seçildi - API key gerekir');
    }
}

// Edge ses seçeneklerini güncelle
function updateEdgeVoiceOptions() {
    const languageSelect = document.getElementById('edge-language');
    const voiceSelect = document.getElementById('edge-voice');
    
    if (!languageSelect || !voiceSelect) return;
    
    const selectedLanguage = languageSelect.value;
    console.log('🌍 Dil değişti:', selectedLanguage);
    
    const voices = EDGE_TTS_VOICES[selectedLanguage] || {};
    console.log('🎭 Mevcut sesler:', voices);
    
    // Mevcut seçenekleri temizle
    voiceSelect.innerHTML = '';
    
    // Yeni seçenekleri ekle
    Object.entries(voices).forEach(([name, voiceId]) => {
        const option = document.createElement('option');
        option.value = voiceId;
        option.textContent = `${name} (${voiceId})`;
        voiceSelect.appendChild(option);
        console.log(`✅ Ses eklendi: ${name} - ${voiceId}`);
    });
    
    // LocalStorage'dan kaydedilmiş sesi yükle
    const savedVoice = localStorage.getItem('edgeVoice');
    let selectedVoice = voiceSelect.options[0]?.value || 'tr-TR-EmelNeural';
    
    // Eğer kaydedilmiş ses bu dilde mevcutsa, onu seç
    if (savedVoice && voices[Object.keys(voices).find(key => voices[key] === savedVoice)]) {
        selectedVoice = savedVoice;
        console.log(`💾 Kaydedilmiş ses bulundu: ${selectedVoice}`);
    } else {
        // Yoksa ilk sesi seç ve localStorage'a kaydet
        console.log(`🎯 Varsayılan ses seçildi: ${selectedVoice}`);
        localStorage.setItem('edgeVoice', selectedVoice);
    }
    
    voiceSelect.value = selectedVoice;
    
    // Ses seçimi değiştiğinde localStorage'a kaydet
    voiceSelect.addEventListener('change', function() {
        localStorage.setItem('edgeVoice', this.value);
        console.log(`💾 Ses kaydedildi: ${this.value}`);
    });
}

// Kişilik alanlarını güncelle
function updatePersonalityFields() {
    const personalitySelect = document.getElementById('character-personality');
    const customGroup = document.getElementById('custom-personality-group');
    
    if (!personalitySelect || !customGroup) return;
    
    if (personalitySelect.value === 'custom') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
}

// Ses hızı gösterimini güncelle
function updateEdgeSpeedDisplay() {
    const speedSlider = document.getElementById('edge-speed');
    const speedValue = document.getElementById('edge-speed-value');
    
    if (speedSlider && speedValue) {
        speedValue.textContent = `${speedSlider.value}x`;
    }
}

// Animasyon hızı gösterimini güncelle
function updateAnimationSpeedDisplay() {
    const speedSlider = document.getElementById('animation-speed');
    const speedValue = document.getElementById('animation-speed-value');
    
    if (speedSlider && speedValue) {
        speedValue.textContent = `${speedSlider.value}x`;
    }
}

// Ses seviyesi gösterimini güncelle
function updateVolumeDisplay() {
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    
    if (volumeSlider && volumeValue) {
        volumeValue.textContent = `${volumeSlider.value}%`;
    }
}

// Tüm ayarları kaydet
function saveAllSettings() {
    try {
        console.log('💾 Tüm ayarlar kaydediliyor...');

        // UI theme
        const mainUITheme = document.getElementById('main-ui-theme');
        if (mainUITheme) {
            localStorage.setItem('main-ui-theme', mainUITheme.value);
            console.log(`✅ UI teması kaydedildi: ${mainUITheme.value}`);
        }
        
        // Yeni UI ayarları
        const borderRadiusSlider = document.getElementById('border-radius');
        if (borderRadiusSlider) {
            localStorage.setItem('border-radius', borderRadiusSlider.value);
        }
        
        const transparencySlider = document.getElementById('transparency');
        if (transparencySlider) {
            localStorage.setItem('transparency', transparencySlider.value);
        }
        
        const colorIntensitySlider = document.getElementById('color-intensity');
        if (colorIntensitySlider) {
            localStorage.setItem('color-intensity', colorIntensitySlider.value);
        }
        
        const primaryColorInput = document.getElementById('primary-color');
        if (primaryColorInput) {
            localStorage.setItem('primary-color', primaryColorInput.value);
        }
        
        const secondaryColorInput = document.getElementById('secondary-color');
        if (secondaryColorInput) {
            localStorage.setItem('secondary-color', secondaryColorInput.value);
        }
        
        const accentColorInput = document.getElementById('accent-color');
        if (accentColorInput) {
            localStorage.setItem('accent-color', accentColorInput.value);
        }
        
        const messagePositionSelect = document.getElementById('message-position');
        if (messagePositionSelect) {
            localStorage.setItem('message-position', messagePositionSelect.value);
        }
        
        const messageBoxStyleSelect = document.getElementById('message-box-style');
        if (messageBoxStyleSelect) {
            localStorage.setItem('message-box-style', messageBoxStyleSelect.value);
        }
        
        const messageAnimationSelect = document.getElementById('message-animation');
        if (messageAnimationSelect) {
            localStorage.setItem('message-animation', messageAnimationSelect.value);
        }
        
        const userMessageColorInput = document.getElementById('user-message-color');
        if (userMessageColorInput) {
            localStorage.setItem('user-message-color', userMessageColorInput.value);
        }
        
        const botMessageColorInput = document.getElementById('bot-message-color');
        if (botMessageColorInput) {
            localStorage.setItem('bot-message-color', botMessageColorInput.value);
        }
        
        // Efekt toggle'ları
        const animationEffectsToggle = document.getElementById('animation-effects');
        if (animationEffectsToggle) {
            localStorage.setItem('animation-effects', animationEffectsToggle.checked);
        }
        
        const shadowEffectsToggle = document.getElementById('shadow-effects');
        if (shadowEffectsToggle) {
            localStorage.setItem('shadow-effects', shadowEffectsToggle.checked);
        }
        
        const gradientEffectsToggle = document.getElementById('gradient-effects');
        if (gradientEffectsToggle) {
            localStorage.setItem('gradient-effects', gradientEffectsToggle.checked);
        }
        
        const crystalEffectToggle = document.getElementById('crystal-effect');
        if (crystalEffectToggle) {
            localStorage.setItem('crystal-effect', crystalEffectToggle.checked);
        }
        
        const neonEffectToggle = document.getElementById('neon-effect');
        if (neonEffectToggle) {
            localStorage.setItem('neon-effect', neonEffectToggle.checked);
        }
        
        const messageTypingEffectToggle = document.getElementById('message-typing-effect');
        if (messageTypingEffectToggle) {
            localStorage.setItem('message-typing-effect', messageTypingEffectToggle.checked);
        }
        
        const messageDecorationToggle = document.getElementById('message-decoration');
        if (messageDecorationToggle) {
            localStorage.setItem('message-decoration', messageDecorationToggle.checked);
        }

        // Ses ayarları
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            localStorage.setItem('volume', volumeSlider.value);
            console.log(`✅ Ses seviyesi kaydedildi: ${volumeSlider.value}`);
        }

        // Otomatik konuşma
        const autoTalkToggle = document.getElementById('auto-talk-toggle');
        if (autoTalkToggle) {
            localStorage.setItem('autoTalk', autoTalkToggle.checked);
            console.log(`✅ Otomatik konuşma kaydedildi: ${autoTalkToggle.checked}`);
        }

        // Varsayılan dil
        const defaultLanguage = document.getElementById('default-language');
        if (defaultLanguage) {
            localStorage.setItem('defaultLanguage', defaultLanguage.value);
             console.log(`✅ Varsayılan dil kaydedildi: ${defaultLanguage.value}`);
        }

        // Response API Key
        const responseApiKeyInput = document.getElementById('response-api-key-input');
        if (responseApiKeyInput) {
            localStorage.setItem('responseApiKey', responseApiKeyInput.value);
            apiUsage.responseApiKey = responseApiKeyInput.value; // Global değişkeni güncelle
            console.log(`✅ Response API Key kaydedildi: ${responseApiKeyInput.value}`);
        }

        // Response Model
        const responseModel = document.getElementById('response-model');
        if (responseModel) {
            localStorage.setItem('responseModel', responseModel.value);
            currentResponseModel = responseModel.value; // Global değişkeni güncelle
            console.log(`✅ Response Model kaydedildi: ${responseModel.value}`);
        }

        // Karakter kişiliği
        const characterPersonality = document.getElementById('character-personality');
        if (characterPersonality) {
            localStorage.setItem('characterPersonality', characterPersonality.value);
            console.log(`✅ Karakter kişiliği kaydedildi: ${characterPersonality.value}`);
        }

        // Özel kişilik
        const customPersonalityText = document.getElementById('custom-personality-text');
        if (customPersonalityText) {
            localStorage.setItem('customPersonality', customPersonalityText.value);
            console.log(`✅ Özel kişilik kaydedildi: ${customPersonalityText.value}`);
        }

        // TTS API Key - Sadece Gemini TTS için gerekli
        const ttsApiKeyInput = document.getElementById('tts-api-key-input');
        if (ttsApiKeyInput) {
            localStorage.setItem('ttsApiKey', ttsApiKeyInput.value);
            apiUsage.ttsApiKey = ttsApiKeyInput.value; // Global değişkeni güncelle
            console.log(`✅ TTS API Key kaydedildi: ${ttsApiKeyInput.value ? 'Mevcut' : 'Yok'}`);
        }

        // TTS Servisi
        const ttsService = document.getElementById('tts-service');
        if (ttsService) {
            localStorage.setItem('ttsService', ttsService.value);
            currentTTSService = ttsService.value;
            console.log(`✅ TTS Servisi kaydedildi: ${currentTTSService}`);
            updateTTSServiceSettings();
        }

        // Edge TTS ayarları
        const edgeLanguage = document.getElementById('edge-language');
        if (edgeLanguage) {
            localStorage.setItem('edgeLanguage', edgeLanguage.value);
            console.log(`✅ Edge Dili kaydedildi: ${edgeLanguage.value}`);
            
            // Dil değiştiğinde ses seçeneklerini güncelle
            updateEdgeVoiceOptions();
        }

        const edgeVoice = document.getElementById('edge-voice');
        if (edgeVoice) {
            localStorage.setItem('edgeVoice', edgeVoice.value);
            console.log(`✅ Edge Sesi kaydedildi: ${edgeVoice.value}`);
        }

        const edgeSpeed = document.getElementById('edge-speed');
        if (edgeSpeed) {
            localStorage.setItem('edgeSpeed', edgeSpeed.value);
            console.log(`✅ Edge Hızı kaydedildi: ${edgeSpeed.value}`);
        }

        // Gemini TTS ayarları
        const geminiTtsModel = document.getElementById('gemini-tts-model');
        if (geminiTtsModel) {
            localStorage.setItem('geminiTtsModel', geminiTtsModel.value);
            console.log(`✅ Gemini TTS Model kaydedildi: ${geminiTtsModel.value}`);
        }

        const geminiVoice = document.getElementById('gemini-voice');
        if (geminiVoice) {
            localStorage.setItem('geminiVoice', geminiVoice.value);
            console.log(`✅ Gemini Sesi kaydedildi: ${geminiVoice.value}`);
        }

        // Karakter ayarları
        const characterTheme = document.getElementById('character-theme');
        if (characterTheme) {
            localStorage.setItem('characterTheme', characterTheme.value);
            console.log(`✅ Karakter Teması kaydedildi: ${characterTheme.value}`);
        }

        const defaultEmotion = document.getElementById('default-emotion');
        if (defaultEmotion) {
            localStorage.setItem('defaultEmotion', defaultEmotion.value);
            console.log(`✅ Default Emotion kaydedildi: ${defaultEmotion.value}`);
        }

        const animationSpeed = document.getElementById('animation-speed');
        if (animationSpeed) {
            localStorage.setItem('animationSpeed', animationSpeed.value);
             console.log(`✅ Animasyon hızı kaydedildi: ${animationSpeed.value}`);
        }

        // Gelişmiş ayarlar
        const debugMode = document.getElementById('debug-mode');
        if (debugMode) {
            localStorage.setItem('debugMode', debugMode.checked);
            console.log(`✅ Debug Modu kaydedildi: ${debugMode.checked}`);
        }

        const autoBackup = document.getElementById('auto-backup');
        if (autoBackup) {
            localStorage.setItem('autoBackup', autoBackup.checked);
             console.log(`✅ Auto Backup kaydedildi: ${autoBackup.checked}`);
        }

        // Başarı mesajı
        showNotification('✅ Tüm ayarlar başarıyla kaydedildi!', 'success');

        // Değişiklikleri sıfırla
        resetUnsavedChanges();

        // Ayarları uygula
        applySettings();
        
        // Limit panel'i güncelle
        updateLimitPanel();

        console.log('✅ Tüm ayarlar başarıyla kaydedildi');

    } catch (error) {
        console.error('❌ Ayarlar kaydedilirken hata:', error);
        showNotification('❌ Ayarlar kaydedilirken hata oluştu!', 'error');
    }
}

// Ayarları uygula
function applySettings() {
    // Ses seviyesi
    const volume = localStorage.getItem('volume') || 70;
    if (window.audioContext) {
        // Ses seviyesini güncelle
        console.log(`🔊 Ses seviyesi güncellendi: ${volume}%`);
    }

    // UI theme
    const mainUITheme = localStorage.getItem('main-ui-theme') || 'modern';
    applyUITheme(mainUITheme);

    // Otomatik konuşma
    const autoTalk = localStorage.getItem('autoTalk') === 'true';
    console.log(`💬 Otomatik konuşma: ${autoTalk ? 'Aktif' : 'Pasif'}`);

    // Varsayılan dil
    const defaultLanguage = localStorage.getItem('defaultLanguage') || 'tr';
    console.log(`🌍 Varsayılan dil: ${defaultLanguage}`);

    // API Keys
    const responseApiKey = localStorage.getItem('responseApiKey') || '';
    apiUsage.responseApiKey = responseApiKey; // Global değişkeni güncelle
    console.log(`🔑 Response API Key güncellendi: ${responseApiKey ? 'Mevcut' : 'Yok'}`);

    const ttsApiKey = localStorage.getItem('ttsApiKey') || '';
    apiUsage.ttsApiKey = ttsApiKey; // Global değişkeni güncelle
    console.log(`🔑 TTS API Key güncellendi: ${ttsApiKey ? 'Mevcut' : 'Yok'}`);

    // Response model
    const responseModel = localStorage.getItem('responseModel') || 'gemini-2.5-flash-lite';
    currentResponseModel = responseModel; // Global değişkeni güncelle
    console.log(`🧠 Response model: ${responseModel}`);

    // TTS servisi
    const ttsService = localStorage.getItem('ttsService') || 'edge-tts';
    currentTTSService = ttsService;
    console.log(`🎤 TTS servisi: ${ttsService}`);
    updateTTSServiceSettings();

    // Karakter teması
    const characterTheme = localStorage.getItem('characterTheme') || 'default';
    applyCharacterTheme(characterTheme);

    // Debug modu
    const debugMode = localStorage.getItem('debugMode') === 'true';
    console.log(`📊 Debug modu: ${debugMode ? 'Aktif' : 'Pasif'}`);
    
    // Limit panel'i güncelle
    updateLimitPanel();
}

// Karakter temasını uygula
function applyCharacterTheme(theme) {
    const root = document.documentElement;
    
    switch (theme) {
        case 'dark':
            root.style.setProperty('--primary-color', '#1f2937');
            root.style.setProperty('--secondary-color', '#374151');
            break;
        case 'light':
            root.style.setProperty('--primary-color', '#f9fafb');
            root.style.setProperty('--secondary-color', '#e5e7eb');
            break;
        case 'colorful':
            root.style.setProperty('--primary-color', '#7c3aed');
            root.style.setProperty('--secondary-color', '#8b5cf6');
            break;
        default:
            // Varsayılan tema
            root.style.setProperty('--primary-color', '#1e1e2e');
            root.style.setProperty('--secondary-color', '#2d2d44');
    }
    
    console.log(`🎨 Karakter teması uygulandı: ${theme}`);
}

// Ayarları dışa aktar
function exportSettings() {
    try {
        const settings = {};
        
        // Tüm ayarları topla
        const inputs = document.querySelectorAll('.setting-group input, .setting-group select, .setting-group textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                settings[input.id] = input.checked;
            } else {
                settings[input.id] = input.value;
            }
        });
        
        // LocalStorage'dan da al
        Object.keys(localStorage).forEach(key => {
            if (!settings[key]) {
                settings[key] = localStorage.getItem(key);
            }
        });
        
        // JSON dosyası olarak indir
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `anime-chatbot-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        showNotification('✅ Ayarlar başarıyla dışa aktarıldı!', 'success');
        
    } catch (error) {
        console.error('❌ Ayarlar dışa aktarılırken hata:', error);
        showNotification('❌ Ayarlar dışa aktarılırken hata oluştu!', 'error');
    }
}

// Ayarları içe aktar
function importSettings(file) {
    try {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const settings = JSON.parse(e.target.result);
                
                // Ayarları uygula
                Object.entries(settings).forEach(([key, value]) => {
                    const element = document.getElementById(key);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = value;
                        } else {
                            element.value = value;
                        }
                    }
                    // LocalStorage'a da kaydet
                    localStorage.setItem(key, value);
                });
                
                // UI'ı güncelle
                updateTTSServiceSettings();
                updateEdgeVoiceOptions();
                updatePersonalityFields();
                updateEdgeSpeedDisplay();
                updateAnimationSpeedDisplay();
                updateVolumeDisplay();
                
                showNotification('✅ Ayarlar başarıyla içe aktarıldı!', 'success');
                
            } catch (error) {
                console.error('❌ JSON parse hatası:', error);
                showNotification('❌ Geçersiz ayar dosyası!', 'error');
            }
        };
        reader.readAsText(file);
        
    } catch (error) {
        console.error('❌ Dosya okuma hatası:', error);
        showNotification('❌ Dosya okunamadı!', 'error');
    }
}

// Tüm ayarları sıfırla
function resetAllSettings() {
    if (confirm('Tüm ayarları sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        try {
            // LocalStorage'ı temizle
            localStorage.clear();
            
            // Formu sıfırla
            loadCurrentSettings();
            
            showNotification('✅ Tüm ayarlar sıfırlandı!', 'success');
            
        } catch (error) {
            console.error('❌ Ayarlar sıfırlanırken hata:', error);
            showNotification('❌ Ayarlar sıfırlanırken hata oluştu!', 'error');
        }
    }
}

// Bildirim gösterme fonksiyonu
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animasyon için timeout
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // 3 saniye sonra kaldır
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// UI tema uygulama fonksiyonu
function applyUITheme(theme) {
    const root = document.documentElement;

    switch(theme) {
        case 'glassmorphism':
            root.style.setProperty('--bg-overlay', 'rgba(255, 255, 255, 0.1)');
            root.style.setProperty('--backdrop-blur', 'blur(20px)');
            break;
        case 'neumorphism':
            root.style.setProperty('--shadow-style', 'inset 2px 2px 5px rgba(0,0,0,0.3), inset -2px -2px 5px rgba(255,255,255,0.1)');
            break;
        case 'minimal':
            root.style.setProperty('--border-radius', '0px');
            root.style.setProperty('--shadow-style', 'none');
            break;
        case 'retro':
            root.style.setProperty('--primary-color', '#ff6b35');
            root.style.setProperty('--secondary-color', '#f7931e');
            break;
        default:
            // Modern tema (varsayılan)
            root.style.setProperty('--bg-overlay', 'rgba(255, 255, 255, 0.05)');
            root.style.setProperty('--backdrop-blur', 'blur(10px)');
            root.style.setProperty('--border-radius', '12px');
            root.style.setProperty('--shadow-style', '0 4px 6px rgba(0,0,0,0.1)');
            root.style.setProperty('--primary-color', '#1e1e2e');
            root.style.setProperty('--secondary-color', '#2d2d44');
            break;
    }
}



// Edge TTS ile ses üret
async function generateEdgeTTS(text, voice, speed) {
    console.log('🎵 Edge TTS başlatılıyor...', { text: text.substring(0, 50), voice, speed });
    
    try {
        const response = await fetch('http://127.0.0.1:5000/speak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                voice: voice,
                rate: `${speed > 1 ? '+' : ''}${((speed - 1) * 100).toFixed(0)}%`
            })
        });
        
        if (!response.ok) {
            throw new Error(`Edge TTS API error: ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        // AudioContext ile ses dosyasını decode et
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        console.log('✅ Edge TTS başarılı, audio buffer oluşturuldu');
        return audioBuffer;
        
    } catch (error) {
        console.error('❌ Edge TTS hatası:', error);
        return null;
    }
}

// API Limit Toggle
let isLimitPanelOpen = false;

function toggleLimitPanel() {
    const panel = document.getElementById('api-limit-panel');
    const arrow = document.getElementById('toggle-arrow');
    
    if (isLimitPanelOpen) {
        // Panel'i kapat
        panel.classList.remove('show');
        panel.classList.add('hidden');
        arrow.classList.remove('rotated');
        isLimitPanelOpen = false;
    } else {
        // Panel'i aç
        panel.classList.remove('hidden');
        panel.classList.add('show');
        arrow.classList.add('rotated');
        isLimitPanelOpen = true;
        
        // Panel'i otomatik kapat (5 saniye sonra)
        setTimeout(() => {
            if (isLimitPanelOpen) {
                toggleLimitPanel();
            }
        }, 5000);
    }
}

// API limit panel'i güncelle
function updateLimitPanel() {
    const responseUsed = document.getElementById('top-response-used');
    const responseLimit = document.getElementById('top-response-limit');
    const ttsUsed = document.getElementById('top-tts-used');
    const ttsLimit = document.getElementById('top-tts-limit');
    const currentModel = document.getElementById('top-current-model');
    const currentTTS = document.getElementById('top-current-tts');
    
    if (responseUsed && responseLimit) {
        responseUsed.textContent = apiUsage.responseRequests;
        responseLimit.textContent = getResponseLimit();
    }
    
    if (ttsUsed && ttsLimit) {
        ttsUsed.textContent = apiUsage.ttsRequests;
        ttsLimit.textContent = getTTSLimit();
    }
    
    if (currentModel) {
        currentModel.textContent = getModelDisplayName(currentResponseModel);
    }
    
    if (currentTTS) {
        currentTTS.textContent = getTTSServiceDisplayName(currentTTSService, currentTTSModel);
    }
}

// Model display name'i al
function getModelDisplayName(model) {
    const modelNames = {
        'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
        'gemini-2.0-flash': 'Gemini 2.0 Flash',
        'gemini-1.5-flash': 'Gemini 1.5 Flash',
        'gemini-1.5-pro': 'Gemini 1.5 Pro',
        'gemini-pro': 'Gemini Pro'
    };
    return modelNames[model] || model;
}

// TTS service display name'i al
function getTTSServiceDisplayName(service, model) {
    const serviceNames = {
        'edge-tts': 'Edge TTS',
        'gemini-tts': model === 'gemini-2.5-pro-preview-tts'
            ? 'Gemini 2.5 Pro TTS'
            : model === 'gemini-2.0-flash-preview-tts'
                ? 'Gemini 2.0 Flash TTS'
                : 'Gemini 2.5 Flash TTS'
    };
    return serviceNames[service] || service;
}

// Response limit'i al
function getResponseLimit() {
    const tier = apiUsage.tier;
    const model = currentResponseModel;
    
    if (API_LIMITS[tier] && API_LIMITS[tier][model]) {
        return API_LIMITS[tier][model].response;
    }
    
    // Fallback limits
    const fallbackLimits = {
        'gemini-2.5-flash-lite': 1500,
        'gemini-2.0-flash': 1000,
        'gemini-1.5-flash': 800,
        'gemini-1.5-pro': 600,
        'gemini-pro': 500
    };
    
    return fallbackLimits[model] || 1000;
}

// TTS limit'i al
function getTTSLimit() {
    const tier = apiUsage.tier;
    const model = currentTTSModel;
    
    if (API_LIMITS[tier] && API_LIMITS[tier][model]) {
        return API_LIMITS[tier][model].tts;
    }
    
    // Fallback limits
    const fallbackLimits = {
        'edge-tts': 999999, // Unlimited
        'gemini-2.5-flash-preview-tts': 15,
        'gemini-2.0-flash-preview-tts': 15
    };
    
    return fallbackLimits[model] || 300;
}
