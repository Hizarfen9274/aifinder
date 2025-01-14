const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const app = express();

// Gemini API yapılandırması
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

console.log('Server başlatılıyor...');

app.use(cors());
app.use(express.json());

// Veritabanı dosya yolunu projenin ana dizininde oluştur
const DB_PATH = path.join(__dirname, 'database', 'users.json');

// Database klasörünü ve users.json dosyasını oluştur
function initializeDatabase() {
    try {
        // Database klasörünü oluştur
        const dbDir = path.join(__dirname, 'database');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir);
            console.log('Database klasörü oluşturuldu');
        }

        // users.json dosyasını oluştur
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), 'utf8');
            console.log('users.json dosyası oluşturuldu');
        }
    } catch (error) {
        console.error('Database başlatma hatası:', error);
        throw new Error('Database başlatılamadı');
    }
}

// Server başlarken database'i başlat
initializeDatabase();

// Kullanıcıları kaydetme fonksiyonu
function saveUsers(users) {
    try {
        // Önce geçici bir dosyaya yaz
        const tempPath = `${DB_PATH}.temp`;
        fs.writeFileSync(tempPath, JSON.stringify(users, null, 2), 'utf8');
        
        // Geçici dosyayı asıl dosyayla değiştir
        fs.renameSync(tempPath, DB_PATH);
        
        console.log('Kullanıcılar başarıyla kaydedildi');
        return true;
    } catch (error) {
        console.error('Dosya yazma hatası:', error);
        throw new Error('Kullanıcı verileri kaydedilemedi: ' + error.message);
    }
}

// Kullanıcıları okuma fonksiyonu
function getUsers() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            initializeDatabase();
            return [];
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        const users = JSON.parse(data);
        console.log(`${users.length} kullanıcı yüklendi`);
        return users;
    } catch (error) {
        console.error('Dosya okuma hatası:', error);
        return [];
    }
}

// Kayıt ol endpoint'i
app.post('/register', (req, res) => {
    console.log('Kayıt isteği alındı:', req.body);

    const { email, username, password } = req.body;
    
    if (!email || !username || !password) {
        console.log('Eksik veri:', { email, username, password });
        return res.status(400).json({ error: 'Tüm alanları doldurunuz' });
    }
    
    try {
        const users = getUsers();
        
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
        }
        
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanımda' });
        }
        
        const newUser = {
            id: Date.now().toString(),
            email,
            username,
            password,
            favorites: []
        };
        
        users.push(newUser);
        
        if (saveUsers(users)) {
            console.log('Yeni kullanıcı kaydedildi:', newUser.username);
            res.status(201).json({ message: 'Kayıt başarılı' });
        } else {
            throw new Error('Kullanıcı kaydedilemedi');
        }
        
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({ 
            error: 'Kullanıcı kaydedilemedi',
            details: error.message 
        });
    }
});

// Giriş yap endpoint'i
app.post('/login', (req, res) => {
    console.log('Giriş isteği alındı:', req.body);

    const { username, password } = req.body;
    
    if (!username || !password) {
        console.log('Eksik veri:', { username, password });
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    try {
        const users = getUsers();
        console.log(`Toplam ${users.length} kullanıcı bulundu`);
        
        const user = users.find(u => 
            (u.username === username || u.email === username) && u.password === password
        );
        
        if (!user) {
            console.log('Kullanıcı bulunamadı veya şifre hatalı');
            return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
        }
        
        console.log('Giriş başarılı:', user.username);
        
        res.json({ 
            message: 'Giriş başarılı',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ 
            error: 'Giriş yapılırken bir hata oluştu',
            details: error.message 
        });
    }
});

// AI önerileri endpoint'i
app.post('/get-ai-recommendations', async (req, res) => {
    try {
        const { problem } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Daha basit bir JSON yapısı kullanalım
        const prompt = `Sen bir yapay zeka öneri uzmanısın. Kullanıcının problemi: ${problem}

ÖNEMLİ: SADECE YAPAY ZEKA ARAÇLARI ÖNERMELİSİN!

Örnek yapay zeka araçları:
- ChatGPT, Claude, Bard gibi dil modelleri
- DALL-E, Midjourney, Stable Diffusion gibi görsel AI'lar
- Anthropic, Jasper, Copy.ai gibi içerik AI'ları
- Whisper, Murf.ai gibi ses AI'ları
- Github Copilot, Amazon CodeWhisperer gibi kod AI'ları

SAKIN ÖNERMEMENİZ GEREKENLER:
- Duolingo, Rosetta Stone gibi normal dil öğrenme uygulamaları
- Microsoft Office, Google Docs gibi ofis yazılımları
- Photoshop, Canva gibi tasarım araçları
- Normal mobil uygulamalar veya web siteleri
- Yapay zeka KULLANMAYAN hiçbir yazılım

Yanıtını tam olarak bu formatta ver:

{
  "recommendations": [
    {
      "name": "AI Aracı Adı (Sadece yapay zeka araçları)",
      "description": "Bu aracın nasıl yapay zeka kullandığını açıkla",
      "rating": 8.5,
      "tags": ["AI", "Yapay Zeka", "Machine Learning"],
      "sectors": ["Sektör1", "Sektör2"],
      "users": ["Kullanıcı1", "Kullanıcı2"],
      "useCases": [
        "Bu AI ile yapılabilecek şey 1",
        "Bu AI ile yapılabilecek şey 2"
      ],
      "features": [
        "AI'ın özelliği 1",
        "AI'ın özelliği 2"
      ],
      "cautions": [
        "AI kullanırken dikkat edilecek nokta 1",
        "AI kullanırken dikkat edilecek nokta 2"
      ],
      "pricing": [
        "Ücretsiz Plan: Temel AI özellikleri",
        "Pro Plan: Gelişmiş AI özellikleri",
        "Kurumsal Plan: Özel AI çözümleri"
      ],
      "link": "https://yapayzekaaraci.com",
      "examplePrompt": "Bu AI'a örnek bir soru",
      "exampleResponse": "AI'ın vereceği örnek cevap"
    }
  ]
}

UNUTMA:
1. Sadece ve sadece yapay zeka araçları öner
2. Her önerdiğin aracın gerçekten yapay zeka teknolojisi kullandığından emin ol
3. Normal yazılım veya uygulama önerme
4. Önerdiğin her araç için yapay zeka özelliklerini detaylı açıkla
5. Eğer bir konuda yapay zeka aracı bulamıyorsan, ChatGPT gibi genel amaçlı AI'ları öner`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }]}],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
            },
        });

        const response = await result.response;
        let text = response.text();

        try {
            // Metni temizle
            text = text.trim()
                      .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
                      .replace(/\n/g, " ")
                      .replace(/\r/g, "")
                      .replace(/\t/g, " ")
                      .replace(/\s+/g, " ");

            // JSON bloğunu bul
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) {
                throw new Error('JSON verisi bulunamadı');
            }

            let jsonStr = match[0];

            // JSON string'i düzelt
            jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')  // Tırnak işareti eksik olan anahtarları düzelt
                           .replace(/:\s*'([^']*)'/g, ':"$1"')  // Tek tırnak yerine çift tırnak kullan
                           .replace(/,\s*}/g, '}')  // Sondaki gereksiz virgülleri temizle
                           .replace(/,\s*]/g, ']');  // Sondaki gereksiz virgülleri temizle

            console.log('İşlenecek JSON:', jsonStr);  // Debug için

            // JSON'ı parse et
            const data = JSON.parse(jsonStr);

            // Veri kontrolü
            if (!data.recommendations || !Array.isArray(data.recommendations)) {
                throw new Error('Geçersiz veri yapısı');
            }

            // Rating'e göre sırala
            data.recommendations.sort((a, b) => b.rating - a.rating);

            res.json(data);

        } catch (parseError) {
            console.error('Parse hatası:', parseError);
            console.error('Problemli metin:', text);
            
            res.status(500).json({
                error: 'AI önerileri işlenemedi',
                details: parseError.message,
                rawText: text
            });
        }

    } catch (error) {
        console.error('Genel hata:', error);
        res.status(502).json({
            error: 'Öneriler alınamadı',
            details: error.message
        });
    }
});

// Favori ekleme endpoint'i
app.post('/add-favorite', (req, res) => {
    const { userId, ai } = req.body;
    
    try {
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        
        // AI zaten favorilerde var mı kontrol et
        const existingFav = user.favorites.find(fav => fav.name === ai.name);
        if (existingFav) {
            return res.status(400).json({ error: 'Bu AI zaten favorilerinizde' });
        }
        
        // Favoriyi ekle
        user.favorites.push({
            ...ai,
            addedAt: new Date().toISOString()
        });
        
        saveUsers(users);
        res.json({ message: 'Favori eklendi' });
    } catch (error) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
});

// Favorileri getirme endpoint'i
app.get('/favorites/:userId', (req, res) => {
    const { userId } = req.params;
    
    try {
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        
        res.json(user.favorites);
    } catch (error) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
});

// Favori silme endpoint'i
app.delete('/favorite/:userId/:aiName', (req, res) => {
    const { userId, aiName } = req.params;
    
    try {
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        
        user.favorites = user.favorites.filter(fav => fav.name !== aiName);
        saveUsers(users);
        
        res.json({ message: 'Favori silindi' });
    } catch (error) {
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
});

// Favorilere ekleme endpoint'i
app.post('/add-to-favorites', async (req, res) => {
    try {
        const { ai } = req.body;
        
        // Burada veritabanına kaydetme işlemi yapılacak
        // Şimdilik başarılı döndürelim
        res.json({ success: true, message: 'AI favorilere eklendi' });
        
    } catch (error) {
        console.error('Favorilere ekleme hatası:', error);
        res.status(500).json({ 
            error: 'Favorilere eklenirken bir hata oluştu',
            details: error.message 
        });
    }
});

// Favorilerden çıkarma endpoint'i
app.post('/remove-from-favorites', async (req, res) => {
    try {
        const { ai } = req.body;
        
        // Burada veritabanından silme işlemi yapılacak
        // Şimdilik başarılı döndürelim
        res.json({ success: true, message: 'AI favorilerden çıkarıldı' });
        
    } catch (error) {
        console.error('Favorilerden çıkarma hatası:', error);
        res.status(500).json({ 
            error: 'Favorilerden çıkarılırken bir hata oluştu',
            details: error.message 
        });
    }
});

// AI güncellemelerini getir (statik veri)
app.get('/get-ai-updates/:userId', async (req, res) => {
    try {
        // Örnek statik güncellemeler
        const staticUpdates = {
            updates: [
                {
                    ai: "ChatGPT",
                    icon: "🤖",
                    date: "2024-02-20",
                    title: "GPT-4 Turbo Güncellemesi",
                    description: "Daha hızlı yanıt süresi ve geliştirilmiş doğal dil işleme yetenekleri eklendi.",
                    type: "feature"
                },
                {
                    ai: "DALL-E 3",
                    icon: "🎨",
                    date: "2024-02-18",
                    title: "Görüntü Kalitesi İyileştirmesi",
                    description: "Daha gerçekçi ve detaylı görüntü üretimi için algoritma güncellemesi yapıldı.",
                    type: "improvement"
                },
                {
                    ai: "Claude",
                    icon: "🧠",
                    date: "2024-02-15",
                    title: "Bellek Yönetimi Düzeltmesi",
                    description: "Uzun sohbetlerde bellek kullanımı optimize edildi.",
                    type: "bugfix"
                },
                {
                    ai: "Midjourney",
                    icon: "🖼️",
                    date: "2024-02-14",
                    title: "Yeni Stil Seçenekleri",
                    description: "20 yeni sanat stili ve özelleştirilebilir parametre eklendi.",
                    type: "feature"
                }
            ]
        };

        res.json(staticUpdates);

    } catch (error) {
        console.error('Güncellemeler alınırken hata:', error);
        res.status(500).json({ error: 'Güncellemeler alınırken bir hata oluştu' });
    }
});

app.listen(3000, () => {
    console.log('===============================');
    console.log('Server 3000 portunda çalışıyor');
    console.log('===============================');
});