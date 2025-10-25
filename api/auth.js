// api/auth.js

const express = require('express');
const { pool } = require('../utils');
const bcrypt = require('bcrypt'); 

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const [rows] = await pool.execute(
            "SELECT id, owner_password_hash FROM shops WHERE owner_username = ?", 
            [username]
        );

        if (rows.length > 0) {
            const shop = rows[0];
            // Bandingkan password yang dimasukkan dengan hash di DB
            const isMatch = await bcrypt.compare(password, shop.owner_password_hash);

            if (isMatch) {
                // Berhasil login
                // Dalam sistem nyata, di sini Anda akan mengembalikan JWT atau Session ID
                return res.json({ success: true, shop_id: shop.id, message: "Login berhasil!" });
            }
        }

        res.status(401).json({ success: false, message: 'Username atau password salah.' });
        
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({ message: 'Terjadi kesalahan server saat login.' });
    }
});

module.exports = router;