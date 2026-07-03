const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const db = new sqlite3.Database("database.db");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      full_name TEXT,
      title TEXT,
      about TEXT,
      skills TEXT,
      projects TEXT,
      github TEXT,
      linkedin TEXT,
      photo TEXT,
      theme TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      published INTEGER DEFAULT 1
    )
  `);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  db.run(
    "INSERT INTO users(name,email,password) VALUES(?,?,?)",
    [name, email, password],
    function (err) {
      if (err) {
        return res.json({
          success: false,
          message: "Email already exists",
        });
      }

      res.json({
        success: true,
        userId: this.lastID,
      });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email, password],
    (err, user) => {
      if (!user) {
        return res.json({
          success: false,
          message: "Invalid email or password",
        });
      }

      res.json({
        success: true,
        user,
      });
    }
  );
});

app.post("/api/portfolio", upload.single("photo"), (req, res) => {
  const {
    user_id,
    full_name,
    title,
    about,
    skills,
    projects,
    github,
    linkedin,
    theme,
  } = req.body;

  const photo = req.file ? "/uploads/" + req.file.filename : "";

  db.run(
    `INSERT INTO portfolios 
    (user_id, full_name, title, about, skills, projects, github, linkedin, photo, theme)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      full_name,
      title,
      about,
      skills,
      projects,
      github,
      linkedin,
      photo,
      theme,
    ],
    function (err) {
      if (err) {
        return res.json({
          success: false,
          message: "Portfolio not saved",
        });
      }

      res.json({
        success: true,
        portfolioId: this.lastID,
      });
    }
  );
});

app.get("/api/gallery", (req, res) => {
  db.all(
    "SELECT * FROM portfolios WHERE published=1 ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) return res.json([]);
      res.json(rows);
    }
  );
});

app.get("/api/search", (req, res) => {
  const q = `%${req.query.q}%`;

  db.all(
    `SELECT * FROM portfolios 
     WHERE full_name LIKE ? 
     OR title LIKE ? 
     OR skills LIKE ? 
     ORDER BY id DESC`,
    [q, q, q],
    (err, rows) => {
      if (err) return res.json([]);
      res.json(rows);
    }
  );
});

app.get("/api/portfolio/:id", (req, res) => {
  const id = req.params.id;

  db.run("UPDATE portfolios SET views = views + 1 WHERE id=?", [id]);

  db.get("SELECT * FROM portfolios WHERE id=?", [id], (err, row) => {
    if (!row) {
      return res.json({
        success: false,
        message: "Portfolio not found",
      });
    }

    res.json(row);
  });
});

app.post("/api/portfolio/:id/like", (req, res) => {
  const id = req.params.id;

  db.run("UPDATE portfolios SET likes = likes + 1 WHERE id=?", [id], function (err) {
    if (err) {
      return res.json({
        success: false,
        message: "Like failed",
      });
    }

    res.json({
      success: true,
      message: "Liked successfully",
    });
  });
});

app.get("/api/dashboard/:userId", (req, res) => {
  const userId = req.params.userId;

  db.all("SELECT * FROM portfolios WHERE user_id=?", [userId], (err, portfolios) => {
    if (err) return res.json({ success: false });

    const totalPortfolios = portfolios.length;
    const totalViews = portfolios.reduce((sum, p) => sum + p.views, 0);
    const totalLikes = portfolios.reduce((sum, p) => sum + p.likes, 0);

    res.json({
      success: true,
      totalPortfolios,
      totalViews,
      totalLikes,
      portfolios,
    });
  });
});

app.delete("/api/portfolio/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM portfolios WHERE id=?", [id], function (err) {
    if (err) {
      return res.json({
        success: false,
        message: "Delete failed",
      });
    }

    res.json({
      success: true,
      message: "Portfolio deleted",
    });
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});