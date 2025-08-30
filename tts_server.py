from flask import Flask, jsonify, request, send_file
import edge_tts
import asyncio
import os
import uuid

app = Flask(__name__)

# Tüm voice listesini alıyoruz
async def fetch_all_voices():
    voices = await edge_tts.list_voices()
    return voices

# Sesleri saklıyoruz (server açılırken çekiyoruz)
all_voices = asyncio.run(fetch_all_voices())

@app.route("/voices", methods=["GET"])
def get_voices():
    return jsonify(all_voices)

@app.route("/speak", methods=["POST"])
def speak():
    data = request.json
    text = data.get("text")
    voice = data.get("voice", "en-US-JennyNeural")
    rate = data.get("rate", "+0%")
    pitch = data.get("pitch", "+0Hz")

    if not text:
        return jsonify({"error": "Missing text"}), 400

    file_id = str(uuid.uuid4())
    output_file = f"output_{file_id}.wav"

    async def run_tts():
        tts = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await tts.save(output_file)

    asyncio.run(run_tts())

    return send_file(output_file, mimetype="audio/wav")

if __name__ == "__main__":
    print("🚀 Starting Edge TTS Server...")
    print("📡 Local server: http://localhost:5000")
    print("🌐 Public URL: https://91df40e54b10.ngrok-free.app")
    print("🎵 Supported voices:", len(all_voices), "voices available")
    
    app.run(host="0.0.0.0", port=5000)
