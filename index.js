/**
 * Telegram Bot (Node.js) - Render.com uchun moslashtirilgan
 */

import { Telegraf, Markup } from 'telegraf';
import * as dotenv from 'dotenv';
import express from 'express'; // Render portni o'chib qolmasligi uchun kerak

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
// BU YERGA O'ZINGIZNING VERCEL SAYTINGIZ MANZILINI YOZING:
const webAppUrl = 'https://ramazon-taqvim-2026-9d69-forever21s-projects.vercel.app?_vercel_share=fszHJ9k1ekJD71PJLSK9hWiaeUOYwWGr'; 

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN topilmadi! Render Settings -> Environment Variables qismini tekshiring.');
}

const bot = new Telegraf(token);

// --- BOT BUYRUQLARI ---

// 1. Start buyrug'i
bot.start((ctx) => {
  ctx.reply(
    `Assalomu alaykum, ${ctx.from.first_name}!\n\n` +
    `🌙 Ramazon 2026 botiga xush kelibsiz. Bu yerda siz taqvim, duo va amallar trackeridan foydalanishingiz mumkin.`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🌙 Ilovani ochish', webAppUrl)],
      [Markup.button.callback('❓ Yordam', 'help_info')]
    ])
  );
});

// 2. Help (Yordam) buyrug'i
bot.help((ctx) => {
  ctx.reply(
    `📌 Botdan foydalanish bo'yicha qo'llanma:\n\n` +
    `1. "Ilovani ochish" tugmasini bosing - to'liq taqvim va tracker ochiladi.\n` +
    `2. /today - Bugungi saharlik va iftorlik vaqtini ko'rish.\n` +
    `3. /tasbih - Raqamli tasbehni ishlatish.\n\n` +
    `Savollaringiz bo'lsa, @anvar_sn ga murojaat qiling.`
  );
});

// 3. Bugungi vaqtlar
bot.command('today', (ctx) => {
  ctx.reply(
    `📅 Bugun: 27-Fevral\n` +
    `🌅 Saharlik: 05:42\n` +
    `🌇 Iftorlik: 18:35\n\n` +
    `Batafsil ma'lumot ilova ichida.`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🌙 To\'liq taqvim', webAppUrl)]
    ])
  );
});

// 4. Inline tugma bosilganda
bot.action('help_info', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('Ushbu bot Ramazon oyida sizga qulaylik yaratish uchun ishlab chiqilgan. Ilovani ochish orqali barcha imkoniyatlardan foydalaning.');
});

// --- RENDER UCHUN MUHIM QISM ---
// Render Web Service bo'lgani uchun portni tinglab turish shart, aks holda "Port timeout" xatosi beradi
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot ishlamoqda...');
});

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
});

// Botni ishga tushirish
bot.launch()
  .then(() => console.log('Bot 24/7 rejimda ishga tushdi...'))
  .catch((err) => console.error('Botni ishga tushirishda xato:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
