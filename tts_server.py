from flask import Flask, request, send_file, jsonify
import asyncio
import tempfile
import edge_tts

app = Flask(__name__)

language_dict = {
    "English": {"Luna": "en-SG-LunaNeural"}
}

async def generate_tts(text, voice):
    communicate = edge_tts.Communicate(text, voice)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
        await communicate.save(tmp_file.name)
        return tmp_file.name

@app.route("/speak", methods=["POST"])
def speak():
    data = request.json
    text = data.get("text")
    language = data.get("language", "English")
    speaker = data.get("speaker", "Luna")

    voice = language_dict.get(language, {}).get(speaker)
    if not voice:
        return jsonify({"error": "Voice not found"}), 400
    if not text or text.strip() == "":
        return jsonify({"error": "Text is empty"}), 400

    try:
        mp3_path = asyncio.run(generate_tts(text, voice))
        return send_file(mp3_path, mimetype="audio/mpeg", as_attachment=False)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# CORS için basit çözüm
from flask_cors import CORS
CORS(app)

if __name__ == "__main__":
    app.run(debug=True)
