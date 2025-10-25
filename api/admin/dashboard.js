// api/admin/dashboard.js

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

// GET /api/admin/dashboard (Dashboard Overview)
router.get('/', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD

        // Total Penjualan Hari Ini (hanya yang Selesai/Diproses)
        const [sales] = await pool.execute(
            "SELECT SUM(total_amount) AS total FROM orders WHERE shop_id = ? AND DATE(order_time) = ? AND status IN ('Selesai', 'Diproses', 'Dalam Pengiriman')",
            [req.shop_id, today]
        );

        // Jumlah Pesanan Baru (Menunggu Konfirmasi)
        const [pending] = await pool.execute(
            "SELECT COUNT(*) AS count FROM orders WHERE shop_id = ? AND status IN ('Menunggu Konfirmasi', 'Menunggu Pembayaran')",
            [req.shop_id]
        );
        
        // Total Produk
        const [totalProducts] = await pool.execute(
            "SELECT COUNT(*) AS count FROM products WHERE shop_id = ?", [req.shop_id]
        );

        res.json({
            shop_id: req.shop_id,
            total_sales_today: sales[0].total || 0,
            pending_orders: pending[0].count,
            total_products: totalProducts[0].count
        });

    } catch (error) {
        console.error("Dashboard Error:", error.message);
        res.status(500).json({ message: 'Gagal memuat data statistik.' });
    }
});

module.exports = router;