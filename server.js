const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const DB_FILE = './sistem_data.json';
const ADMIN_TOKEN = "SENIN_COK_GIZLI_SIFREN";

// Karmaşık Key Üretici (Sadece ID'ye özel)
function generateComplexKey(userId) {
    const rawKey = userId + Date.now() + Math.random();
    return "SG-" + crypto.createHash('sha256').update(rawKey).digest('hex').substring(0, 24).toUpperCase();
}

app.post('/api/get-key', (req, res) => {
    const { userId } = req.body;
    let db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    
    // Sadece Roblox'tan gelen geçerli kullanıcılar
    if(db.tasks[userId] && db.tasks[userId].sub && db.tasks[userId].join) {
        const key = generateComplexKey(userId);
        db.keys[key] = { userId, createdAt: Date.now() };
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.json({ key });
    } else { res.status(403).json({ error: "Erişim reddedildi!" }); }
});

// ... (Diğer API'lar aynı kalabilir)
app.listen(3000);
