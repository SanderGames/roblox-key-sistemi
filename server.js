const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
app.use(express.json());

// ID Kontrolü: Eğer ID yoksa direkt reddet
function checkReferer(req, res, next) {
    const userId = req.body.userId || req.query.id;
    if (!userId) return res.status(403).send("Erişim Reddedildi: Sadece Roblox üzerinden bağlanabilirsiniz.");
    next();
}

app.post('/api/get-key', checkReferer, (req, res) => {
    const { userId } = req.body;
    // Süreli key (1 saatlik geçerlilik)
    const expiresAt = Date.now() + (3600 * 1000); 
    const complexKey = "SG-" + crypto.createHmac('sha256', 'SECRET').update(userId + Date.now()).digest('hex').toUpperCase().substring(0, 20);
    
    // Veritabanına kaydet
    let db = JSON.parse(fs.readFileSync('./sistem_data.json', 'utf8'));
    db.keys[complexKey] = { userId, expiresAt };
    fs.writeFileSync('./sistem_data.json', JSON.stringify(db, null, 2));
    
    res.json({ key: complexKey, expires: expiresAt });
});

app.listen(3000);
