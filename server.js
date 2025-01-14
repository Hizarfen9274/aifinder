const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// CORS ayarlarını güncelle
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.static('public'));

// Test endpoint'i
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'problem.html'));
});

// AI önerileri
app.post('/ai-suggest', async (req, res) => {
    console.log('POST isteği alındı:', req.body);
    
    try {
        // Test yanıtı gönder
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

        res.json(testResponse);

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