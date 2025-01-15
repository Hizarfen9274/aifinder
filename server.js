const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Test endpoint
app.get('/api/test', (req, res) => {
    try {
        res.json({
            status: 'OK',
            env: {
                nodeEnv: process.env.NODE_ENV,
                hasApiKey: !!process.env.GOOGLE_API_KEY
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AI önerileri
app.post('/api/recommendations', async (req, res) => {
    try {
        const { problem } = req.body;
        console.log('Gelen problem:', problem);

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API Key eksik' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `Sen bir yapay zeka öneri uzmanısın. Kullanıcının problemi: ${problem}

        Sadece yapay zeka araçları öner ve yanıtını tam olarak bu formatta ver:
        
        {
          "recommendations": [
            {
              "name": "AI Aracı Adı",
              "description": "Bu araç ne işe yarar ve nasıl çalışır detaylı açıklama",
              "rating": 8.5,
              "tags": ["Özellik1", "Özellik2", "Kategori1"],
              "features": [
                "Özellik 1 detaylı açıklama",
                "Özellik 2 detaylı açıklama"
              ],
              "pricing": [
                "Ücretsiz Plan: Temel özellikler",
                "Pro Plan: Premium özellikler ve fiyatı"
              ],
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
        console.error('Hata:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
});