import { Telegraf, Markup } from 'telegraf';
import * as dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = 'https://ramazon-taqvim-2026-9d69-forever21s-projects.vercel.app'; 
const adminUsername = 'anvar_sn';

if (!token) throw new Error('TELEGRAM_BOT_TOKEN topilmadi!');

const bot = new Telegraf(token);

// --- FAQAT 3 TA ASOSIY TUGMA ---
const mainMenu = Markup.keyboard([
  ['🌙 Ilovani ochish'],
  ['🤲 Duolar', '📿 Tasbeh']
]).resize();

// --- ZIKRLAR RO'YXATI ---
const zikrlar = ["Subhanalloh", "Alhamdulillah", "Allohu Akbar", "La ilaha illalloh"];

// 1. Start buyrug'i
bot.start((ctx) => {
  ctx.reply(
    `Assalomu alaykum, ${ctx.from.first_name}!\n\n` +
    `🌙 Ramazon 2026 botiga xush kelibsiz. Kerakli bo'limni tanlang:`,
    mainMenu
  );
});

// 2. Duolar bo'limi
bot.hears('🤲 Duolar', (ctx) => {
  ctx.reply(
    `✨ **Ramazon duolari**\n\n` +
    `☀️ **Saharlik duosi:**\n*Navaytu an asuma sovma shahri ramazona minal fajri ilal mag'ribi, xolisan lillahi ta'ala.*\n\n` +
    `🌙 **Iftorlik duosi:**\n*Allohumma laka sumtu va bika amantu va a'layka tavakkaltu va a'la rizqika aftartu...*`,
    { parse_mode: 'Markdown' }
  );
});

// 3. Tasbeh funksiyasi
bot.hears('📿 Tasbeh', (ctx) => {
  const buttons = zikrlar.map(zikr => [Markup.button.callback(zikr, `zikr_${zikr}`)]);
  ctx.reply(`Zikr turini tanlang:`, Markup.inlineKeyboard(buttons));
});

let counts = {}; 
bot.action(/zikr_(.+)/, (ctx) => {
  const zikr = ctx.match[1];
  const userId = ctx.from.id;
  const key = `${userId}_${zikr}`;
  
  counts[key] = (counts[key] || 0) + 1;
  
  ctx.editMessageText(
    `Zikr: ${zikr}\nSoni: ${counts[key]}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('Bosish 👆', `zikr_${zikr}`)],
      [Markup.button.callback('🔄 Nolga tushirish', `reset_${zikr}`)],
      [Markup.button.callback('⬅️ Orqaga', 'back_to_tasbeh')]
    ])
  );
});

bot.action(/reset_(.+)/, (ctx) => {
  const zikr = ctx.match[1];
  counts[`${ctx.from.id}_${zikr}`] = 0;
  ctx.answerCbQuery('Nolga tushirildi');
  ctx.editMessageText(`Zikr: ${zikr}\nSoni: 0`, 
    Markup.inlineKeyboard([[Markup.button.callback('Bosish 👆', `zikr_${zikr}`)]]));
});

bot.action('back_to_tasbeh', (ctx) => {
  const buttons = zikrlar.map(zikr => [Markup.button.callback(zikr, `zikr_${zikr}`)]);
  ctx.editMessageText(`Zikr turini tanlang:`, Markup.inlineKeyboard(buttons));
});

// 4. Ilovani ochish
bot.hears('🌙 Ilovani ochish', (ctx) => {
  ctx.reply('Ilovani ochish uchun pastdagi tugmani bosing:', 
    Markup.inlineKeyboard([[Markup.button.webApp('🌙 Ilovani ochish', webAppUrl)]]));
});

// Render uchun Express (uyg'oq tutish uchun)
const app = express();
app.get('/', (req, res) => res.send('Bot running...'));
app.listen(process.env.PORT || 3000);

bot.launch().then(() => console.log('Bot eng sodda rejimda ishga tushdi...'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
