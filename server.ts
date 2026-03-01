import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { Telegraf, Markup } from 'telegraf';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "community.db"));

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    telegram_id TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    photo_url TEXT,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// --- Telegram Bot Logic ---
const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'https://ramazon-taqvim-2026-9d69-forever21s-projects.vercel.app';
const adminUsername = 'anvar_sn';

if (token) {
  const bot = new Telegraf(token);

  // ================== ASOSIY MENU ==================
  const mainMenu = Markup.keyboard([
    ['🌙 Ilovani ochish'],
    ['🤲 Duolar', '📿 Tasbeh'],
    ['👨💻 Admin bilan bog‘lanish']
  ]).resize();

  // ================== ZIKRLAR ==================
  const zikrlar = [
    "Subhanalloh",
    "Alhamdulillah",
    "Allohu Akbar",
    "La ilaha illalloh",
    "Astaghfirulloh"
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
  bot.hears('👨💻 Admin bilan bog‘lanish', (ctx) => {
    ctx.reply(
      `📩 Taklif yoki muammo bormi?\n\n` +
      `Admin bilan bog‘lanish:\n` +
      `👉 https://t.me/${adminUsername}`
    );
  });

  bot.action('help_info', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('Ushbu bot Ramazon oyida sizga qulaylik yaratish uchun ishlab chiqilgan. Ilovani ochish orqali barcha imkoniyatlardan foydalaning.');
  });

  bot.launch().then(() => {
    console.log('Bot muvaffaqiyatli ishga tushdi...');
  }).catch(err => console.error("Bot launch error:", err));
} else {
  console.warn("TELEGRAM_BOT_TOKEN topilmadi, bot ishga tushmadi.");
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // API Routes
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users ORDER BY last_seen DESC LIMIT 50").all();
    res.json(users);
  });

  app.post("/api/register", (req, res) => {
    console.log("Registering user request body:", req.body);
    const { id, first_name, last_name, username, photo_url } = req.body;
    
    // Telegram user object has 'id', but we store it as 'telegram_id'
    if (!id) {
      console.error("Registration failed: Missing ID in request body");
      return res.status(400).json({ error: "Missing ID" });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO users (telegram_id, first_name, last_name, username, photo_url, last_seen)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(telegram_id) DO UPDATE SET
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          username = excluded.username,
          photo_url = excluded.photo_url,
          last_seen = CURRENT_TIMESTAMP
      `);

      stmt.run(id.toString(), first_name || "", last_name || "", username || "", photo_url || "");
      
      // Broadcast update to all clients
      const updatedUsers = db.prepare("SELECT * FROM users ORDER BY last_seen DESC LIMIT 50").all();
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "USERS_UPDATE", data: updatedUsers }));
        }
      });

      console.log(`User ${id} registered successfully.`);
      res.json({ success: true });
    } catch (error) {
      console.error("Database error during registration:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = process.env.PORT || 3000;
  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
