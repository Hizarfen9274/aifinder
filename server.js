const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// AI önerileri
app.post('/api/recommendations', async (req, res) => {
    try {
        console.log('İstek alındı:', req.body);

        const { problem } = req.body;
        
        // API Key kontrolü
        if (!process.env.GOOGLE_API_KEY) {
            console.error('API Key bulunamadı!');
            return res.status(500).json({ error: 'API Key eksik' });
        }
        console.log('API Key mevcut');

        // Gemini API'yi başlat
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log('Model oluşturuldu');

        const prompt = `Sen bir yapay zeka öneri uzmanısın. Kullanıcının problemi: ${problem}

        Sadece yapay zeka araçları öner ve yanıtını tam olarak bu formatta ver:
        
        {
          "recommendations": [
            {
              "name": "AI Aracı Adı",
              "description": "Bu araç ne işe yarar ve nasıl çalışır detaylı açıklama",
              "rating": 8.5,
              "tags": ["Özellik1", "Özellik2"],
              "features": ["Özellik 1", "Özellik 2"],
              "pricing": ["Ücretsiz Plan", "Pro Plan"],
              "link": "https://aiaraci.com"
            }
          ]
        }`;

        console.log('API isteği gönderiliyor...');
        const result = await model.generateContent(prompt);
        console.log('API yanıtı alındı');
        
        const response = await result.response;
        const text = response.text();
        console.log('Alınan yanıt:', text.substring(0, 100));
        
        try {
            const data = JSON.parse(text);
            console.log('JSON başarıyla parse edildi');
            res.json(data);
        } catch (parseError) {
            console.error('Parse hatası:', parseError);
            console.error('Ham yanıt:', text);
            res.status(500).json({
                error: 'AI yanıtı işlenemedi',
                details: parseError.message,
                rawResponse: text
            });
        }

    } catch (error) {
        console.error('Ana hata:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: error.message,
            stack: error.stack
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
    console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Mevcut' : 'Eksik'
    });
});