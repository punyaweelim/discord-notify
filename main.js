// server.js

// 1. นำเข้า Modules ที่จำเป็น
require('dotenv').config(); 
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Middleware: ให้ Express สามารถอ่าน JSON Payload ได้
app.use(express.json());

if (!DISCORD_WEBHOOK_URL) {
    console.error("FATAL ERROR: DISCORD_WEBHOOK_URL is not defined in .env");
    process.exit(1);
}

// Webhook Receiver Endpoint (HTTP POST)
app.post('/api/webhook/trigger', async (req, res) => {
    
    const triggerPayload = req.body;
    console.log('✅ Webhook received:', JSON.stringify(triggerPayload));

    // 2. ดึงข้อมูลที่จำเป็นรวมถึง URL รูปภาพ (New)
    const message = triggerPayload.message || '⚠️ แจ้งเตือนจากระบบ: ไม่ระบุข้อความ';
    const severity = triggerPayload.severity || 'INFO';
    const systemName = triggerPayload.system || 'Unknown System';
    const imageUrl = triggerPayload.imageUrl; // <<<<< ส่วนที่เพิ่ม: รับ URL รูปภาพ

    const getColor = (level) => {
        switch (level.toUpperCase()) {
            case 'ERROR': return 0xFF0000;
            case 'WARNING': return 0xFFA500;
            case 'CRITICAL': return 0x8B0000;
            case 'SUCCESS': return 0x00FF00;
            default: return 0x0000FF;
        }
    };

    // 3. สร้าง Embed Object
    const discordEmbed = {
        title: `[${systemName}] - System Status Alert`,
        description: message,
        color: getColor(severity),
        timestamp: new Date(),
        fields: [
            {
                name: "Severity",
                value: severity,
                inline: true
            }
        ],
        footer: {
            text: "Triggered by System Webhook"
        }
    };

    // 4. เพิ่มรูปภาพใน Embed หากมี URL รูปภาพอยู่ (New Logic)
    if (imageUrl) {
        discordEmbed.image = {
            url: imageUrl // กำหนด URL รูปภาพ
        };
        console.log(`🖼️ Image URL detected: ${imageUrl}`);
    }


    // 5. สร้าง Discord Message Payload
    const discordPayload = {
        content: `🚨 **${severity.toUpperCase()} ALERT** - New Notification!`,
        embeds: [discordEmbed] // ใช้ Object ที่สร้างและปรับปรุงแล้ว
    };

    // 6. ส่ง Payload ไปยัง Discord Webhook URL
    try {
        await axios.post(DISCORD_WEBHOOK_URL, discordPayload, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('🚀 Successfully sent message to Discord.');
        res.status(200).send({ status: 'ok', message: 'Notification processed and sent.' });

    } catch (error) {
        console.error('❌ Failed to send message to Discord:', error.response ? error.response.data : error.message);
        res.status(500).send({ status: 'error', message: 'Failed to send notification to Discord.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`📡 Webhook Listener running on http://localhost:${PORT}`);
    console.log(`   Waiting for POST requests to /api/webhook/trigger`);
});