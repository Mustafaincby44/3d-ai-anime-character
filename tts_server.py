from flask import Flask, request, send_file
from flask_cors import CORS
import edge_tts
import asyncio
import io
import tempfile
import os
import json

app = Flask(__name__)
CORS(app)

# Edge TTS sesleri
VOICES = {
    "Turkish": {
        "Emel": "tr-TR-EmelNeural",
        "Ahmet": "tr-TR-AhmetNeural"
    },
    "English": {
        "Jenny": "en-US-JennyNeural",
        "Guy": "en-US-GuyNeural",
        "Aria": "en-US-AriaNeural",
        "Ana": "en-US-AnaNeural",
        "Christopher": "en-US-ChristopherNeural",
        "Eric": "en-US-EricNeural",
        "Michelle": "en-US-MichelleNeural",
        "Roger": "en-US-RogerNeural"
    },
    "Japanese": {
        "Nanami": "ja-JP-NanamiNeural",
        "Keita": "ja-JP-KeitaNeural"
    },
    "Korean": {
        "Sun-Hi": "ko-KR-SunHiNeural",
        "InJoon": "ko-KR-InJoonNeural"
    },
    "Chinese": {
        "Xiaoxiao": "zh-CN-XiaoxiaoNeural",
        "Yunyang": "zh-CN-YunyangNeural",
        "Yunxi": "zh-CN-YunxiNeural",
        "Xiaoyi": "zh-CN-XiaoyiNeural"
    },
    "German": {
        "Katja": "de-DE-KatjaNeural",
        "Conrad": "de-DE-ConradNeural",
        "Amala": "de-DE-AmalaNeural"
    },
    "French": {
        "Denise": "fr-FR-DeniseNeural",
        "Henri": "fr-FR-HenriNeural",
        "Eloise": "fr-FR-EloiseNeural"
    },
    "Spanish": {
        "Elvira": "es-ES-ElviraNeural",
        "Alvaro": "es-ES-AlvaroNeural"
    },
    "Italian": {
        "Isabella": "it-IT-IsabellaNeural",
        "Diego": "it-IT-DiegoNeural",
        "Elsa": "it-IT-ElsaNeural"
    },
    "Russian": {
        "Svetlana": "ru-RU-SvetlanaNeural",
        "Dmitry": "ru-RU-DmitryNeural"
    }
}

@app.route('/tts', methods=['POST'])
def generate_tts():
    try:
        data = request.json
        text = data.get('text', '')
        voice = data.get('voice', 'tr-TR-EmelNeural')
        speed = data.get('speed', 1.0)
        
        if not text:
            return {'error': 'Text is required'}, 400
            
        print(f"🎵 Generating TTS for: '{text[:50]}...' with voice: {voice}, speed: {speed}")
        
        # Edge TTS ile ses oluştur
        audio_data = asyncio.run(edge_tts.Communicate(text, voice, rate=f"{speed:+.1f}%").get_audio())
        
        # Geçici dosya oluştur
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        print(f"✅ TTS generated successfully, file size: {len(audio_data)} bytes")
        
        # Dosyayı gönder
        return send_file(temp_file_path, mimetype='audio/wav')
        
    except Exception as e:
        print(f"❌ TTS generation failed: {str(e)}")
        return {'error': str(e)}, 500

@app.route('/voices', methods=['GET'])
def get_voices():
    return {'voices': VOICES}

@app.route('/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'service': 'Edge TTS Server'}

if __name__ == '__main__':
    print("🚀 Starting Edge TTS Server...")
    print("📡 Server will be available at: http://localhost:5000")
    print("🎵 Supported voices:", len(VOICES), "languages")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
