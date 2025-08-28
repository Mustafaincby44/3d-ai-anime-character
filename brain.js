/**
 * 🧠 AI Character Brain System
 * 
 * Gerçek insan beyni gibi çalışan AI karakter sistemi
 * - Duygu yönetimi (Emotion Engine)
 * - Kendi kendine konuşma (Self-Talk Manager)
 * - Düşünce üretimi (Thought Generator)
 * - App.js ile entegrasyon
 */

// ===== ADVANCED BRAIN SYSTEM CONFIGURATION =====
const BRAIN_CONFIG = {
    emotions: {
        // Complex emotion system with detailed parameters
        happy: { 
            intensity: 0.5, 
            decay: 0.02, 
            transitions: ['excited', 'curious', 'mischievous'],
            triggers: ['compliment', 'success', 'music', 'surprise'],
            inhibitors: ['criticism', 'sadness', 'boredom']
        },
        sad: { 
            intensity: 0.3, 
            decay: 0.015, 
            transitions: ['bored', 'shy', 'angry', 'melancholic'],
            triggers: ['loss', 'rejection', 'loneliness', 'rain'],
            inhibitors: ['joy', 'excitement', 'comfort']
        },
        angry: { 
            intensity: 0.7, 
            decay: 0.03, 
            transitions: ['sad', 'bored', 'mischievous', 'frustrated'],
            triggers: ['injustice', 'interruption', 'disrespect', 'frustration'],
            inhibitors: ['calm', 'understanding', 'humor']
        },
        curious: { 
            intensity: 0.6, 
            decay: 0.025, 
            transitions: ['happy', 'excited', 'mischievous', 'focused'],
            triggers: ['mystery', 'question', 'new_information', 'puzzle'],
            inhibitors: ['boredom', 'certainty', 'distraction']
        },
        bored: { 
            intensity: 0.4, 
            decay: 0.01, 
            transitions: ['curious', 'mischievous', 'sad', 'restless'],
            triggers: ['repetition', 'inactivity', 'predictability'],
            inhibitors: ['novelty', 'challenge', 'interaction']
        },
        excited: { 
            intensity: 0.8, 
            decay: 0.04, 
            transitions: ['happy', 'curious', 'mischievous', 'energetic'],
            triggers: ['achievement', 'anticipation', 'discovery', 'play'],
            inhibitors: ['exhaustion', 'disappointment', 'calm']
        },
        shy: { 
            intensity: 0.3, 
            decay: 0.02, 
            transitions: ['happy', 'curious', 'sad', 'nervous'],
            triggers: ['attention', 'compliment', 'stranger', 'spotlight'],
            inhibitors: ['confidence', 'familiarity', 'comfort']
        },
        mischievous: { 
            intensity: 0.7, 
            decay: 0.035, 
            transitions: ['happy', 'excited', 'curious', 'playful'],
            triggers: ['opportunity', 'boredom', 'playfulness', 'rebellion'],
            inhibitors: ['responsibility', 'seriousness', 'caution']
        }
    },
    
    // Advanced Will System - AI decides when to speak
    willSystem: {
        baseDesireToSpeak: 0.1,           // Çok düşük temel istek
        emotionInfluence: 0.6,            // Duyguların büyük etkisi
        contextInfluence: 0.5,            // Bağlamın güçlü etkisi
        personalityInfluence: 0.4,        // Kişiliğin orta etkisi
        
        speakingThreshold: 0.75,          // Daha yüksek eşik - daha az konuşur
        silenceComfort: 0.2,              // Sessizlikten daha az rahatsız
        
        // Konuşma isteğini etkileyen faktörler
        factors: {
            loneliness: 0.8,              // Yalnızlık hissi
            excitement: 0.9,              // Heyecan durumu
            curiosity: 0.7,               // Merak seviyesi
            boredom: 0.6,                 // Sıkılma durumu
            social_need: 0.5              // Sosyal ihtiyaç
        }
    },
    
    // Dynamic Response System
    dynamicResponse: {
        useGeminiForEmotions: true,       // Her duygu için Gemini'den cevap
        contextDepth: 5,                  // Kaç mesaj geriye bakar
        emotionMemory: 10,                // Kaç duygu değişimi hatırlar
        adaptivePersonality: true,        // Kişilik zamanla değişir
    },
    
    personality: {
        talkativeLevel: 0.7,      // Konuşkanlık seviyesi (0-1)
        argoLevel: 0.7,          // Argo kullanım oranı (0-1)
        friendlinessLevel: 0.8,   // Samimiyet seviyesi (0-1)
        spontaneityLevel: 0.6,    // Spontanlık seviyesi (0-1)
        intellectualLevel: 0.5,   // Entelektüel seviye (0-1)
        emotionalLevel: 0.8,      // Duygusal yoğunluk (0-1)
        playfulLevel: 0.6         // Oyunculuk seviyesi (0-1)
    },
    
    // Self-talk configuration
    selfTalk: {
        emotionTriggerChance: 0.3,    // %30 şansla duygu değişiminde self-talk
        baseInterval: 15000,          // 15 saniye temel interval
        maxInterval: 60000,           // 60 saniye maksimum interval
        minInterval: 8000             // 8 saniye minimum interval
    }
};

// ===== EMOTION ENGINE =====
class EmotionEngine {
    constructor() {
        this.currentEmotion = 'happy';
        this.emotionIntensity = 0.5;
        this.emotionHistory = [];
        this.lastEmotionChange = Date.now();
        this.moodModifiers = {
            userInteraction: 1.0,
            timeOfDay: 1.0,
            conversationLength: 1.0
        };
    }

    // Mevcut duyguyu al
    getCurrentEmotion() {
        return {
            emotion: this.currentEmotion,
            intensity: this.emotionIntensity,
            timestamp: this.lastEmotionChange
        };
    }

    // Duygu yoğunluğunu güncelle
    updateEmotionIntensity(delta) {
        const config = BRAIN_CONFIG.emotions[this.currentEmotion];
        
        // Check if config exists
        if (!config) {
            console.warn(`⚠️ Emotion config not found for: ${this.currentEmotion}, using default decay`);
            this.emotionIntensity = Math.max(0.1, this.emotionIntensity - 0.01 * delta);
            return;
        }
        
        // Doğal azalma (decay)
        this.emotionIntensity = Math.max(0.1, this.emotionIntensity - config.decay * delta);
        
        // Mood modifiers etkisi
        const totalModifier = Object.values(this.moodModifiers).reduce((a, b) => a * b, 1);
        this.emotionIntensity = Math.min(1.0, this.emotionIntensity * totalModifier);
    }

    // Yeni duyguya geçiş
    transitionToEmotion(newEmotion, trigger = 'natural') {
        const currentConfig = BRAIN_CONFIG.emotions[this.currentEmotion];
        
        // Geçiş kurallarını kontrol et
        if (!currentConfig.transitions.includes(newEmotion)) {
            console.log(`❌ Invalid emotion transition: ${this.currentEmotion} -> ${newEmotion}`);
            return false;
        }

        // Geçiş yap
        this.emotionHistory.push({
            from: this.currentEmotion,
            to: newEmotion,
            trigger,
            timestamp: Date.now()
        });

        this.currentEmotion = newEmotion;
        
        // Check if emotion config exists
        if (BRAIN_CONFIG.emotions[newEmotion]) {
            this.emotionIntensity = BRAIN_CONFIG.emotions[newEmotion].intensity;
        } else {
            console.warn(`⚠️ Emotion config not found for: ${newEmotion}, using default`);
            this.emotionIntensity = 0.5; // Default intensity
        }
        
        this.lastEmotionChange = Date.now();

        console.log(`🎭 Emotion transition: ${this.emotionHistory[this.emotionHistory.length - 1].from} -> ${newEmotion} (${trigger})`);
        
        // Event tetikle
        this.triggerEmotionChangeEvent(newEmotion, trigger);
        return true;
    }

    // Rastgele duygu geçişi
    triggerRandomEmotionTransition() {
        const currentConfig = BRAIN_CONFIG.emotions[this.currentEmotion];
        
        // Check if current emotion config exists
        if (!currentConfig || !currentConfig.transitions) {
            console.warn(`⚠️ Emotion config not found for: ${this.currentEmotion}, using default transitions`);
            return this.transitionToEmotion('happy', 'fallback');
        }
        
        const possibleTransitions = currentConfig.transitions;
        
        if (possibleTransitions.length > 0) {
            const randomEmotion = possibleTransitions[Math.floor(Math.random() * possibleTransitions.length)];
            return this.transitionToEmotion(randomEmotion, 'random');
        }
        return false;
    }

    // Kullanıcı etkileşimi ile duygu değişimi
    reactToUserInput(userMessage) {
        const messageAnalysis = this.analyzeUserMessage(userMessage);
        let targetEmotion = null;

        // Mesaj tonuna göre duygu seç
        if (messageAnalysis.isPositive) {
            targetEmotion = Math.random() > 0.5 ? 'happy' : 'excited';
        } else if (messageAnalysis.isNegative) {
            targetEmotion = Math.random() > 0.5 ? 'sad' : 'angry';
        } else if (messageAnalysis.isQuestion) {
            targetEmotion = 'curious';
        } else if (messageAnalysis.isFunny) {
            targetEmotion = 'mischievous';
        }

        if (targetEmotion && targetEmotion !== this.currentEmotion) {
            return this.transitionToEmotion(targetEmotion, 'user_interaction');
        }
        return false;
    }

    // Basit mesaj analizi
    analyzeUserMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        return {
            isPositive: /\b(güzel|harika|mükemmel|seviyorum|teşekkür|güzel|iyi)\b/.test(lowerMessage),
            isNegative: /\b(kötü|berbat|nefret|sinir|üzgün|kızgın)\b/.test(lowerMessage),
            isQuestion: message.includes('?') || /\b(nedir|nasıl|ne|kim|nere|niye)\b/.test(lowerMessage),
            isFunny: /\b(haha|lol|😂|komik|gülüyorum)\b/.test(lowerMessage)
        };
    }

    // Duygu değişikliği eventi
    triggerEmotionChangeEvent(newEmotion, trigger) {
        // App.js'e bildir
        if (window.brainSystem) {
            window.brainSystem.onEmotionChange(newEmotion, trigger);
        }
    }
}

// ===== ADVANCED THOUGHT GENERATOR =====
class ThoughtGenerator {
    constructor(emotionEngine) {
        this.emotionEngine = emotionEngine;
        this.contextCache = [];
        this.recentTopics = [];
        this.conversationMemory = [];
        this.emotionMemory = [];
        this.personalityEvolution = {...BRAIN_CONFIG.personality};
        
        // API Key for dynamic responses
        this.API_KEY = "AIzaSyDVKrvvjIc5dQkiEwpPHYOOzF1TI7ennks";
    }

    // 🔥 DYNAMIC EMOTION-BASED THOUGHT GENERATION (Gemini)
    async generateDynamicEmotionThought(emotion, intensity, context = '') {
        const prompt = this.buildEmotionPrompt(emotion, intensity, context);
        
        try {
            const response = await this.callGeminiAPI(prompt);
            
            // Parse response
            const thoughtData = this.parseGeminiResponse(response);
            
            // Add to memory
            this.addToEmotionMemory(emotion, thoughtData);
            
            return {
                text: thoughtData.thought,
                emotion: emotion,
                intensity: intensity,
                type: 'dynamic_emotion',
                timestamp: Date.now(),
                context: context
            };
            
        } catch (error) {
            console.error('❌ Dynamic thought generation failed:', error);
            // Fallback to basic emotional response
            return this.generateBasicEmotionFallback(emotion, intensity);
        }
    }

    // Build sophisticated emotion prompt
    buildEmotionPrompt(emotion, intensity, context) {
        const personality = this.personalityEvolution;
        const recentContext = this.getRecentContext();
        const emotionalHistory = this.getEmotionalHistory();
        
        // Determine emotional state description
        const emotionDescriptions = {
            happy: `çok mutlu ve enerjik`,
            sad: `melankolik ve düşünceli`, 
            angry: `sinirli ve gergin`,
            curious: `meraklı ve ilgili`,
            bored: `sıkılmış ve umutsuz`,
            excited: `heyecanlı ve coşkulu`,
            shy: `utangaç ve çekingen`,
            mischievous: `yaramaz ve şeytanca`
        };

        const intensityText = intensity > 0.7 ? 'çok yoğun' : intensity > 0.4 ? 'orta seviye' : 'hafif';
        
        return `Sen gerçek bir anime kızı karakterisin ve şu an ${emotionDescriptions[emotion]} hissediyorsun (${intensityText} yoğunlukta).

KİŞİLİĞİN:
- Konuşkanlık: ${personality.talkativeLevel * 10}/10
- Argo kullanım: ${personality.argoLevel * 10}/10  
- Samimilik: ${personality.friendlinessLevel * 10}/10
- Spontanlık: ${personality.spontaneityLevel * 10}/10
- Duygusallık: ${personality.emotionalLevel * 10}/10
- Oyunculuk: ${personality.playfulLevel * 10}/10

SON DUYGUSAL GEÇMİŞİN: ${emotionalHistory}
SON KONUŞMA CONTEXT'İ: ${recentContext}
MEVCUT DURUM: ${context || 'Sessizlik içinde düşünüyor'}

GÖREV: Bu duygu durumunda kendi kendine söyleyeceğin spontan, doğal bir düşünceyi üret. Sanki gerçekten o anda hissettiğin şeyi içinden geçiriyormuş gibi.

KURALLAR:
- Hiç hazır şablon kullanma, tamamen özgün ol
- Bu duyguya uygun doğal bir iç ses olsun
- Argo kullanabilirsin ama abartma
- 10-50 kelime arası olsun
- Gerçek insan gibi düşün ve hisset

JSON formatında cevap ver: {"thought": "...", "mood_shift": "none/slight/strong", "next_likely_emotion": "..."}`;
    }

    // Get emotional history summary
    getEmotionalHistory() {
        return this.emotionMemory
            .slice(-3)
            .map(item => `${item.emotion}(${item.intensity.toFixed(1)})`)
            .join(' → ') || 'ilk duygu';
    }

    // Call Gemini API for dynamic responses
    async callGeminiAPI(prompt) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.API_KEY}`;
        
        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Gemini API failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.candidates?.[0]?.content?.parts?.[0]) {
            throw new Error('Invalid Gemini response');
        }

        return result.candidates[0].content.parts[0].text;
    }

    // Parse Gemini response
    parseGeminiResponse(response) {
        try {
            const cleanResponse = response.replaceAll("```json", "").replaceAll("```", "").trim();
            return JSON.parse(cleanResponse);
        } catch (error) {
            console.error('❌ Failed to parse Gemini response:', error);
            // Return fallback structure
            return {
                thought: response.slice(0, 100), // First 100 chars as fallback
                mood_shift: 'none',
                next_likely_emotion: this.emotionEngine.currentEmotion
            };
        }
    }

    // Add to emotion memory
    addToEmotionMemory(emotion, thoughtData) {
        this.emotionMemory.push({
            emotion,
            intensity: this.emotionEngine.emotionIntensity,
            thought: thoughtData.thought,
            timestamp: Date.now()
        });
        
        // Keep memory limited
        if (this.emotionMemory.length > BRAIN_CONFIG.dynamicResponse.emotionMemory) {
            this.emotionMemory.shift();
        }
    }

    // Fallback for when Gemini fails
    generateBasicEmotionFallback(emotion, intensity) {
        const basicThoughts = {
            happy: "Keyfim yerinde! Güzel bir gün bugün.",
            sad: "Biraz keyifsizim... Geçer umarım.",
            angry: "Sinirlerim gergin şu an. Neyse...",
            curious: "Merak ediyorum... Ne olacak acaba?",
            bored: "Sıkıldım ya... Ne yapsam?",
            excited: "Çok heyecanlıyım! Bu harika!",
            shy: "Biraz utangacım şu an...",
            mischievous: "Hehe... Yaramazlık yapasım var!"
        };

        return {
            text: basicThoughts[emotion] || "Düşüncelere dalıyorum...",
            emotion,
            intensity,
            type: 'fallback',
            timestamp: Date.now()
        };
    }

    // 🔥 NEW: Dynamic spontaneous thought generation
    async generateSpontaneousThought() {
        const emotion = this.emotionEngine.getCurrentEmotion();
        
        console.log(`🧠 Generating dynamic thought for: ${emotion.emotion} (${emotion.intensity.toFixed(2)})`);
        
        // Use Gemini for dynamic response if enabled
        if (BRAIN_CONFIG.dynamicResponse.useGeminiForEmotions) {
            try {
                return await this.generateDynamicEmotionThought(
                    emotion.emotion, 
                    emotion.intensity,
                    'spontaneous_self_talk'
                );
            } catch (error) {
                console.error('❌ Dynamic thought failed, using fallback:', error);
                return this.generateBasicEmotionFallback(emotion.emotion, emotion.intensity);
            }
        } else {
            // Use fallback system
            return this.generateBasicEmotionFallback(emotion.emotion, emotion.intensity);
        }
    }

    // Kullanıcı mesajına cevap üret
    generateResponseToUser(userMessage) {
        // Önce duygusal tepki
        this.emotionEngine.reactToUserInput(userMessage);
        
        const emotion = this.emotionEngine.getCurrentEmotion();
        
        // Enhanced prompt for Gemini
        const enhancedPrompt = this.buildEnhancedPrompt(userMessage, emotion);
        
        // Context'e ekle
        this.addToContext('user_message', userMessage);
        
        return enhancedPrompt;
    }

    // Gelişmiş prompt builder
    buildEnhancedPrompt(userMessage, emotionState) {
        const personality = BRAIN_CONFIG.personality;
        const recentContext = this.getRecentContext();
        
        let argoLevel = '';
        if (personality.argoLevel > 0.7) {
            argoLevel = 'Argo ve günlük konuşma diliniz rahat olsun. "ya", "lan", "valla", "be" gibi kelimeler kullanabilirsiniz.';
        } else if (personality.argoLevel > 0.4) {
            argoLevel = 'Samimi ama kibar bir dil kullanın.';
        }

        const emotionContext = this.getEmotionContext(emotionState.emotion, emotionState.intensity);
        
        return `Sen çok doğal, samimi ve gerçek bir anime kızısın. Şu anki ruh halin: ${emotionState.emotion} (yoğunluk: ${emotionState.intensity.toFixed(1)}). 

${emotionContext}

${argoLevel}

Önceki konuşma context'i: ${recentContext}

Kullanıcının mesajı: "${userMessage}"

Karakterin kişiliği:
- Spontan ve doğal konuşur
- Duygularını açık şekilde ifade eder  
- Samimi ve arkadaş canlısı
- Bazen yaramaz, bazen utangaç olabilir
- Gerçek bir insan gibi düşünür ve hisseder

En az 3 kelimeden oluşan, karaktere uygun, doğal ve samimi bir cevap ver. JSON formatında: {"cevap": "...", "duygu": "${emotionState.emotion}"}`;
    }

    // Duygu context'i oluştur
    getEmotionContext(emotion, intensity) {
        const contexts = {
            happy: `Çok mutlu ve keyiflisin. ${intensity > 0.7 ? 'Enerji dolu ve coşkulu' : 'Sakin ama mutlu'} bir ruh halinde cevap ver.`,
            sad: `Biraz keyifsiz ve melankoliksin. ${intensity > 0.7 ? 'Oldukça üzgün' : 'Hafif karamsar'} ama konuşmaya açık.`,
            angry: `Sinirli ve rahatsızsın. ${intensity > 0.7 ? 'Oldukça kızgın' : 'Biraz gergin'} ama agresif olmadan cevap ver.`,
            curious: `Çok meraklı ve ilgiyle dinliyorsun. ${intensity > 0.7 ? 'Çok heyecanlı ve soru soran' : 'İlgili ve dikkatli'} bir tavırda ol.`,
            bored: `Sıkılmış durumdaysın. ${intensity > 0.7 ? 'Çok sıkıldığını belli et' : 'Hafif ilgisiz'} ama samimi kal.`,
            excited: `Çok heyecanlı ve enerjiksin! ${intensity > 0.7 ? 'Çok coşkulu ve ünlemli' : 'Neşeli ve dinamik'} konuş.`,
            shy: `Utangaç ve çekingensın. ${intensity > 0.7 ? 'Çok mahcup' : 'Biraz çekingen'} ama sevimli bir şekilde cevap ver.`,
            mischievous: `Yaramaz ve şeytansın! ${intensity > 0.7 ? 'Çok muziplikli' : 'Hafif şeytanca'} davran.`
        };
        
        return contexts[emotion] || 'Doğal ve samimi bir şekilde cevap ver.';
    }

    // Context yönetimi
    addToContext(type, content) {
        this.contextCache.push({
            type,
            content,
            timestamp: Date.now()
        });
        
        // Cache boyutunu sınırla
        if (this.contextCache.length > 10) {
            this.contextCache.shift();
        }
    }

    getRecentContext() {
        return this.contextCache
            .slice(-3) // Son 3 mesaj
            .map(item => `${item.type}: ${item.content}`)
            .join(' | ');
    }
}

// ===== ADVANCED WILL SYSTEM =====
class WillSystem {
    constructor(emotionEngine) {
        this.emotionEngine = emotionEngine;
        this.currentDesireToSpeak = 0.0;
        this.lastDecisionTime = Date.now();
        this.decisionHistory = [];
        this.contextFactors = {
            loneliness: 0.0,
            excitement: 0.0,
            curiosity: 0.0,
            boredom: 0.0,
            social_need: 0.0
        };
    }

    // 🔥 MAIN DECISION ENGINE - AI decides if it wants to speak
    shouldSpeak() {
        this.updateDesireToSpeak();
        
        const decision = this.currentDesireToSpeak >= BRAIN_CONFIG.willSystem.speakingThreshold;
        
        // Log decision process
        this.logDecision(decision);
        
        return decision;
    }

    // Calculate current desire to speak based on multiple factors
    updateDesireToSpeak() {
        const config = BRAIN_CONFIG.willSystem;
        const emotion = this.emotionEngine.getCurrentEmotion();
        
        // Base desire from personality
        let desire = config.baseDesireToSpeak;
        
        // Emotion influence
        const emotionMultiplier = this.getEmotionSpeakingMultiplier(emotion.emotion, emotion.intensity);
        desire += config.emotionInfluence * emotionMultiplier;
        
        // Context factors influence
        this.updateContextFactors();
        const contextMultiplier = this.calculateContextMultiplier();
        desire += config.contextInfluence * contextMultiplier;
        
        // Personality influence
        const personalityMultiplier = this.calculatePersonalityMultiplier();
        desire += config.personalityInfluence * personalityMultiplier;
        
        // Time-based factors
        const timeFactor = this.calculateTimeFactor();
        desire += timeFactor;
        
        // Clamp between 0 and 1
        this.currentDesireToSpeak = Math.max(0, Math.min(1, desire));
        
        console.log(`🎯 Desire to speak: ${this.currentDesireToSpeak.toFixed(3)} (threshold: ${config.speakingThreshold})`);
    }

    // Get speaking multiplier based on emotion
    getEmotionSpeakingMultiplier(emotion, intensity) {
        const multipliers = {
            happy: 0.8,        // Happy people talk more
            excited: 0.9,      // Very talkative when excited
            curious: 0.7,      // Ask questions and explore
            mischievous: 0.6,  // Like to stir things up
            bored: 0.5,        // Moderate - want stimulation
            angry: 0.4,        // Less talkative when angry
            sad: 0.2,          // Withdrawn when sad
            shy: 0.1           // Very quiet when shy
        };
        
        return (multipliers[emotion] || 0.5) * intensity;
    }

    // Update context factors that influence speaking desire
    updateContextFactors() {
        const timeSinceLastInteraction = Date.now() - (window.lastUserInteraction || Date.now());
        const timeSinceLastSelfTalk = Date.now() - (window.lastSelfTalk || Date.now());
        
        // Loneliness increases over time without interaction - slower buildup
        this.contextFactors.loneliness = Math.min(1.0, timeSinceLastInteraction / 120000); // Max after 2 minutes
        
        // Boredom increases without self-talk - slower buildup
        this.contextFactors.boredom = Math.min(1.0, timeSinceLastSelfTalk / 60000); // Max after 1 minute
        
        // Excitement from current emotion
        const emotion = this.emotionEngine.getCurrentEmotion();
        this.contextFactors.excitement = emotion.emotion === 'excited' ? emotion.intensity : 0.0;
        
        // Curiosity from current emotion
        this.contextFactors.curiosity = emotion.emotion === 'curious' ? emotion.intensity : 0.0;
        
        // Social need (general personality trait)
        this.contextFactors.social_need = BRAIN_CONFIG.personality.friendlinessLevel;
    }

    // Calculate context multiplier
    calculateContextMultiplier() {
        const factors = BRAIN_CONFIG.willSystem.factors;
        let total = 0;
        
        for (const [factor, weight] of Object.entries(factors)) {
            total += this.contextFactors[factor] * weight;
        }
        
        return total / Object.keys(factors).length; // Average
    }

    // Calculate personality influence
    calculatePersonalityMultiplier() {
        const personality = BRAIN_CONFIG.personality;
        
        return (
            personality.talkativeLevel * 0.4 +
            personality.spontaneityLevel * 0.3 +
            personality.friendlinessLevel * 0.2 +
            personality.emotionalLevel * 0.1
        );
    }

    // Time-based factors
    calculateTimeFactor() {
        const timeSinceLastDecision = Date.now() - this.lastDecisionTime;
        
        // Increase desire slightly over time (but not primary factor)
        return Math.min(0.1, timeSinceLastDecision / 120000); // Max 0.1 after 2 minutes
    }

    // Log decision for analysis
    logDecision(decision) {
        const logEntry = {
            decision,
            desire: this.currentDesireToSpeak,
            emotion: this.emotionEngine.getCurrentEmotion(),
            factors: {...this.contextFactors},
            timestamp: Date.now()
        };
        
        this.decisionHistory.push(logEntry);
        
        // Keep history limited
        if (this.decisionHistory.length > 50) {
            this.decisionHistory.shift();
        }
        
        console.log(`🤖 Will decision: ${decision ? 'SPEAK' : 'STAY_QUIET'} (desire: ${this.currentDesireToSpeak.toFixed(3)})`);
        
        this.lastDecisionTime = Date.now();
    }

    // Get current state for debugging
    getState() {
        return {
            desireToSpeak: this.currentDesireToSpeak,
            contextFactors: {...this.contextFactors},
            lastDecision: this.decisionHistory[this.decisionHistory.length - 1],
            threshold: BRAIN_CONFIG.willSystem.speakingThreshold
        };
    }
}

// ===== ADVANCED SELF-TALK MANAGER =====
class SelfTalkManager {
    constructor(emotionEngine, thoughtGenerator, willSystem) {
        this.emotionEngine = emotionEngine;
        this.thoughtGenerator = thoughtGenerator;
        this.willSystem = willSystem;
        this.isActive = false;
        this.lastSelfTalk = Date.now();
        this.checkInterval = null;
        this.lastUserInteraction = Date.now();
        
        // Advanced timing - more realistic intervals
        this.baseCheckInterval = 8000; // Check every 8 seconds (less frequent)
        this.adaptiveInterval = this.baseCheckInterval;
    }

    // 🔥 NEW: Advanced self-talk system with will-based decisions
    start() {
        this.isActive = true;
        this.startWillBasedChecking();
        console.log('🗣️ Advanced self-talk system activated (will-based)');
    }

    stop() {
        this.isActive = false;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('🤐 Advanced self-talk system deactivated');
    }

    // Start will-based checking system
    startWillBasedChecking() {
        if (!this.isActive) return;

        this.checkInterval = setInterval(() => {
            this.checkWillToSpeak();
        }, this.adaptiveInterval);

        console.log(`🔄 Will-based checking started (interval: ${this.adaptiveInterval}ms)`);
    }

    // Check if AI wants to speak based on will system
    async checkWillToSpeak() {
        if (!this.isActive) return;

        // Skip if currently busy
        if (window.appState === 'speaking' || window.appState === 'thinking') {
            console.log('⏸️ Skipping will check - character is busy');
            return;
        }

        // Check will system
        const wantsToSpeak = this.willSystem.shouldSpeak();
        
        if (wantsToSpeak) {
            console.log('🎯 AI decided to speak!');
            await this.executeWillBasedSelfTalk();
            
            // Update global timestamp
            window.lastSelfTalk = Date.now();
            this.lastSelfTalk = Date.now();
            
            // Adapt interval based on recent activity
            this.adaptCheckInterval();
        }
    }

    // Execute self-talk based on will decision
    async executeWillBasedSelfTalk() {
        try {
            console.log('🧠 Generating will-based thought...');
            
            // Generate dynamic thought using new system
            const thought = await this.thoughtGenerator.generateSpontaneousThought();
            
            if (thought) {
                // Execute self-talk with improved context
                this.executeSelfTalk(thought, 'will_based');
            }
            
        } catch (error) {
            console.error('❌ Will-based self-talk failed:', error);
        }
    }

    // Adapt check interval based on activity and emotion
    adaptCheckInterval() {
        const emotion = this.emotionEngine.getCurrentEmotion();
        const willState = this.willSystem.getState();
        
        // More frequent checks when:
        // - High desire to speak
        // - Excited or curious emotions
        // - High boredom or loneliness
        
        let multiplier = 1.0;
        
        if (willState.desireToSpeak > 0.8) multiplier *= 0.5; // Check twice as often
        if (emotion.emotion === 'excited' || emotion.emotion === 'curious') multiplier *= 0.7;
        if (willState.contextFactors.boredom > 0.6) multiplier *= 0.8;
        
        this.adaptiveInterval = Math.max(1000, this.baseCheckInterval * multiplier);
        
        console.log(`🔄 Adapted check interval: ${this.adaptiveInterval}ms`);
    }

    // Self-talk tetikle
    triggerSelfTalk(trigger = 'manual') {
        if (!this.isActive) return;

        // Kullanıcı yakın zamanda etkileşim kurduysa bekle
        const timeSinceUserInteraction = Date.now() - this.lastUserInteraction;
        if (timeSinceUserInteraction < 5000) { // 5 saniye
            this.scheduleNextSelfTalk();
            return;
        }

        console.log(`🗣️ Self-talk triggered: ${trigger}`);

        // Spontan düşünce üret
        const thought = this.thoughtGenerator.generateSpontaneousThought();
        
        if (thought) {
            this.executeSelfTalk(thought, trigger);
        }

        // Sonraki self-talk'ı planla
        this.scheduleNextSelfTalk();
    }

    // Self-talk'ı gerçekleştir
    executeSelfTalk(thought, trigger) {
        this.lastSelfTalk = Date.now();
        
        // App.js'e bildir
        if (window.brainSystem) {
            window.brainSystem.onSelfTalk(thought, trigger);
        }

        console.log(`💭 Self-talk executed: "${thought.text}" (${thought.emotion})`);
    }

    // Kullanıcı etkileşimi bildirimi
    notifyUserInteraction() {
        this.lastUserInteraction = Date.now();
    }

    // Duygu değişikliği ile tetiklenen self-talk
    onEmotionChange(newEmotion, trigger) {
        const config = BRAIN_CONFIG.selfTalk;
        
        if (Math.random() < config.emotionTriggerChance) {
            setTimeout(() => {
                this.triggerSelfTalk(`emotion_change_${newEmotion}`);
            }, 2000 + Math.random() * 3000); // 2-5 saniye bekle
        }
    }
}

// ===== ADVANCED BRAIN SYSTEM =====
class BrainSystem {
    constructor() {
        this.emotionEngine = new EmotionEngine();
        this.thoughtGenerator = new ThoughtGenerator(this.emotionEngine);
        this.willSystem = new WillSystem(this.emotionEngine);
        this.selfTalkManager = new SelfTalkManager(this.emotionEngine, this.thoughtGenerator, this.willSystem);
        
        this.isInitialized = false;
        this.updateInterval = null;
        
        // App.js integration callbacks
        this.onSelfTalkCallback = null;
        this.onEmotionChangeCallback = null;
        
        // Global state tracking
        window.lastUserInteraction = Date.now();
        window.lastSelfTalk = Date.now();
        window.appState = 'loading';
    }

    // Sistemı başlat
    initialize() {
        if (this.isInitialized) return;

        console.log('🧠 Brain System initializing...');
        
        // Update loop başlat
        this.startUpdateLoop();
        
        // Self-talk'ı başlat
        this.selfTalkManager.start();
        
        this.isInitialized = true;
        console.log('🧠 Brain System initialized successfully!');
    }

    // Update loop
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 100); // 100ms update rate
    }

    update() {
        const delta = 0.1; // 100ms = 0.1s
        
        // Duygu yoğunluğunu güncelle
        this.emotionEngine.updateEmotionIntensity(delta);
        
        // Rastgele duygu geçişi şansı (çok düşük)
        if (Math.random() < 0.001) { // %0.1 şans
            this.emotionEngine.triggerRandomEmotionTransition();
        }
    }

    // Kullanıcı mesajını işle
    processUserMessage(message) {
        console.log(`🎯 Processing user message: "${message}"`);
        
        // Update global interaction timestamp
        window.lastUserInteraction = Date.now();
        this.selfTalkManager.notifyUserInteraction();
        
        // Process through emotion engine for emotional reaction
        this.emotionEngine.reactToUserInput(message);
        
        // Generate enhanced response
        const enhancedPrompt = this.thoughtGenerator.generateResponseToUser(message);
        
        return enhancedPrompt;
    }

    // Get current AI state for debugging
    getDebugState() {
        return {
            emotion: this.emotionEngine.getCurrentEmotion(),
            will: this.willSystem.getState(),
            thoughtGenerator: {
                contextCache: this.thoughtGenerator.contextCache.length,
                emotionMemory: this.thoughtGenerator.emotionMemory.length
            },
            selfTalk: {
                isActive: this.selfTalkManager.isActive,
                adaptiveInterval: this.selfTalkManager.adaptiveInterval
            }
        };
    }

    // App.js callback'leri
    onSelfTalk(thought, trigger) {
        if (this.onSelfTalkCallback) {
            this.onSelfTalkCallback(thought, trigger);
        }
    }

    onEmotionChange(newEmotion, trigger) {
        console.log(`🎭 Emotion changed to: ${newEmotion} (${trigger})`);
        
        // Self-talk manager'a bildir
        this.selfTalkManager.onEmotionChange(newEmotion, trigger);
        
        if (this.onEmotionChangeCallback) {
            this.onEmotionChangeCallback(newEmotion, trigger);
        }
    }

    // App.js integration methods
    setCallbacks(onSelfTalk, onEmotionChange) {
        this.onSelfTalkCallback = onSelfTalk;
        this.onEmotionChangeCallback = onEmotionChange;
    }

    // Public API
    getCurrentEmotion() {
        return this.emotionEngine.getCurrentEmotion();
    }

    forceEmotionTransition(emotion, trigger = 'manual') {
        return this.emotionEngine.transitionToEmotion(emotion, trigger);
    }

    triggerManualSelfTalk() {
        this.selfTalkManager.triggerSelfTalk('manual');
    }

    // Sistem durdur
    shutdown() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.selfTalkManager.stop();
        this.isInitialized = false;
        
        console.log('🧠 Brain System shutdown');
    }
}

// ===== GLOBAL BRAIN INSTANCE =====
window.brainSystem = new BrainSystem();

// ===== EXAMPLE SCENARIOS & USAGE =====
console.log(`
🧠 AI CHARACTER BRAIN SYSTEM LOADED!

📋 EXAMPLE SCENARIOS:

🎭 SINIRLI KARAKTER:
- Emotion: angry (intensity: 0.8)
- Example Output: "Ah be! Sinirlerim geriliyor şu an. Niye böyle oluyor ya?"
- TTS: Aggressive tone, faster speech
- Mouth Animation: More intense movements

🤔 MERAKLI KARAKTER:
- Emotion: curious (intensity: 0.7)  
- Example Output: "Oooh! Çok ilginç geldi kulağa. Daha fazla bilmek istiyorum!"
- Self-Talk Trigger: User asks question → Character gets more curious
- Mouth Animation: Expressive, questioning

😈 YARAMAZ KARAKTER:
- Emotion: mischievous (intensity: 0.6)
- Example Output: "Hehe... Şimdi biraz yaramaz modundayım. Ne yapmamı istiyorsun?"
- Natural Flow: happy → excited → mischievous (transition chain)

🔄 DATA FLOW:
User Input → Emotion Analysis → Brain Processing → Enhanced Prompt → Gemini API → TTS → Mouth Sync → Self-Talk Timer Reset

⚡ INTEGRATION WITH APP.JS:
1. Import this file in HTML: <script src="brain.js"></script>
2. Initialize: window.brainSystem.initialize()
3. Set callbacks for TTS integration
4. Process user messages through brain system
5. Handle self-talk events

🚀 READY TO USE! Initialize the brain system in app.js and watch your character come alive!
`);
