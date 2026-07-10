const express = require('express'), fs = require('fs'), crypto = require('crypto'), app = express();
app.use(express.json()); app.use(express.static('public'));

const DB_FILE = './sistem_data.json';
const getDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const saveDB = (db) => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// Roblox ID'si olmayan içeri giremez
const robloxOnly = (req, res, next) => {
    if (!req.body.userId && !req.query.id) return res.status(403).send("Roblox'tan gelmeniz gerekli.");
    next();
};

app.post('/api/verify', robloxOnly, (req, res) => {
    let db = getDB();
    const { userId, task } = req.body;
    if(!db.tasks[userId]) db.tasks[userId] = { sub: false, join: false };
    db.tasks[userId][task] = true;
    saveDB(db);
    res.json({ success: true });
});

app.post('/api/get-key', robloxOnly, (req, res) => {
    let db = getDB();
    const { userId } = req.body;
    if(db.tasks[userId]?.sub && db.tasks[userId]?.join) {
        const key = "SG-" + crypto.randomBytes(16).toString('hex').toUpperCase();
        db.keys[key] = { userId, time: Date.now() };
        saveDB(db);
        res.json({ key });
    } else res.status(403).json({ error: "Görevleri tamamlayın!" });
});

// Admin Paneli (Basitleştirilmiş)
app.get('/admin', (req, res) => {
    const db = getDB();
    res.send(`<body style="background:#000; color:#0f0; font-family:monospace;"><h1>SanderG Admin</h1><pre>${JSON.stringify(db, null, 2)}</pre></body>`);
});

app.listen(3000);
