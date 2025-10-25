// api/shops.js

const express = require('express');
const { pool } = require('../utils'); 

const router = express.Router();

// GET /api/shops (Daftar semua toko untuk halaman utama)
router.get('/', async (req, res) => {
    try {
        // Ambil kolom yang relevan untuk kartu toko
        const [shops] = await pool.execute(
            "SELECT id, name, tagline, shop_icon, is_open FROM shops WHERE is_open = TRUE"
        );
        res.json(shops);
    } catch (error) {
        console.error("Error fetching shops:", error.message);
        res.status(500).json({ message: 'Gagal memuat daftar toko.' });
    }
});

// GET /api/shops/:shop_id (Ambil detail toko, termasuk QRIS URL)
router.get('/:shop_id', async (req, res) => {
    const { shop_id } = req.params;
    try {
        const [shop] = await pool.execute(
            "SELECT id, name, qris_url FROM shops WHERE id = ?", [shop_id]
        );
        if (shop.length === 0) {
            return res.status(404).json({ message: 'Toko tidak ditemukan.' });
        }
        res.json(shop[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat detail toko.' });
    }
});

module.exports = router;