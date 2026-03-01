import { Telegraf, Markup } from 'telegraf';
import * as dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = 'https://ramazon-taqvim-2026-9d69-forever21s-projects.vercel.app';
const adminUsername = 'anvar_sn';

if (!token) throw new Error('TELEGRAM_BOT_TOKEN topilmadi!');

const bot = new Telegraf(token);

// ================== ASOSIY MENU ==================
const mainMenu = Markup.keyboard([
  ['🌙 Ilovani ochish'],
  ['🤲 Duolar', '📿 Tasbeh'],
  ['👨‍💻 Admin bilan bog‘lanish']
]).resize();

// ================== ZIKRLAR ==================
const zikrlar = [
  "Subhanalloh",
  "Alhamdulillah",
  "Allohu Akbar",
  "La ilaha illalloh"
];

let counts = {};

// ================== START ==================
bot.start((ctx) => {
  ctx.reply(
    `Assalomu alaykum, ${ctx.from.first_name}!\n\n` +
    `🌙 Ramazon 2026 botiga xush kelibsiz.\nKerakli bo‘limni tanlang:`,
    mainMenu
  );
});

// ================== DUOLAR ==================
bot.hears('🤲 Duolar', (ctx) => {
  ctx.reply(
    `✨ Ramazon duolari\n\n` +
    `☀️ Saharlik duosi:\n` +
    `Navaytu an asuvma sovma shahri Ramazona minal fajri ilal maghribi, xolisan lillahi ta'aalaa. Allohu akbar.\n\n` +
    `🌙 Iftorlik duosi:\n` +
    `Allohumma laka sumtu va bika aamantu va 'alayka tavakkaltu va 'alaa rizqika aftortu, fag'firliy yaa G'offaru maa qoddamtu va maa axxortu. Birohmatika yaa arhamar rohimiyin`
  );
});

// ================== TASBEH ==================
bot.hears('📿 Tasbeh', (ctx) => {
  const buttons = zikrlar.map(zikr =>
    [Markup.button.callback(zikr, `zikr_${zikr}`)]
  );
  ctx.reply(`Zikr turini tanlang:`, Markup.inlineKeyboard(buttons));
});

// Zikr bosish
bot.action(/zikr_(.+)/, (ctx) => {
  const zikr = ctx.match[1];
  const userId = ctx.from.id;
  const key = `${userId}_${zikr}`;

  counts[key] = (counts[key] || 0) + 1;

  ctx.editMessageText(
    `📿 Zikr: ${zikr}\n🔢 Soni: ${counts[key]}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('Bosish 👆', `zikr_${zikr}`)],
      [Markup.button.callback('🔄 Nolga tushirish', `reset_${zikr}`)],
      [Markup.button.callback('⬅️ Orqaga', 'back_to_tasbeh')]
    ])
  );
});

// Reset
bot.action(/reset_(.+)/, (ctx) => {
  const zikr = ctx.match[1];
  const key = `${ctx.from.id}_${zikr}`;
  counts[key] = 0;

  ctx.answerCbQuery('Nolga tushirildi');

  ctx.editMessageText(
    `📿 Zikr: ${zikr}\n🔢 Soni: 0`,
    Markup.inlineKeyboard([
      [Markup.button.callback('Bosish 👆', `zikr_${zikr}`)],
      [Markup.button.callback('🔄 Nolga tushirish', `reset_${zikr}`)],
      [Markup.button.callback('⬅️ Orqaga', 'back_to_tasbeh')]
    ])
  );
});

// Orqaga
bot.action('back_to_tasbeh', (ctx) => {
  const buttons = zikrlar.map(zikr =>
    [Markup.button.callback(zikr, `zikr_${zikr}`)]
  );
  ctx.editMessageText(`Zikr turini tanlang:`, Markup.inlineKeyboard(buttons));
});

// ================== WEB APP ==================
bot.hears('🌙 Ilovani ochish', (ctx) => {
  ctx.reply(
    'Ilovani ochish uchun pastdagi tugmani bosing:',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🌙 Ilovani ochish', webAppUrl)]
    ])
  );
});

// ================== ADMIN BILAN BOG‘LANISH ==================
bot.hears('👨‍💻 Admin bilan bog‘lanish', (ctx) => {
  ctx.reply(
    `📩 Taklif yoki muammo bormi?\n\n` +
    `Admin bilan bog‘lanish:\n` +
    `👉 https://t.me/${adminUsername}`
  );
});

// ================== EXPRESS (Render uchun) ==================
const app = express();

app.get('/', (req, res) => {
  res.send('Bot running...');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Express server ishga tushdi...');
});

// ================== BOTNI ISHGA TUSHIRISH ==================
bot.launch().then(() => {
  console.log('Bot muvaffaqiyatli ishga tushdi...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
