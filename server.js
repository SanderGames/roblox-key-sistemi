const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const DB_FILE = './sistem_data.json';

// Veritabanını güvenli oku
function getDB() {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

// Admin Yetki Kontrolü
function isAdmin(req) {
    return req.headers['x-admin-token'] === "SENIN_COK_GIZLI_SIFREN";
}

app.post('/api/verify', (req, res) => {
    const { userId, task } = req.body;
    let db = getDB();
    if(!db.tasks) db.tasks = {};
    if(!db.tasks[userId]) db.tasks[userId] = { sub: false, watch: false };
    db.tasks[userId][task] = true;
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    res.json({ success: true });
});

app.post('/api/get-key', (req, res) => {
    const { userId } = req.body;
    let db = getDB();
    if(db.tasks[userId] && db.tasks[userId].sub && db.tasks[userId].watch) {
        const key = "SANDER-" + crypto.randomBytes(4).toString('hex').toUpperCase();
        if(!db.keys) db.keys = {};
        db.keys[key] = { userId };
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.json({ key });
    } else {
        res.status(403).json({ error: "Görevler eksik!" });
    }
});

// Admin Paneli Veri Çekme
app.get('/api/admin/panel', (req, res) => {
    if (!isAdmin(req)) return res.status(403).send("Erişim Reddedildi!");
    res.json(getDB());
});

app.listen(3000, () => console.log('SanderG Sistemi Aktif!'));
