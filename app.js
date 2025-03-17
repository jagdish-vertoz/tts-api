const express = require('express');
const cors = require('cors'); // Import CORS
const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all requests
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Function to generate a unique filename
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// API Endpoint: Convert Text to Speech
app.post('/api/text-to-speech', (req, res) => {
  const { text, language = 'en' } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  const filename = `${generateId()}.mp3`;
  const filePath = path.join(uploadsDir, filename);
  
  const gtts = new gTTS(text, language);
  
  gtts.save(filePath, (err) => {
    if (err) {
      console.error('Error generating speech:', err);
      return res.status(500).json({ error: 'Failed to generate speech' });
    }
    
    res.json({ success: true, fileUrl: `/download/${filename}` });
  });
});

// API Endpoint: Download Generated MP3 File
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath);
});

// API Endpoint: Get Available Languages
app.get('/api/languages', (req, res) => {
  const languages = {
    'af': 'Afrikaans', 'sq': 'Albanian', 'ar': 'Arabic', 'hy': 'Armenian',
    'ca': 'Catalan', 'zh': 'Chinese', 'zh-cn': 'Chinese (Mandarin/China)',
    'zh-tw': 'Chinese (Mandarin/Taiwan)', 'hr': 'Croatian', 'cs': 'Czech',
    'da': 'Danish', 'nl': 'Dutch', 'en': 'English', 'en-au': 'English (Australia)',
    'en-uk': 'English (United Kingdom)', 'en-us': 'English (United States)',
    'eo': 'Esperanto', 'fi': 'Finnish', 'fr': 'French', 'de': 'German',
    'el': 'Greek', 'ht': 'Haitian Creole', 'hi': 'Hindi', 'hu': 'Hungarian',
    'is': 'Icelandic', 'id': 'Indonesian', 'it': 'Italian', 'ja': 'Japanese',
    'ko': 'Korean', 'la': 'Latin', 'lv': 'Latvian', 'mk': 'Macedonian',
    'no': 'Norwegian', 'pl': 'Polish', 'pt': 'Portuguese', 'pt-br': 'Portuguese (Brazil)',
    'ro': 'Romanian', 'ru': 'Russian', 'sr': 'Serbian', 'sk': 'Slovak',
    'es': 'Spanish', 'es-es': 'Spanish (Spain)', 'es-us': 'Spanish (United States)',
    'sw': 'Swahili', 'sv': 'Swedish', 'ta': 'Tamil', 'th': 'Thai', 'tr': 'Turkish',
    'vi': 'Vietnamese', 'cy': 'Welsh'
  };
  
  res.json(languages);
});

// Cleanup Old Files (Deletes files older than 1 hour)
const cleanupOldFiles = () => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return;
    
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (now - stats.mtime.getTime() > 3600000) { // 1 hour
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
};

// Run cleanup every hour
setInterval(cleanupOldFiles, 3600000);

// Serve static files from the 'public' directory (optional frontend)
app.use(express.static('public'));

// Start Server
app.listen(port, () => {
  console.log(`Text-to-Speech API running on http://localhost:${port}`);
});
