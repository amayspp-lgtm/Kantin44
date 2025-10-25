// api/menu.js

const express = require('express');
const { pool } = require('../utils'); 

const router = express.Router();

// GET /api/menu/:shop_id
router.get('/:shop_id', async (req, res) => {
    const { shop_id } = req.params;
    try {
        const [products] = await pool.execute(
            "SELECT id, name, price, category, stock, image_url FROM products WHERE shop_id = ? AND is_available = TRUE ORDER BY name",
            [shop_id]
        );
        res.json(products);
    } catch (error) {
        console.error("Error fetching menu:", error.message);
        res.status(500).json({ message: 'Gagal memuat menu toko.' });
    }
});

module.exports = router;