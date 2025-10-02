// Application state management module
// Handles global state transitions and UI updates for the chatbot UI

const state = {
    appState: 'loading',
    systemReady: false,
    isThinking: false,
    isSpeaking: false,
};

let ui = {
    statusText: null,
    thinkingIndicator: null,
    userInput: null,
    sendButton: null,
};

let vrmController = null;

/**
 * Initializes references to UI elements that need to be updated when the state changes.
 * @param {Object} elements
 */
export function initAppState(elements = {}) {
    ui = {
        statusText: elements.statusText ?? null,
        thinkingIndicator: elements.thinkingIndicator ?? null,
        userInput: elements.userInput ?? null,
        sendButton: elements.sendButton ?? null,
    };

    vrmController = elements.vrmController ?? null;
}

export function bindVRMController(controller) {
    vrmController = controller;
}

export function getAppState() {
    return state.appState;
}

export function getSystemFlags() {
    return {
        appState: state.appState,
        systemReady: state.systemReady,
        isThinking: state.isThinking,
        isSpeaking: state.isSpeaking,
    };
}

export function isSystemReady() {
    return state.systemReady;
}

export function setSystemReady(value) {
    state.systemReady = value;
}

export function setThinking(value) {
    state.isThinking = value;
}

export function setSpeaking(value) {
    state.isSpeaking = value;
}

export function setAppState(newState) {
    const previous = state.appState;
    state.appState = newState;
    window.appState = newState;

    if (newState === 'idle' && !state.systemReady) {
        state.systemReady = true;
        console.log('🚀 System marked as ready');
    }

    updateStateFlags(newState);
    updateUI(newState);

    if (previous !== newState) {
        console.log(`State change: ${previous} -> ${newState}`);
    }
}

function updateStateFlags(newState) {
    switch (newState) {
        case 'loading':
            state.isThinking = false;
            state.isSpeaking = false;
            break;
        case 'idle':
            state.isThinking = false;
            state.isSpeaking = false;
            break;
        case 'thinking':
            state.isThinking = true;
            state.isSpeaking = false;
            break;
        case 'speaking':
            state.isThinking = false;
            state.isSpeaking = true;
            break;
        case 'error':
            state.isThinking = false;
            state.isSpeaking = false;
            break;
        default:
            break;
    }
}

function updateUI(newState) {
    switch (newState) {
        case 'loading':
            updateStatus('Sahne hazırlanıyor...');
            toggleThinkingIndicator(false);
            enableUI(false);
            forceMouthClosed();
            break;
        case 'idle':
            updateStatus('Sıradaki mesajını bekliyorum.');
            toggleThinkingIndicator(false);
            enableUI(true);
            forceMouthClosed();
            break;
        case 'thinking':
            updateStatus('Düşünüyor...');
            toggleThinkingIndicator(true);
            enableUI(false);
            forceMouthClosed();
            break;
        case 'speaking':
            updateStatus('Konuşuyor...');
            toggleThinkingIndicator(false);
            enableUI(false);
            break;
        case 'error':
            updateStatus('Bir hata oluştu.');
            toggleThinkingIndicator(false);
            enableUI(true);
            forceMouthClosed();
            break;
        default:
            break;
    }
}

export function updateStatus(text) {
    if (ui.statusText) {
        ui.statusText.textContent = text;
    }
}

function toggleThinkingIndicator(show) {
    if (!ui.thinkingIndicator) return;
    ui.thinkingIndicator.classList.toggle('hidden', !show);
}

function enableUI(enabled) {
    if (ui.userInput) ui.userInput.disabled = !enabled;
    if (ui.sendButton) ui.sendButton.disabled = !enabled;
}

function forceMouthClosed() {
    if (vrmController?.expressionManager) {
        vrmController.expressionManager.setValue('aa', 0);
    }
}
