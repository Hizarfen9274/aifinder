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
        const { problem } = req.body;
        
        // Gemini API'yi başlat
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
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
              "sectors": ["Hangi sektörler için uygun"],
              "users": ["Kimler kullanabilir"],
              "useCases": ["Kullanım alanları"],
              "features": [
                "Özellik 1 detaylı açıklama",
                "Özellik 2 detaylı açıklama"
              ],
              "cautions": [
                "Dikkat edilmesi gereken nokta 1",
                "Dikkat edilmesi gereken nokta 2"
              ],
              "pricing": [
                "Ücretsiz Plan: Temel özellikler",
                "Pro Plan: Premium özellikler ve fiyatı",
                "Enterprise: Özel fiyatlandırma"
              ],
              "link": "https://aiaraci.com",
              "examplePrompt": "Bu araç için örnek bir soru/prompt",
              "exampleResponse": "Bu soruya aracın vereceği örnek cevap"
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
            console.error('Parse error:', parseError);
            res.status(500).json({
                error: 'AI yanıtı işlenemedi',
                rawResponse: text
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
});