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

// Audio System
let audioContext = null;
let analyser = null;
let audioDataArray = null;
let currentAudioSource = null;

// Mouth Animation
let mouthOpenValue = 0.0;
let targetMouthOpen = 0.0;
let mouthAnimationSpeed = 0.15;

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
    
    // ONLY animate mouth when speaking
    if (appState === 'speaking' && isSpeaking) {
        if (analyser && audioDataArray) {
            // Real audio analysis
            analyser.getByteFrequencyData(audioDataArray);
            
            let sum = 0;
            let count = 0;
            for (let i = 3; i < 8; i++) {
                if (audioDataArray[i] > 0) {
                    sum += audioDataArray[i];
                    count++;
                }
            }
            
            if (count > 0) {
                const average = sum / count;
                targetMouthOpen = Math.min(0.4, (average / 128.0) * 0.6);
            } else {
                targetMouthOpen = 0.0;
            }
        } else {
            // Fallback animation when no audio
            targetMouthOpen = 0.1 + (Math.sin(Date.now() * 0.01) * 0.3);
        }
    } else {
        // Mouth closed when not speaking
        targetMouthOpen = 0.0;
    }
    
    // Smooth mouth animation
    mouthOpenValue = THREE.MathUtils.lerp(mouthOpenValue, targetMouthOpen, mouthAnimationSpeed);
    
    // Apply to VRM
    vrm.expressionManager.setValue('aa', mouthOpenValue);
}

// ===== USER INTERACTION =====
async function handleUserInput() {
    const text = userInput.value.trim();
    if (!text || appState === 'thinking' || appState === 'speaking') return;
    
    userInput.value = '';
    setAppState('thinking');
    
    try {
        // Get AI response
        const response = await getAIResponse(text);
        
        // Set emotion
        setEmotion(response.duygu);
        
        // Speak response
        await speakText(response.cevap);
        
    } catch (error) {
        console.error('Interaction failed:', error);
        setAppState('error');
        setTimeout(() => setAppState('idle'), 2000);
    }
}

async function getAIResponse(prompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
    
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
        // Try TTS first
        const audioBuffer = await generateTTS(text);
        if (audioBuffer) {
            playAudio(audioBuffer);
            return;
        }
    } catch (error) {
        console.error('TTS failed, using fallback:', error);
    }
    
    // Fallback: simulate speech without audio
    simulateSpeech(text);
}

async function generateTTS(text) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;
    
    const payload = {
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Leda" }
                }
            }
        }
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`TTS API failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        throw new Error('Invalid TTS response');
    }

    const audioData = result.candidates[0].content.parts[0].inlineData.data;
    const pcmBuffer = base64ToArrayBuffer(audioData);
    const pcmData = new Int16Array(pcmBuffer);
    const wavBuffer = pcmToWav(pcmData, 24000);
    
    return await audioContext.decodeAudioData(wavBuffer);
}

function playAudio(audioBuffer) {
    if (!audioContext || !audioBuffer) return;
    
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // Create audio source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    currentAudioSource = source;
    
    // Create analyser for mouth animation
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    audioDataArray = new Uint8Array(analyser.frequencyBinCount);
    
    // Connect audio chain
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Start audio
    source.start(0);
    
    // Handle audio end
    source.onended = () => {
        stopSpeech();
    };
}

function simulateSpeech(text) {
    const wordCount = text.split(' ').length;
    const duration = (wordCount / 150) * 60 * 1000; // 150 words per minute
    
    let startTime = Date.now();
    const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
            clearInterval(interval);
            stopSpeech();
            return;
        }
        
        // Simulate mouth movement
        targetMouthOpen = 0.1 + (Math.sin(progress * Math.PI * 8) * 0.3);
    }, 50);
}

function stopSpeech() {
    isSpeaking = false;
    targetMouthOpen = 0.0;
    mouthOpenValue = 0.0;
    
    if (currentAudioSource) {
        currentAudioSource.stop();
        currentAudioSource.disconnect();
        currentAudioSource = null;
    }
    
    if (analyser) {
        analyser.disconnect();
        analyser = null;
        audioDataArray = null;
    }
    
    if (vrm?.expressionManager) {
        vrm.expressionManager.setValue('aa', 0);
    }
    
    setAppState('idle');
}

// ===== UTILITY FUNCTIONS =====
function setAppState(newState) {
    appState = newState;
    
    switch (newState) {
        case 'loading':
            updateStatus('Sahne hazırlanıyor...');
            enableUI(false);
            break;
        case 'idle':
            updateStatus('Sıradaki mesajını bekliyorum.');
            enableUI(true);
            isThinking = false;
            isSpeaking = false;
            break;
        case 'thinking':
            updateStatus('Düşünüyor...', true);
            enableUI(false);
            isThinking = true;
            isSpeaking = false;
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

// ===== START APPLICATION =====
init();
