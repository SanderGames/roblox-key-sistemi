const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = './sistem_data.json';

function dbOku() {
    if (!fs.existsSync(DATA_FILE)) return { cihazlar: {}, aktifKeyler: {}, tokenlar: {} };
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function dbYaz(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

// 1. Link oluşturma (Oyuncuya özel)
app.get('/api/get-link', (req, res) => {
    const id = req.query.id;
    const token = crypto.randomBytes(16).toString('hex');
    const db = dbOku();
    db.tokenlar[token] = id; // Tokenı ID ile eşle
    dbYaz(db);
    res.json({ link: `https://senin-siten.onrender.com/?token=${token}` });
});

// 2. Key üretme (Sadece token sahibi)
app.post('/api/key-olustur', (req, res) => {
    const { token, id } = req.body;
    const db = dbOku();
    
    if (db.tokenlar[token] !== id) return res.status(403).json({ error: "Geçersiz işlem!" });
    
    const yeniKey = "KEY-" + crypto.randomBytes(4).toString('hex').toUpperCase();
    db.aktifKeyler[yeniKey] = id;
    delete db.tokenlar[token]; // Kullanılan tokenı sil
    dbYaz(db);
    res.json({ key: yeniKey });
});

// 3. Kontrol
app.post('/api/key-kontrol', (req, res) => {
    const { key, id } = req.body;
    const db = dbOku();
    if (db.aktifKeyler[key] === id) return res.json({ success: true });
    res.status(403).json({ success: false });
});

app.listen(3000);
