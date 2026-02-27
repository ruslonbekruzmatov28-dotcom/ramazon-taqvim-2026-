/**
 * Telegram Bot (Node.js) - Ramazon 2026 uchun kengaytirilgan
 */

import { Telegraf, Markup } from 'telegraf';
import * as dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = 'https://ramazon-taqvim-2026-9d69-forever21s-projects.vercel.app?_vercel_share=fszHJ9k1ekJD71PJLSK9hWiaeUOYwWGr'; 
const adminUsername = 'anvar_sn'; // Sizning profilingiz

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN topilmadi!');
}

const bot = new Telegraf(token);

// --- ASOSIY MENYU ---
const mainMenu = Markup.keyboard([
  ['🌙 Ilovani ochish'],
  ['🤲 Duolar', '📅 Bugun'],
  ['📿 Tasbeh', '❓ Yordam']
]).resize();

// 1. Start buyrug'i
bot.start((ctx) => {
  ctx.reply(
    `Assalomu alaykum, ${ctx.from.first_name}!\n\n` +
    `🌙 Ramazon 2026 botiga xush kelibsiz. Quyidagi menyudan foydalaning:`,
    mainMenu
  );
});

// 2. Duolar bo'limi
bot.hears('🤲 Duolar', (ctx) => {
  ctx.reply(
    `✨ **Ramazon duolari**\n\n` +
    `☀️ **Saharlik (Og'iz yopish) duosi:**\n` +
    `*Navaytu an asuma sovma shahri ramazona minal fajri ilal mag'ribi, xolisan lillahi ta'ala. Allohu akbar.*\n\n` +
    `🌙 **Iftorlik (Og'iz ochish) duosi:**\n` +
    `*Allohumma laka sumtu va bika amantu va a'layka tavakkaltu va a'la rizqika aftartu, fag'firli ma qoddamtu va ma axxortu birohmatika ya arhamar rohimiyn.*`,
    { parse_mode: 'Markdown' }
  );
});

// 3. Tasbeh funksiyasi
bot.hears('📿 Tasbeh', (ctx) => {
  ctx.reply(
    `Zikr qilishni boshlang:\n(Har bir bosishda hisoblanadi)`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📿 Subhanalloh (0)', 'count_1')],
      [Markup.button.callback('🔄 Nolga tushirish', 'reset_count')]
    ])
  );
});

let counter = 0;
bot.action(/count_(\d+)/, (ctx) => {
  counter++;
  ctx.editMessageText(
    `Zikr qilishni boshlang:\n(Har bir bosishda hisoblanadi)`,
    Markup.inlineKeyboard([
      [Markup.button.callback(`📿 Subhanalloh (${counter})`, 'count_1')],
      [Markup.button.callback('🔄 Nolga tushirish', 'reset_count')]
    ])
  );
});

bot.action('reset_count', (ctx) => {
  counter = 0;
  ctx.editMessageText(`Hisoblagich nolga tushirildi.`, 
    Markup.inlineKeyboard([[Markup.button.callback('📿 Qaytadan boshlash', 'count_1')]]));
});

// 4. Bugun (Kengaytirilgan)
bot.hears('📅 Bugun', (ctx) => {
  ctx.reply(
    `📅 Bugun: 27-Fevral\n` +
    `🌅 Saharlik: 05:42\n` +
    `🌇 Iftorlik: 18:35\n\n` +
    `Qolgan vaqtlarni ilovada ko'ring.`,
    Markup.inlineKeyboard([[Markup.button.webApp('🌙 To\'liq taqvim', webAppUrl)]])
  );
});

// 5. Yordam va Admin bog'lanish
bot.hears('❓ Yordam', (ctx) => {
  ctx.reply(
    `📌 Bot qo'llanmasi:\n` +
    `- Ilovani ochish orqali to'liq trackerga kirasiz.\n` +
    `- /today orqali vaqtlarni bilasiz.\n\n` +
    `Savollar uchun adminga yozing: @${adminUsername}`,
    Markup.inlineKeyboard([[Markup.button.url('👨‍💻 Admin bilan bog\'lanish', `https://t.me/${adminUsername}`)]])
  );
});

// Ilovani ochish matnli tugmasi uchun
bot.hears('🌙 Ilovani ochish', (ctx) => {
  ctx.reply('Ilovani pastdagi tugma orqali ochishingiz mumkin:', 
    Markup.inlineKeyboard([[Markup.button.webApp('🌙 Ilovani ochish', webAppUrl)]]));
});

// --- RENDER PORTINI TINGLASH ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot ishlamoqda...'));
app.listen(PORT, () => console.log(`Server ${PORT}-portda ishga tushdi`));

// Botni ishga tushirish
bot.launch()
  .then(() => console.log('Bot 24/7 rejimda ishga tushdi...'))
  .catch((err) => console.error('Botni ishga tushirishda xato:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
