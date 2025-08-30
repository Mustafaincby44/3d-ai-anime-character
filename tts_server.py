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

# Edge TTS sesleri - Gelişmiş ses listesi
VOICES = {
    "Turkish": {
        "Emel": "tr-TR-EmelNeural",
        "Ahmet": "tr-TR-AhmetNeural"
    },
    "English": {
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
    "Japanese": {
        "Nanami": "ja-JP-NanamiNeural",
        "Keita": "ja-JP-KeitaNeural"
    },
    "Korean": {
        "Sun-Hi": "ko-KR-SunHiNeural",
        "InJoon": "ko-KR-InJoonNeural"
    },
    "German": {
        "Katja": "de-DE-KatjaNeural",
        "Amala": "de-DE-AmalaNeural",
        "Conrad": "de-DE-ConradNeural",
        "Killian": "de-DE-KillianNeural",
        "Ingrid": "de-AT-IngridNeural",
        "Jonas": "de-AT-JonasNeural",
        "Jan": "de-CH-JanNeural",
        "Leni": "de-CH-LeniNeural"
    },
    "French": {
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
    "Spanish": {
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
