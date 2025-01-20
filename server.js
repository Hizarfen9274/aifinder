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
            console.error('API Key bulunamadı!');
            return res.status(500).json({ error: 'API Key eksik' });
        }

        console.log('API Key mevcut:', apiKey.substring(0, 5) + '...');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        console.log('Model oluşturuldu, istek gönderiliyor...');

        const prompt = `Sen bir yapay zeka öneri uzmanısın. Kullanıcının problemi: ${problem}

        Sadece yapay zeka araçları öner. Her önerdiğin araç kesinlikle bir yapay zeka uygulaması ya da yapay zeka kullanan bir servis olmalı. Her aracı kullanıcı yorumları, özellikleri ve genel performansına göre 10 üzerinden puanla. Yanıtını tam olarak bu formatta ver:

        {
          "recommendations": [
            {
              "name": "AI Aracı Adı",
              "description": "Kısa ve öz açıklama",
              "rating": 8.5,
              "tags": ["Tag1", "Tag2", "Tag3"],
              "features": [
                "Özellik 1",
                "Özellik 2"
              ],
              "cautions": [
                "Dikkat 1",
                "Dikkat 2"
              ],
              "pricing": [
                "Ücretsiz Plan",
                "Pro Plan"
              ],
              "link": "https://aiaraci.com",
              "examplePrompt": "Basit bir örnek soru",
              "exampleResponse": "Basit bir örnek cevap"
            }
          ]
        }

        Önerilerini şu kriterlere göre puanla:
        - Kullanıcı yorumları ve memnuniyeti
        - Özelliklerin kapsamı ve kalitesi
        - Fiyat/performans oranı
        - Kullanım kolaylığı
        - Güncellenme sıklığı
        - Topluluk desteği

        Önerileri en yüksek puandan en düşüğe doğru sırala. Puanlamayı 10 üzerinden yap ve ondalıklı sayılar kullan (örn: 8.5, 9.2 gibi).
        Önemli: exampleResponse içinde kod bloğu veya markdown kullanma, sadece düz metin kullan. JSON formatını bozabilecek karakterler kullanma.`;

        const result = await model.generateContent(prompt);
        console.log('API yanıt verdi');

        const response = await result.response;
        const text = response.text();
        
        console.log('Ham yanıt:', text);

        const cleanResponse = (text) => {
            try {
                let cleanText = text.replace(/```json\s*/g, '')
                                   .replace(/```\s*/g, '')
                                   .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                                   .replace(/\n/g, " ")
                                   .trim();
                
                // JSON'ı parse et ve sırala
                let data = JSON.parse(cleanText);
                data.recommendations.sort((a, b) => b.rating - a.rating); // Puana göre sırala
                
                return JSON.stringify(data);
            } catch (error) {
                console.log('İlk temizleme başarısız, alternatif yöntem deneniyor...');
                
                let cleanText = text.replace(/.*?(\{[\s\S]*\})/g, '$1')
                                   .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                                   .replace(/\n/g, " ")
                                   .trim();
                
                try {
                    let data = JSON.parse(cleanText);
                    data.recommendations.sort((a, b) => b.rating - a.rating); // Puana göre sırala
                    return JSON.stringify(data);
                } catch (e) {
                    throw new Error('JSON temizleme başarısız: ' + e.message);
                }
            }
        };

        const cleanedText = cleanResponse(text);
        console.log('Temizlenmiş yanıt:', cleanedText.substring(0, 100) + '...');

        const data = JSON.parse(cleanedText);
        res.json(data);

    } catch (error) {
        console.error('Detaylı hata:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            message: error.message,
            stack: error.stack
        });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('API Key durumu:', !!process.env.GOOGLE_API_KEY);
});