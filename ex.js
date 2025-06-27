// ========== ex.js ==========
const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const path = require('path');
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

dotenv.config({ path: './.env' });

const app = express();

const db = mysql.createConnection({
  host: process.env.database_host,
  user: process.env.database_user,
  password: process.env.database_pass,
  database: process.env.database,
});

db.connect((err) => {
  if (err) console.error('DB Error:', err);
  else console.log('Database connected');
});

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views/partials'));

const checkAuth = (req, res, next) => {
  const token = req.cookies.guru;
  if (!token) {
    res.locals.isLoggedIn = false;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.locals.isLoggedIn = true;
    res.locals.user = decoded;
  } catch (err) {
    res.locals.isLoggedIn = false;
  }
  next();
};
app.use(checkAuth);

// Mail transporter for admin notification
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// Routes
app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/dashboard', (req, res) => {
  res.render('dashboard', {
    layout: 'dashlayout',
    title: 'Dashboard',
    isLoggedIn: res.locals.isLoggedIn,
    user: res.locals.user || null
  });
});

app.get('/login', (req, res) => {
  res.render('login', { layout: 'main', title: 'Login / Register' });
});

app.get('/portfolio', (req, res) => {
  if (!res.locals.user) return res.redirect('/login');
  res.render('portfolio', {
    layout: 'portfoliolayout',
    title: 'My Portfolio',
    isLoggedIn: true,
    user: res.locals.user
  });
});

app.get('/auth/user', (req, res) => {
  if (!res.locals.user) return res.redirect('/login');
  res.render('user', {
    layout: 'main',
    title: 'User Profile',
    email: res.locals.user.email,
    id: res.locals.user.id,
    username: res.locals.user.username,
    employee_id: res.locals.user.employee_id
  });
});

app.get('/auth/logout', (req, res) => {
  res.clearCookie('guru');
  res.redirect('/dashboard');
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).render('login', {
      loginError: 'All fields are required', layout: 'main'
    });
  }

  db.query("SELECT * FROM users_id WHERE Email = ?", [email], async (err, result) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).render('login', {
        loginError: 'Server error', layout: 'main'
      });
    }

    if (result.length === 0 || !(await bcrypt.compare(password, result[0].pass))) {
      return res.status(401).render('login', {
        loginError: 'Invalid email or password', layout: 'main'
      });
    }

    if (!result[0].approved) {
      return res.status(403).render('login', {
        loginError: 'Account pending admin approval.', layout: 'main'
      });
    }

    const userPayload = {
      id: result[0].id,
      email: result[0].Email,
      username: result[0].username || result[0].Email.split('@')[0],
      employee_id: result[0].employee_id || result[0].id
    };
    const token = jwt.sign(userPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.cookie("guru", token, {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
      httpOnly: true
    });
    res.redirect('/portfolio');
  });
});

// Register
app.post('/auth/register', async (req, res) => {
  const { email, password, confirm_password } = req.body;
  if (!email || !password || password !== confirm_password) {
    return res.status(400).render('login', {
      signupError: 'All fields required & passwords must match.', layout: 'main'
    });
  }

  db.query("SELECT Email FROM users_id WHERE Email = ?", [email], async (err, result) => {
    if (err) {
      console.error("Email check error:", err);
      return res.status(500).render('login', {
        signupError: 'Server error while checking email', layout: 'main'
      });
    }

    if (result.length > 0) {
      return res.status(400).render('login', {
        signupError: 'Email already exists', layout: 'main'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const token = crypto.randomBytes(32).toString('hex');

    db.query("INSERT INTO users_id (Email, pass, approved, approval_token) VALUES (?, ?, false, ?)",
      [email, hashedPassword, token],
      async (err2, result2) => {
        if (err2) {
          console.error("Insert error:", err2);
          return res.status(500).render('login', {
            signupError: 'Registration failed', layout: 'main'
          });
        }

        const approveLink = `http://localhost:5000/auth/approve?id=${result2.insertId}&token=${token}`;
        const rejectLink = `http://localhost:5000/auth/reject?id=${result2.insertId}&token=${token}`;

        await transporter.sendMail({
          from: process.env.ADMIN_EMAIL,
          to: process.env.ADMIN_EMAIL,
          subject: "New User Signup - Approve or Reject",
          html: `<p>A new user signed up with email: <b>${email}</b></p>
                 <p><a href="${approveLink}">✅ Approve</a> | <a href="${rejectLink}">❌ Reject</a></p>`
        });

        res.render('login', {
          loginSuccess: 'Registered! Awaiting admin approval.', layout: 'main'
        });
      });
  });
});

// Approve route
app.get('/auth/approve', (req, res) => {
  const { id, token } = req.query;
  db.query("SELECT * FROM users_id WHERE id = ? AND approval_token = ?", [id, token], (err, results) => {
    if (err || results.length === 0) {
      return res.send("❌ Invalid or expired token.");
    }
    db.query("UPDATE users_id SET approved = 1, approval_token = NULL WHERE id = ?", [id], (err2) => {
      if (err2) return res.send("⚠️ Error approving user.");
      res.send("✅ User approved successfully.");
    });
  });
});

// Reject route
app.get('/auth/reject', (req, res) => {
  const { id, token } = req.query;
  db.query("SELECT * FROM users_id WHERE id = ? AND approval_token = ?", [id, token], (err, results) => {
    if (err || results.length === 0) {
      return res.send("❌ Invalid or expired token.");
    }
    db.query("DELETE FROM users_id WHERE id = ?", [id], (err2) => {
      if (err2) return res.send("⚠️ Error rejecting user.");
      res.send("❌ User rejected and deleted.");
    });
  });
});

app.listen(5000, () => console.log("Server running at http://localhost:5000"));
