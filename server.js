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
    console.log('POST isteği alındı');  // TEST LOG 1
    
    try {
        const { problem } = req.body;
        console.log('Gelen problem:', problem);  // TEST LOG 2

        // API Key kontrolü
        if (!process.env.GOOGLE_API_KEY) {
            console.error('API Key bulunamadı!');  // TEST LOG 3
            throw new Error('API Key eksik');
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        console.log('GenAI oluşturuldu');  // TEST LOG 4

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log('Model alındı');  // TEST LOG 5

        const prompt = `Kullanıcının problemi: ${problem}\n\nBu probleme uygun yapay zeka araçları öner. Yanıtını kesinlikle JSON formatında ver.`;
        
        console.log('Prompt hazır, API çağrısı yapılıyor...');  // TEST LOG 6
        
        const result = await model.generateContent(prompt);
        console.log('API yanıt verdi');  // TEST LOG 7
        
        const response = await result.response;
        const text = response.text();
        console.log('Alınan yanıt:', text.substring(0, 100));  // TEST LOG 8

        // Test amaçlı sabit bir yanıt
        const testResponse = {
            recommendations: [
                {
                    name: "Test AI",
                    description: "Test açıklama",
                    rating: 8.5,
                    tags: ["Test1", "Test2"],
                    features: ["Özellik1", "Özellik2"],
                    pricing: ["Ücretsiz", "Pro: $10"],
                    link: "https://example.com"
                }
            ]
        };

        // Önce test yanıtını gönderelim
        console.log('Test yanıtı gönderiliyor');  // TEST LOG 9
        res.json(testResponse);

    } catch (error) {
        console.error('HATA:', error);  // TEST LOG 10
        res.status(500).json({
            error: 'Sunucu hatası',
            message: error.message,
            stack: error.stack
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
    console.log('Process ENV:', {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
    });
});