const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const multer = require('multer');
const upload = multer();

const app = express();

// Middleware
app.use(cors({
    origin: 'https://aifinder-online.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());
app.use(express.static('public')); // Statik dosyalar için

// Hata yakalama middleware'i ekleyelim
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Ana sayfa route'u
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'problem.html'));
});

// recommendations endpoint'i
app.post('/recommendations', async (req, res) => {
    try {
        const { problem } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Sen bir yapay zeka öneri uzmanısın. Kullanıcının problemi: ${problem}

        Sadece yapay zeka araçları öner ve yanıtını tam olarak bu formatta ver:
        
        {
          "recommendations": [
            {
              "name": "AI Aracı Adı",
              "description": "Kısa açıklama",
              "rating": 8.5,
              "tags": ["Özellik1", "Özellik2"],
              "features": ["Detay1", "Detay2"],
              "pricing": ["Ücretsiz Plan", "Pro Plan: $10/ay"],
              "link": "https://aiaraci.com"
            }
          ]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        try {
            const data = JSON.parse(text);
            res.json(data);
        } catch (parseError) {
            res.status(500).json({
                error: 'AI yanıtı işlenemedi',
                details: text
            });
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: error.message
        });
    }
});

// Yeni endpoint
app.post('/process-request', upload.none(), async (req, res) => {
    try {
        const problem = req.body.problem;
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Sen bir yapay zeka öneri uzmanısın. Kullanıcının problemi: ${problem}

        Sadece yapay zeka araçları öner ve yanıtını tam olarak bu formatta ver:
        
        {
          "recommendations": [
            {
              "name": "AI Aracı Adı",
              "description": "Kısa açıklama",
              "rating": 8.5,
              "tags": ["Özellik1", "Özellik2"],
              "features": ["Detay1", "Detay2"],
              "pricing": ["Ücretsiz Plan", "Pro Plan: $10/ay"],
              "link": "https://aiaraci.com"
            }
          ]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const data = JSON.parse(text);
        res.json(data);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});