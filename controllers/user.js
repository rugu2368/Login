// controllers/user.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('../db');
require('dotenv').config();

// Mail setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

// Helper to create JWT\const createToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).render('login', {
      loginError: 'All fields are required',
      layout: 'main',
    });
  }

  db.query('SELECT * FROM users_id WHERE Email = ?', [email], async (err, result) => {
    if (err || result.length === 0 || !(await bcrypt.compare(password, result[0].pass))) {
      return res.status(401).render('login', {
        loginError: 'Invalid email or password',
        layout: 'main',
      });
    }

    if (!result[0].approved) {
      return res.status(403).render('login', {
        loginError: 'Account pending admin approval.',
        layout: 'main',
      });
    }

    const userPayload = {
      id: result[0].id,
      email: result[0].Email,
      username: result[0].username || result[0].Email.split('@')[0],
      employee_id: result[0].employee_id || result[0].id,
    };

    const token = createToken(userPayload);

    res.cookie('guru', token, {
      httpOnly: true,
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    });

    res.redirect('/portfolio');
  });
};

exports.register = async (req, res) => {
  const { email, password, confirm_password } = req.body;

  if (!email || !password || password !== confirm_password) {
    return res.status(400).render('login', {
      signupError: 'All fields required & passwords must match.',
      layout: 'main',
    });
  }

  db.query('SELECT Email FROM users_id WHERE Email = ?', [email], async (err, result) => {
    if (err || result.length > 0) {
      return res.status(400).render('login', {
        signupError: 'Email already exists or server error',
        layout: 'main',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const token = crypto.randomBytes(32).toString('hex');

    db.query(
      'INSERT INTO users_id (Email, pass, approved, approval_token) VALUES (?, ?, false, ?)',
      [email, hashedPassword, token],
      async (err2, result2) => {
        if (err2) {
          return res.status(500).render('login', {
            signupError: 'Registration failed',
            layout: 'main',
          });
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const approveLink = `${baseUrl}/auth/approve?id=${result2.insertId}&token=${token}`;
        const rejectLink = `${baseUrl}/auth/reject?id=${result2.insertId}&token=${token}`;

        await transporter.sendMail({
          from: process.env.ADMIN_EMAIL,
          to: process.env.ADMIN_EMAIL,
          subject: 'New User Signup - Approve or Reject',
          html: `<p>New user signed up: <b>${email}</b></p>
                 <p><a href="${approveLink}">✅ Approve</a> | <a href="${rejectLink}">❌ Reject</a></p>`,
        });

        res.render('login', {
          loginSuccess: 'Registered! Awaiting admin approval.',
          layout: 'main',
        });
      }
    );
  });
};

exports.logout = (req, res) => {
  res.clearCookie('guru');
  res.redirect('/dashboard');
};

exports.getUserPage = (req, res) => {
  const token = req.cookies.guru;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.render('user', {
      layout: 'main',
      title: 'User Profile',
      email: decoded.email,
      id: decoded.id,
      username: decoded.username,
      employee_id: decoded.employee_id,
    });
  } catch {
    res.redirect('/login');
  }
};

exports.approveUser = (req, res) => {
  const { id, token } = req.query;
  db.query('SELECT * FROM users_id WHERE id = ? AND approval_token = ?', [id, token], (err, results) => {
    if (err || results.length === 0) {
      return res.send('❌ Invalid or expired token.');
    }

    db.query('UPDATE users_id SET approved = 1, approval_token = NULL WHERE id = ?', [id], (err2) => {
      if (err2) return res.send('⚠️ Error approving user.');
      res.send('✅ User approved successfully.');
    });
  });
};

exports.rejectUser = (req, res) => {
  const { id, token } = req.query;
  db.query('SELECT * FROM users_id WHERE id = ? AND approval_token = ?', [id, token], (err, results) => {
    if (err || results.length === 0) {
      return res.send('❌ Invalid or expired token.');
    }

    db.query('DELETE FROM users_id WHERE id = ?', [id], (err2) => {
      if (err2) return res.send('⚠️ Error rejecting user.');
      res.send('❌ User rejected and deleted.');
    });
  });
};
