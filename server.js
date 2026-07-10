const express = require('express'), fs = require('fs'), crypto = require('crypto'), app = express();
app.use(express.json()); app.use(express.static('public'));

const DB_FILE = './sistem_data.json';
const getDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const saveDB = (db) => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

app.post('/api/get-key', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(403).json({ error: "Roblox ID algılanmadı!" });
    let db = getDB();
    if (!db.tasks[userId]?.sub || !db.tasks[userId]?.join) return res.status(403).json({ error: "Görevler tamamlanmadı!" });
    
    // Karmaşık ve Süreli Key Üretimi
    const raw = userId + Date.now() + Math.random();
    const key = "SG-" + crypto.createHmac('sha256', 'SanderG-Secret').update(raw).digest('hex').toUpperCase().substring(0, 24);
    db.keys[key] = { userId, expires: Date.now() + 3600000 };
    saveDB(db);
    res.json({ key });
});

app.post('/api/verify-task', (req, res) => {
    const { userId, task } = req.body;
    let db = getDB();
    if (!db.tasks[userId]) db.tasks[userId] = { sub: false, join: false };
    db.tasks[userId][task] = true;
    saveDB(db);
    res.json({ success: true });
});

app.listen(3000, () => console.log('SanderG Güvenli Sistem Aktif.'));
