// api/order.js

const express = require('express');
const { pool, generateOrderCode, notifyNewOrder } = require('../utils');

const router = express.Router();

// POST /api/order
router.post('/', async (req, res) => {
    const { name, customerClass, notes, items, shop_id, payment_method, total_amount } = req.body;

    if (!items || !shop_id || !name) {
        return res.status(400).json({ message: 'Data pesanan tidak lengkap.' });
    }

    const order_id = generateOrderCode();
    let initial_status = (payment_method === 'COD') ? 'Menunggu Konfirmasi' : 'Menunggu Pembayaran'; // Status awal
    
    try {
        const items_json = JSON.stringify(items);
        
        await pool.execute(
            "INSERT INTO orders (order_id, shop_id, customer_name, customer_class, notes, total_amount, items_json, status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [order_id, shop_id, name, customerClass, notes, total_amount, items_json, initial_status, payment_method]
        );

        notifyNewOrder({
            order_id, shop_id, customer_name: name, customer_class: customerClass, total_amount, items_json, payment_method
        });

        res.status(201).json({ 
            message: 'Pesanan berhasil dibuat', 
            order_code: order_id,
            status: initial_status
        });
    } catch (error) {
        console.error("Error storing order:", error.message);
        res.status(500).json({ message: 'Terjadi kesalahan server saat memproses pesanan.' });
    }
});

module.exports = router;