import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

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
    console.log("Registering user:", req.body);
    const { id, first_name, last_name, username, photo_url } = req.body;
    if (!id) {
      console.error("Registration failed: Missing ID");
      return res.status(400).json({ error: "Missing ID" });
    }

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

    stmt.run(id.toString(), first_name, last_name, username, photo_url);
    
    // Broadcast update to all clients
    const updatedUsers = db.prepare("SELECT * FROM users ORDER BY last_seen DESC LIMIT 50").all();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "USERS_UPDATE", data: updatedUsers }));
      }
    });

    res.json({ success: true });
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
