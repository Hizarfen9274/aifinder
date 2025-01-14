const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// CORS ayarları
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'problem.html'));
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ status: 'OK' });
});

// AI önerileri
app.post('/recommendations', async (req, res) => {
    try {
        const testData = {
            recommendations: [
                {
                    name: "ChatGPT",
                    description: "OpenAI tarafından geliştirilen güçlü bir dil modeli",
                    rating: 9.5,
                    tags: ["Yapay Zeka", "Sohbet", "Metin Üretimi"],
                    features: [
                        "Doğal dil işleme",
                        "Metin üretimi",
                        "Soru-cevap"
                    ],
                    pricing: [
                        "Ücretsiz: Sınırlı kullanım",
                        "Plus: $20/ay"
                    ],
                    link: "https://chat.openai.com"
                }
            ]
        };

        res.json(testData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});