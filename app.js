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
let currentTTSModel = 'gemini-2.5-flash-preview-tts'; // TTS için uygun model

// API Rate Limits (Google AI Studio) - Correct Limits
const API_LIMITS = {
    // Free Tier Limits (Corrected)
    free: {
        'gemini-2.5-flash': { rpm: 15, rpd: 250, name: 'Gemini 2.5 Flash' },
        'gemini-2.5-flash-lite': { rpm: 60, rpd: 1000, name: 'Gemini 2.5 Flash Lite' },
        'gemini-2.5-flash-preview-tts': { rpm: 30, rpd: 500, name: 'Gemini 2.5 Flash Preview TTS' },
        'gemini-2.5-pro-preview-tts': { rpm: 20, rpd: 300, name: 'Gemini 2.5 Pro Preview TTS' },
        'gemini-1.5-flash': { rpm: 15, rpd: 50, name: 'Gemini 1.5 Flash' },
        'gemini-1.5-pro': { rpm: 2, rpd: 100, name: 'Gemini 1.5 Pro' },
        'gemini-1.0-pro': { rpm: 60, rpd: 1500, name: 'Gemini 1.0 Pro' }
    },
    // Paid Tier 1 Limits
    tier1: {
        'gemini-2.5-flash': { rpm: 1000, rpd: 10000, name: 'Gemini 2.5 Flash' },
        'gemini-2.5-flash-lite': { rpm: 2000, rpd: 50000, name: 'Gemini 2.5 Flash Lite' },
        'gemini-2.5-flash-preview-tts': { rpm: 500, rpd: 10000, name: 'Gemini 2.5 Flash Preview TTS' },
        'gemini-2.5-pro-preview-tts': { rpm: 300, rpd: 6000, name: 'Gemini 2.5 Pro Preview TTS' },
        'gemini-1.5-flash': { rpm: 1000, rpd: 5000, name: 'Gemini 1.5 Flash' },
        'gemini-1.5-pro': { rpm: 360, rpd: 3000, name: 'Gemini 1.5 Pro' },
        'gemini-1.0-pro': { rpm: 1000, rpd: 30000, name: 'Gemini 1.0 Pro' }
    },
    // Enterprise Tier Limits
    enterprise: {
        'gemini-2.5-flash': { rpm: 10000, rpd: 1000000, name: 'Gemini 2.5 Flash' },
        'gemini-2.5-flash-lite': { rpm: 20000, rpd: 2000000, name: 'Gemini 2.5 Flash Lite' },
        'gemini-2.5-flash-preview-tts': { rpm: 5000, rpd: 100000, name: 'Gemini 2.5 Flash Preview TTS' },
        'gemini-2.5-pro-preview-tts': { rpm: 3000, rpd: 60000, name: 'Gemini 2.5 Pro Preview TTS' },
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

// Mouth Animation
let mouthOpenValue = 0.0;
let targetMouthOpen = 0.0;
let mouthAnimationSpeed = 0.15;

// Simple mouth control - no complex calibration needed

// Model URLs
const modelUrl = 'https://mustafaincby44.github.io/A-_AnimeGirl/public/AIAnimeGirl.vrm';
const fallbackModelUrl = 'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm';

// API Key
const API_KEY = "AIzaSyDVKrvvjIc5dQkiEwpPHYOOzF1TI7ennks";

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
    
    // Check if API keys are provided
    if (!apiUsage.responseApiKey) {
        updateStatus('⚠️ Response API key gerekli! Lütfen ayarlardan API key girin.');
        console.log('❌ No response API key provided');
        return;
    }
    
    if (!apiUsage.ttsApiKey) {
        updateStatus('⚠️ TTS API key gerekli! Lütfen ayarlardan TTS API key girin.');
        console.log('❌ No TTS API key provided');
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
    
    try {
        // Try Gemini TTS first
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
    } catch (error) {
        console.error('❌ Gemini TTS failed, using text simulation:', error);
        
        // Check if it's a rate limit error (429)
        if (error.message.includes('429')) {
            console.log('🚫 Gemini TTS rate limit exceeded - using text simulation');
            updateStatus('Gemini TTS limit aşıldı - metin simülasyonu kullanılıyor...');
        } else {
            console.log('⚠️ Gemini TTS error - using text simulation');
            updateStatus('Gemini TTS hatası - metin simülasyonu kullanılıyor...');
        }
        
        // Fallback: simulate speech
        console.log('🎭 Using simulated speech for:', text);
        simulateSpeech(text);
        return;
    }
}

async function generateTTS(text) {
    console.log('🎵 Starting Gemini TTS generation with:', currentTTSModel);
    
    // Track TTS API usage
    trackAPIUsage('tts');
    
    try {
        // Use the multimodal API for speech generation
        // Use correct endpoint for TTS models
        let apiUrl;
        if (currentTTSModel.includes('preview-tts')) {
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentTTSModel}:generateContent?key=${apiUsage.ttsApiKey}`;
        } else {
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentTTSModel}:generateContent?key=${apiUsage.ttsApiKey}`;
        }
        
        const payload = {
            contents: [{ 
                parts: [{ text: text }] 
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { 
                            voiceName: "tr-TR-Wavenet-A" // Turkish voice
                        }
                    }
                }
            }
        };

        console.log('🎵 Gemini TTS Request payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // Track TTS usage from response headers
        trackAPIUsage('tts', response);

        console.log('🎵 Gemini TTS Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ TTS API error:', response.status, errorText);
            throw new Error(`TTS API failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🎵 Gemini TTS Response result:', result);
        
        // Check if we have audio data
        if (result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
            const audioData = result.candidates[0].content.parts[0].inlineData.data;
            console.log('🎵 Gemini TTS audio data received, length:', audioData.length);
            
            // Convert base64 to audio buffer
            const binaryString = atob(audioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            console.log('🎵 Gemini TTS decoding audio buffer...');
            const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
            console.log('✅ Gemini TTS audio ready to play');
            return audioBuffer;
            
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
    
    // Reset all speech flags immediately
    isSpeaking = false;
    targetMouthOpen = 0.0;
    mouthOpenValue = 0.0;
    
    // Use the centralized reset function
    resetMouthState();
    
    // Update state
    setAppState('idle');
    
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
            
            // Only allow TTS-compatible models
            if (!['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts', 'gemini-1.5-flash', 'gemini-1.5-pro'].includes(currentTTSModel)) {
                console.log('⚠️ Warning: This model does not support TTS');
                currentTTSModel = 'gemini-2.5-flash-preview-tts'; // Force back to TTS model
                ttsModelSelect.value = 'gemini-2.5-flash-preview-tts';
            }
            
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
