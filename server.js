const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = './sistem_data.json';
const ADMIN_PASSWORD = "admin1234_super_secret"; 
const ADMIN_HASH = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

function veritabanıOku() {
    const varsayilan = {
        ayarlar: {
            youtubeAbone: true,
            youtubeBegeni: true,
            discordKatilim: true,
            youtubeKanalLink: "https://youtube.com/c/Kanaliniz",
            youtubeVideoLink: "https://youtube.com/watch?v=VideoID",
            discordLink: "https://discord.gg/DavetKodu",
            beklemeSuresiSaniye: 30
        },
        cihazlar: {},
        aktifKeyler: {},
        karaListe: [] // KARA LİSTE DESTEĞİ
    };
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(varsayilan, null, 2));
        return varsayilan;
    }
    try {
        const icerik = fs.readFileSync(DATA_FILE, 'utf8').trim();
        return icerik ? JSON.parse(icerik) : varsayilan;
    } catch { return varsayilan; }
}

function veritabanıYaz(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function keyUret() {
    return `PREM-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function adminKorumasi(req, res, next) {
    const { token } = req.body;
    if (token !== ADMIN_HASH) return res.status(401).json({ error: "Yetkisiz Erişim!" });
    next();
}

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (crypto.createHash('sha256').update(password || '').digest('hex') === ADMIN_HASH) {
        return res.json({ success: true, token: ADMIN_HASH });
    }
    res.status(401).json({ error: "Hatalı şifre!" });
});

app.get('/api/ayarlar', (req, res) => {
    res.json(veritabanıOku().ayarlar);
});

app.post('/api/gorev-baslat', (req, res) => {
    const { cihazId, gorevTipi, cihazDetaylari } = req.body;
    if (!cihazId) return res.status(400).json({ error: "Geçersiz kimlik!" });

    const db = veritabanıOku();
    
    // Kara liste kontrolü
    if (db.karaListe && db.karaListe.includes(cihazId)) {
        return res.status(403).json({ error: "Cihazınız sistemden kalıcı olarak yasaklanmıştır!" });
    }

    const guvenliHash = crypto.createHash('sha256').update(cihazId).digest('hex');

    if (!db.cihazlar[guvenliHash]) {
        db.cihazlar[guvenliHash] = { 
            mizanpajId: cihazId,
            sonAlimZamani: 0, 
            cihazOzellikleri: cihazDetaylari || {},
            gorevler: {} 
        };
    } else if (cihazDetaylari) {
        db.cihazlar[guvenliHash].cihazOzellikleri = cihazDetaylari;
    }

    db.cihazlar[guvenliHash].gorevler[gorevTipi] = Date.now();
    veritabanıYaz(db);
    res.json({ success: true });
});

app.post('/api/key-olustur', (req, res) => {
    const { cihazId, cihazDetaylari } = req.body;
    if (!cihazId) return res.status(400).json({ error: 'Güvenlik doğrulaması başarısız!' });

    const db = veritabanıOku();
    if (db.karaListe && db.karaListe.includes(cihazId)) {
        return res.status(403).json({ error: "Yasaklı cihaz!" });
    }

    const guvenliHash = crypto.createHash('sha256').update(cihazId).digest('hex');
    const simdi = Date.now();

    if (db.cihazlar[guvenliHash] && db.cihazlar[guvenliHash].sonAlimZamani) {
        const sonAlim = db.cihazlar[guvenliHash].sonAlimZamani;
        if (simdi - sonAlim < 24 * 60 * 60 * 1000) {
            const kalanSaat = Math.ceil((24 * 60 * 60 * 1000 - (simdi - sonAlim)) / (1000 * 60 * 60));
            return res.status(429).json({ error: `Bu cihaz kilitlidir! ${kalanSaat} saat beklemelisiniz.` });
        }
    }

    const yeniKey = keyUret();
    db.cihazlar[guvenliHash] = {
        mizanpajId: cihazId,
        key: yeniKey,
        sonAlimZamani: simdi,
        cihazOzellikleri: cihazDetaylari || {},
        gorevler: {}
    };

    if (!db.aktifKeyler) db.aktifKeyler = {};
    db.aktifKeyler[yeniKey] = guvenliHash; 
    
    veritabanıYaz(db);
    res.json({ success: true, key: yeniKey });
});

app.post('/api/key-kontrol', (req, res) => {
    const { key, cihazId } = req.body;
    const db = veritabanıOku();

    if (db.karaListe && db.karaListe.includes(cihazId)) {
        return res.status(403).json({ success: false, message: "Cihazınız engellenmiştir!" });
    }

    const suAnkiCihazHash = crypto.createHash('sha256').update(cihazId).digest('hex');
    if (!db.aktifKeyler || !db.aktifKeyler[key]) return res.status(404).json({ success: false, message: "Geçersiz anahtar!" });
    if (db.aktifKeyler[key] !== suAnkiCihazHash) return res.status(403).json({ success: false, message: "Donanım uyuşmazlığı! Key bu cihaza ait değil." });

    res.json({ success: true, message: "✓ Erişim onaylandı." });
});

app.listen(3000, () => console.log('İleri Düzey Donanım Analiz Sistemi Aktif!'));