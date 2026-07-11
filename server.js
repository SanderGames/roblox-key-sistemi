const express = require('express'), fs = require('fs'), crypto = require('crypto'), app = express();
app.use(express.json());

// Gelişmiş Şifreli Admin Girişi (Sadece senin cihazın için)
const ADMIN_SESSION = crypto.randomBytes(32).toString('hex'); // Sunucu açıldığında değişir
const checkAdmin = (req, res, next) => {
    if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return res.status(403).send("Yasak!");
    next();
};

// Dinamik İçerik Yönetimi
app.get('/api/settings', (req, res) => res.json(JSON.parse(fs.readFileSync('./sistem_data.json', 'utf8')).ayarlar));

// Mağaza & Başvuru & Key Sistemi Endpointleri
app.post('/api/admin/update', checkAdmin, (req, res) => {
    let db = JSON.parse(fs.readFileSync('./sistem_data.json', 'utf8'));
    db.ayarlar = { ...db.ayarlar, ...req.body }; // Mağaza, Linkler, Textler burada güncellenir
    fs.writeFileSync('./sistem_data.json', JSON.stringify(db, null, 2));
    res.json({ success: true });
});
