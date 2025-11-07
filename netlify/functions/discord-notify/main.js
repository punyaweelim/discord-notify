// netlify/functions/discord-notifier/main.js

require('dotenv').config(); 
const express = require('express');
const axios = require('axios');
const serverless = require('serverless-http'); // <<< Import serverless-http

const app = express();
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Middleware
app.use(express.json());

// ----------------------------------------------------
// ⚠️ หมายเหตุ: ไม่ต้องใช้ app.listen() อีกต่อไป
// ----------------------------------------------------

// ฟังก์ชันช่วยในการกำหนดสี Embed (เหมือนเดิม)
const getColor = (level) => {
    switch (level.toUpperCase()) {
        case 'ERROR': return 0xFF0000;
        // ... (โค้ด switch case เดิม)
        default: return 0x0000FF;
    }
};

// Webhook Receiver Endpoint (HTTP POST)
// Endpoint Path: /api/webhook/trigger (จะถูกเรียกเป็น /api/discord-notifier/webhook/trigger)
app.post('/webhook/trigger', async (req, res) => { // <<< เปลี่ยน Path เป็น /webhook/trigger
    
    // ... (Logic การประมวลผล Payload, ดึง message, severity, imageUrl เหมือนเดิม)
    const triggerPayload = req.body;
    const message = triggerPayload.message || '⚠️ แจ้งเตือนจากระบบ: ไม่ระบุข้อความ';
    const severity = triggerPayload.severity || 'INFO';
    const systemName = triggerPayload.system || 'Unknown System';
    const imageUrl = triggerPayload.imageUrl;

    // สร้าง Embed Object และ Payload เหมือนเดิม...
    const discordEmbed = {
        title: `[${systemName}] - System Status Alert`,
        description: message,
        color: getColor(severity),
        timestamp: new Date(),
        fields: [{ name: "Severity", value: severity, inline: true }],
        footer: { text: "Triggered by System Webhook" }
    };

    if (imageUrl) {
        discordEmbed.image = { url: imageUrl };
    }

    const discordPayload = {
        content: `🚨 **${severity.toUpperCase()} ALERT** - New Notification!`,
        embeds: [discordEmbed]
    };

    // ส่ง Payload ไปยัง Discord Webhook URL เหมือนเดิม...
    try {
        if (!DISCORD_WEBHOOK_URL) throw new Error("DISCORD_WEBHOOK_URL is missing.");

        await axios.post(DISCORD_WEBHOOK_URL, discordPayload, {
            headers: { 'Content-Type': 'application/json' }
        });

        res.status(200).send({ status: 'ok', message: 'Notification processed and sent.' });

    } catch (error) {
        console.error('❌ Failed to send message to Discord:', error.message);
        res.status(500).send({ status: 'error', message: 'Failed to send notification to Discord.' });
    }
});

// 3. Export Handler สำหรับ Netlify Functions
// Path ของ Netlify Function จะเป็น / .netlify/functions/discord-notifier/
// Path ของ Webhook ที่ใช้จริง: / .netlify/functions/discord-notifier/webhook/trigger
module.exports.handler = serverless(app);