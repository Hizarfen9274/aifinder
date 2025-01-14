const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ana sayfa - HTML dosyasını public klasöründen serve et
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ status: 'OK' });
});

// Öneriler endpoint'i
app.post('/api/recommendations', (req, res) => {
    try {
        // Test verisi
        const testData = {
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

        res.json(testData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Port ayarı
const PORT = process.env.PORT || 3000;

// Server'ı başlat
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});