const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const DB_FILE = './sistem_data.json';
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

// Görev Doğrulama API
app.post('/api/verify', (req, res) => {
    const { userId, task } = req.body;
    if(!db.tasks) db.tasks = {};
    if(!db.tasks[userId]) db.tasks[userId] = { sub: false, watch: false };
    
    db.tasks[userId][task] = true;
    fs.writeFileSync(DB_FILE, JSON.stringify(db));
    res.json({ success: true });
});

// Key Üretme API (Sadece görevler tam ise)
app.post('/api/get-key', (req, res) => {
    const { userId } = req.body;
    const userTasks = db.tasks[userId];
    
    if(userTasks && userTasks.sub && userTasks.watch) {
        const key = crypto.randomBytes(6).toString('hex').toUpperCase();
        db.keys[key] = { userId };
        fs.writeFileSync(DB_FILE, JSON.stringify(db));
        res.json({ key });
    } else {
        res.status(403).json({ error: "Görevleri tamamlamadınız!" });
    }
});

app.listen(3000);
