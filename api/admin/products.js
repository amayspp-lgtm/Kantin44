// api/admin/products.js

const express = require('express');
const { pool } = require('../../utils'); 

const router = express.Router();

const authorizeShop = (req, res, next) => {
    // Middleware Otorisasi (Sama seperti di atas)
    const shop_id = req.headers['x-shop-id'] || req.body.shop_id || req.query.shop_id;
    if (!shop_id) { return res.status(403).json({ message: 'Akses ditolak.' }); }
    req.shop_id = shop_id;
    next();
};
router.use(authorizeShop); 

// 1. GET /api/admin/products (List produk toko ini)
router.get('/', async (req, res) => {
    try {
        const [products] = await pool.execute(
            "SELECT id, name, price, stock, image_url, is_available FROM products WHERE shop_id = ?", 
            [req.shop_id]
        );
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Gagal memuat produk.' });
    }
});

// 2. POST /api/admin/products (Tambah produk baru)
router.post('/', async (req, res) => {
    const { id, name, price, category, stock, image_url } = req.body;
    try {
        await pool.execute(
            "INSERT INTO products (id, name, price, category, stock, image_url, shop_id, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [id, name, price, category, stock, image_url, req.shop_id, stock > 0]
        );
        res.status(201).json({ message: 'Produk berhasil ditambahkan.' });
    } catch (error) {
        // Asumsi error code 'ER_DUP_ENTRY' jika ID sudah ada
        res.status(400).json({ message: 'Gagal: ID produk mungkin sudah ada.' });
    }
});

// 3. PUT /api/admin/products/:id (Edit produk)
router.put('/:id', async (req, res) => {
    const { name, price, category, stock, image_url } = req.body;
    try {
        const [result] = await pool.execute(
            "UPDATE products SET name=?, price=?, category=?, stock=?, image_url=?, is_available=? WHERE id=? AND shop_id=?",
            [name, price, category, stock, image_url, stock > 0, req.params.id, req.shop_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan atau bukan milik toko Anda.' });
        }
        res.json({ message: 'Produk berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui produk.' });
    }
});

module.exports = router;