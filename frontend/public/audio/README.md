# Audio Files Directory

## 🎵 Audio Files for 3D Animation

# Audio Assets

## 📁 Fichiers Requis

### Fichiers Audio
- `scriptfr.ogg` - Script vocal en français pour le personnage 3D (format OGG)
- `scriptar.ogg` - Script vocal en arabe pour le personnage 3D (format OGG)
- `scriptfr.mp3` - Version MP3 (fallback/backup)
- `scriptar.mp3` - Version MP3 (fallback/backup)

### Fichiers de Synchronisation (✅ Générés)
- `scriptfr.json` - Données de synchronisation labiale pour le français
- `scriptar.json` - Données de synchronisation labiale pour l'arabe

## 🎤 Génération des Fichiers de Synchronisation

Pour générer les fichiers JSON de synchronisation labiale, exécutez le script:

```bash
cd ..\..\  # Retour au dossier frontend
generate-lipsync.bat
```

Ou manuellement:
```bash
..\Rhubarb-Lip-Sync-1.14.0-Windows\rhubarb.exe -f json -o scriptfr.json scriptfr.ogg
..\Rhubarb-Lip-Sync-1.14.0-Windows\rhubarb.exe -f json -o scriptar.json scriptar.ogg
```

## 📝 Format des Fichiers JSON

Les fichiers JSON générés par Rhubarb contiennent:
```json
{
  "metadata": {
    "soundFile": "scriptfr.mp3",
    "duration": 10.5
  },
  "mouthCues": [
    { "start": 0.0, "end": 0.3, "value": "X" },
    { "start": 0.3, "end": 0.5, "value": "D" },
    { "start": 0.5, "end": 0.8, "value": "A" }
  ]
}
```

## 🔊 Utilisation

Les fichiers audio sont automatiquement chargés dans `KineScene.jsx` selon la langue de l'interface:
- Langue française → `scriptfr.ogg` + `scriptfr.json`
- Langue arabe → `scriptar.ogg` + `scriptar.json`

La synchronisation labiale est gérée automatiquement par le hook `useLipSync`.

## ✅ Statut

- [x] Fichiers audio OGG présents
- [x] Fichiers JSON de synchronisation générés
- [x] Hook useLipSync configuré
- [x] Intégration dans KineScene.jsx complète
- [ ] Configuration des morph targets du modèle 3D (à faire dans Blender)

### File Structure:
```
audio/
├── welcome-speech.mp3         # Welcome message
├── intro.mp3                  # Introduction speech
└── README.md                  # This file
```

## ✅ Audio Requirements:

### Format:
- **MP3** (recommended for web)
- **WAV** (higher quality, larger size)
- **OGG** (good compression)

### Technical Specs:
- **Bitrate**: 128-192 kbps (MP3)
- **Sample rate**: 44.1 kHz or 48 kHz
- **Channels**: Mono or Stereo
- **Duration**: Keep under 30 seconds for intro/welcome

### For Lipsync:
- Clear speech with minimal background noise
- Consistent volume levels
- Proper pronunciation
- Pauses between phrases

## 🎙️ Recording Tips:

1. **Use a good microphone** (or smartphone in quiet room)
2. **Record in quiet environment**
3. **Speak clearly** and at moderate pace
4. **Maintain consistent distance** from microphone
5. **Edit and normalize** audio levels

## 🛠️ Audio Tools:

### Free Software:
- **Audacity** - https://www.audacityteam.org/
  - Record, edit, and export audio
  - Noise reduction
  - Normalize volume

- **Ocenaudio** - https://www.ocenaudio.com/
  - Simple and fast audio editor

### Online Tools:
- **Online Audio Converter** - https://online-audio-converter.com/
- **TwistedWave** - https://twistedwave.com/online
- **Audio Trimmer** - https://audiotrimmer.com/

## 🤖 Text-to-Speech Options:

If you don't have voice recordings:

1. **ElevenLabs** - https://elevenlabs.io/ (High quality, realistic)
2. **Google Cloud TTS** - https://cloud.google.com/text-to-speech
3. **Amazon Polly** - https://aws.amazon.com/polly/
4. **Microsoft Azure Speech** - https://azure.microsoft.com/services/cognitive-services/text-to-speech/

## 📝 Sample Script (French):

```
"Bonjour et bienvenue chez KinéVerse. 
Je suis votre assistant virtuel. 
Nous sommes là pour prendre soin de votre santé et votre bien-être. 
Réservez votre séance dès maintenant."
```

## 🚀 Usage:

After placing audio files here, update the path in:
```javascript
frontend/src/components/KineScene.jsx
```

Example:
```jsx
const audioUrl = '/audio/welcome-speech.mp3';
```

## 🎬 Testing:

The audio will play automatically or on user interaction when the 3D scene loads on the home page.
