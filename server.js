const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'problem.html'));
});

// AI önerileri
app.post('/ai-suggest', async (req, res) => {
    try {
        console.log('İstek alındı:', req.body); // Debug log

        const { problem } = req.body;
        const apiKey = process.env.GOOGLE_API_KEY;
        
        console.log('API Key:', apiKey ? 'Mevcut' : 'Eksik'); // Debug log
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        console.log('Model oluşturuldu, istek gönderiliyor...'); // Debug log

        const prompt = `Sen bir yapay zeka öneri uzmanısın. Kullanıcının problemi: ${problem}

        Sadece yapay zeka araçları öner ve yanıtını tam olarak bu formatta ver:
        
        {
          "recommendations": [
            {
              "name": "AI Aracı Adı",
              "description": "Bu araç ne işe yarar ve nasıl çalışır detaylı açıklama",
              "rating": 8.5,
              "tags": ["Özellik1", "Özellik2", "Kategori1"],
              "features": ["Özellik 1", "Özellik 2"],
              "pricing": ["Ücretsiz Plan", "Pro Plan"],
              "link": "https://aiaraci.com"
            }
          ]
        }`;

        const result = await model.generateContent(prompt);
        console.log('API yanıtı alındı'); // Debug log
        
        const response = await result.response;
        const text = response.text();
        console.log('Yanıt metni:', text.substring(0, 100) + '...'); // Debug log
        
        try {
            const data = JSON.parse(text);
            console.log('JSON başarıyla parse edildi'); // Debug log
            res.json(data);
        } catch (parseError) {
            console.error('Parse hatası:', parseError); // Debug log
            res.status(500).json({
                error: 'AI yanıtı işlenemedi',
                rawResponse: text
            });
        }

    } catch (error) {
        console.error('Ana hata:', error); // Debug log
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