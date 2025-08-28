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
    
    // Triple-check: if not speaking, force mouth closed
    if (!isSpeaking || appState !== 'speaking') {
        vrm.expressionManager.setValue('aa', 0);
        mouthOpenValue = 0.0;
    }
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
            // Immediately start playing audio without delay
            playAudio(audioBuffer);
            return;
        }
    } catch (error) {
        console.error('TTS failed, using fallback:', error);
        // If TTS fails, stop speaking state and return to idle
        stopSpeech();
        return;
    }
    
    // Fallback: simulate speech without audio
    simulateSpeech(text);
}

async function generateTTS(text) {
    console.log('Starting TTS generation...');
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
    
    console.log('TTS audio data processed, decoding...');
    const decodedAudio = await audioContext.decodeAudioData(wavBuffer);
    console.log('TTS audio ready to play');
    return decodedAudio;
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
    
    // Handle audio end with improved cleanup
    source.onended = () => {
        console.log('Audio ended naturally');
        // Immediate cleanup without delay
        if (isSpeaking) {
            console.log('Stopping speech after audio end');
            stopSpeech();
        }
    };
    
    // Start audio immediately
    source.start(0);
    console.log('Audio started playing immediately');
    
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
    const duration = (wordCount / 150) * 60 * 1000; // 150 words per minute
    
    console.log(`Simulating speech for ${duration}ms`);
    
    let startTime = Date.now();
    let interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
            clearInterval(interval);
            interval = null;
            console.log('Simulated speech completed');
            stopSpeech();
            return;
        }
        
        // Simulate mouth movement
        targetMouthOpen = 0.1 + (Math.sin(progress * Math.PI * 8) * 0.3);
    }, 50);
    
    // Add timeout protection
    setTimeout(() => {
        if (interval) {
            console.log('Simulated speech timeout, forcing stop');
            clearInterval(interval);
            interval = null;
            stopSpeech();
        }
    }, duration + 2000); // Add 2 second buffer
}

function stopSpeech() {
    console.log('Stopping speech...');
    
    // Reset all speech flags immediately
    isSpeaking = false;
    targetMouthOpen = 0.0;
    mouthOpenValue = 0.0;
    
    // Stop and cleanup audio source
    if (currentAudioSource) {
        try {
            currentAudioSource.onended = null; // Remove event listener
            currentAudioSource.stop();
            currentAudioSource.disconnect();
        } catch (error) {
            console.error('Error stopping audio source:', error);
        }
        currentAudioSource = null;
    }
    
    // Cleanup analyser
    if (analyser) {
        try {
            analyser.disconnect();
        } catch (error) {
            console.error('Error disconnecting analyser:', error);
        }
        analyser = null;
        audioDataArray = null;
    }
    
    // Force mouth closed immediately and ensure it stays closed
    if (vrm?.expressionManager) {
        vrm.expressionManager.setValue('aa', 0);
        console.log('Mouth forced closed');
    }
    
    // Update state
    setAppState('idle');
    
    // Double-check mouth is closed after state change
    setTimeout(() => {
        if (vrm?.expressionManager && !isSpeaking) {
            vrm.expressionManager.setValue('aa', 0);
            console.log('Double-checked: mouth is closed');
        }
    }, 50);
    
    console.log('Speech stopped, state reset to idle');
}

// ===== UTILITY FUNCTIONS =====
function setAppState(newState) {
    console.log(`State change: ${appState} -> ${newState}`);
    appState = newState;
    
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

// ===== START APPLICATION =====
init();
