const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const DB_FILE = './sistem_data.json';
const ADMIN_TOKEN = "SENIN_COK_GIZLI_SIFREN"; // Burayı değiştir

function getDB() {
    if (!fs.existsSync(DB_FILE)) return { tasks: {}, keys: {} };
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function saveDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

app.post('/api/verify', (req, res) => {
    const { userId, task } = req.body;
    let db = getDB();
    if(!db.tasks) db.tasks = {};
    if(!db.tasks[userId]) db.tasks[userId] = { sub: false, watch: false };
    db.tasks[userId][task] = true;
    saveDB(db);
    res.json({ success: true });
});

app.post('/api/get-key', (req, res) => {
    const { userId } = req.body;
    let db = getDB();
    if(db.tasks[userId] && db.tasks[userId].sub && db.tasks[userId].watch) {
        const key = "SANDER-" + crypto.randomBytes(4).toString('hex').toUpperCase();
        db.keys[key] = { userId };
        saveDB(db);
        res.json({ key });
    } else { res.status(403).json({ error: "Görevler eksik!" }); }
});

// Admin Paneli (Analiz)
app.get('/api/admin/analiz', (req, res) => {
    if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(403).send("Hatalı Giriş!");
    const db = getDB();
    res.send(`<body style="background:black; color:#00ff41; font-family:monospace;"><h1>SanderG Yönetim</h1><pre>${JSON.stringify(db, null, 2)}</pre></body>`);
});

app.listen(3000);
