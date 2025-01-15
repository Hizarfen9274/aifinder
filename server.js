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
        console.log('İstek alındı:', req.body);

        // API Key kontrolü
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error('API Key bulunamadı!');
            return res.status(500).json({ 
                error: 'API Key eksik',
                env: process.env.NODE_ENV
            });
        }

        // Test yanıtı
        const testResponse = {
            recommendations: [
                {
                    name: "Test AI",
                    description: "Bu bir test yanıtıdır",
                    rating: 8.5,
                    tags: ["Test1", "Test2"],
                    features: ["Özellik1", "Özellik2"],
                    pricing: ["Ücretsiz", "Pro: $10"],
                    link: "https://example.com"
                }
            ]
        };

        // Önce test yanıtını gönderelim
        return res.json(testResponse);

        /* Gerçek API çağrısını şimdilik yorum satırına alalım
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `...`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const data = JSON.parse(text);
        res.json(data);
        */

    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: error.message,
            env: process.env.NODE_ENV
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