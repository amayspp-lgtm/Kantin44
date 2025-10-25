// utils.js

const mysql = require('mysql2/promise');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID_KANTIN = process.env.CHAT_ID_KANTIN; // Untuk notifikasi pesanan utama

// Inisialisasi Bot tanpa Polling (untuk mode Webhook/Serverless)
const bot = new TelegramBot(BOT_TOKEN);

// Membuat Pool Koneksi MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: processs.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, 
    queueLimit: 0
});

const generateOrderCode = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `KTS-${randomNum}`;
};

/**
 * UTILITY: Mengirim notifikasi pesanan baru ke Telegram Toko pemilik
 * Diperlukan penambahan kolom telegram_chat_id di tabel shops!
 */
async function notifyNewOrder(order) {
    const items = JSON.parse(order.items_json);
    let itemsDetail = items.map(item => `- ${item.name} (${item.quantity}x)`).join('\n');
    
    // 1. Ambil Chat ID Pemilik Toko
    const [shopRows] = await pool.execute("SELECT name, telegram_chat_id FROM shops WHERE id = ?", [order.shop_id]);
    const targetChatId = shopRows[0]?.telegram_chat_id || CHAT_ID_KANTIN; // Fallback ke CHAT_ID_KANTIN umum

    const message = (
        `🔔 **PESANAN BARU!** 🔔 | Toko: ${shopRows[0]?.name}\n\n`
        + `**Kode:** \`${order.order_id}\`\n`
        + `**Pembayaran:** ${order.payment_method}\n`
        + `**Siswa:** ${order.customer_name} (${order.customer_class})\n`
        + `**Total:** Rp ${order.total_amount.toLocaleString('id-ID')}\n\n`
        + `**Detail Pesanan:**\n${itemsDetail}`
    );

    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ Diproses', callback_data: `process_${order.order_id}` }],
                [{ text: '❌ Batalkan', callback_data: `cancel_${order.order_id}` }]
            ]
        }
    };
    
    try {
        await bot.sendMessage(targetChatId, message, options);
    } catch (e) {
        console.error(`Gagal mengirim notifikasi ke ${targetChatId}: ${e.message}`);
    }
}


module.exports = {
    pool,
    bot,
    generateOrderCode,
    notifyNewOrder,
    CHAT_ID_KANTIN
};