const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Statik dosyalar için

// Ana sayfa route'u
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'problem.html'));
});

// AI önerileri için API endpoint'i
app.post('/get-ai-recommendations', async (req, res) => {
    try {
        const { problem } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // ... geri kalan kod aynı ...
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});