const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";
const DATA_FILE = path.join(__dirname, "data", "keys.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function loadKeys() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return []; }
}
function saveKeys(keys) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(keys, null, 2));
}
function hashKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}
function makeKey() {
  return "KEY-" + crypto.randomBytes(12).toString("hex").toUpperCase();
}
function adminAuth(req, res, next) {
  if (req.headers["x-admin-password"] !== ADMIN_PASSWORD)
    return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.post("/api/login", (req, res) => {
  const { key } = req.body || {};
  if (!key) return res.status(400).json({ error: "Key required" });

  const item = loadKeys().find(x => x.keyHash === hashKey(key));
  if (!item) return res.status(401).json({ error: "Invalid key" });
  if (item.revoked) return res.status(403).json({ error: "Key revoked" });
  if (item.expiresAt && Date.now() > item.expiresAt)
    return res.status(403).json({ error: "Key expired" });

  res.json({ ok: true, message: "Login successful", expiresAt: item.expiresAt });
});

app.get("/api/keys", adminAuth, (req, res) => {
  res.json(loadKeys().map(({keyHash, ...safe}) => safe));
});

app.post("/api/keys", adminAuth, (req, res) => {
  const days = Math.max(1, Math.min(3650, Number(req.body?.days || 30)));
  const key = makeKey();
  const keys = loadKeys();
  keys.push({
    id: crypto.randomUUID(),
    keyHash: hashKey(key),
    createdAt: Date.now(),
    expiresAt: Date.now() + days * 86400000,
    revoked: false
  });
  saveKeys(keys);
  res.json({ ok: true, key, days });
});

app.delete("/api/keys/:id", adminAuth, (req, res) => {
  const keys = loadKeys();
  const item = keys.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  item.revoked = true;
  saveKeys(keys);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Key panel running on http://localhost:${PORT}`));
