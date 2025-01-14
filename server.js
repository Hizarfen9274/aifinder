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

// AI önerileri
app.post('/ai-suggest', async (req, res) => {
    console.log('POST isteği alındı:', req.body);
    
    try {
        // Test yanıtı
        const testResponse = {
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
                },
                {
                    name: "Grammarly",
                    description: "Gelişmiş gramer ve yazım kontrolü aracı",
                    rating: 9.0,
                    tags: ["Gramer", "Yazım", "Düzeltme"],
                    features: [
                        "Gramer kontrolü",
                        "Yazım düzeltme",
                        "Stil önerileri"
                    ],
                    pricing: [
                        "Ücretsiz: Temel özellikler",
                        "Premium: $12/ay"
                    ],
                    link: "https://www.grammarly.com"
                }
            ]
        };

        // JSON yanıtı gönder
        res.setHeader('Content-Type', 'application/json');
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