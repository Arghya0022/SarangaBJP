require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const multer = require("multer");

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage
});

const port = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET || 'development-secret-change-me';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : null;

const memory = {
  applications: [],
  members: [],
  leaders: [{
    id: 1,
    full_name: 'Saranga BJP Paribar',
    designation: 'Local Leadership Team',
    bio: 'Dedicated karyakartas working for Saranga with organization, service, and booth-level coordination.',
    image_url: '/assets/leader-placeholder.svg'
  }],
  updates: [{
    id: 1,
    title: 'Membership drive open',
    body: 'Saranga BJP Paribar is accepting new membership applications. Submit your details and the admin team will review your application.',
    category: 'Membership',
    event_date: new Date().toISOString().slice(0, 10),
    image_url: '/assets/update-placeholder.svg'
  }],
  gallery: [{
    id: 1,
    title: 'Community outreach',
    image_url: '/assets/gallery-placeholder.svg',
    caption: 'Add real event photos from the admin panel.'
  }]
};

async function initDb() {
  if (!pool) return;
  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret).update(value).digest('hex');
}

function createToken() {
  const payload = JSON.stringify({ role: 'admin', exp: Date.now() + 1000 * 60 * 60 * 12 });
  const body = Buffer.from(payload).toString('base64url');
  return `${body}.${sign(body)}`;
}

function readToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  if (signature !== sign(body)) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  return payload.exp > Date.now() ? payload : null;
}

function requireAdmin(req, res, next) {
  if (!readToken(req.cookies.admin_token)) {
    return res.status(401).json({ error: 'Admin login required' });
  }
  next();
}

function clean(input) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [
    key,
    typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value
  ]));
}

function validateRequired(body, fields) {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }
}

async function query(sql, params = []) {
  if (!pool) throw new Error('PostgreSQL is not configured');
  const { rows } = await pool.query(sql, params);
  return rows;
}

app.get('/api/site', async (req, res, next) => {
  try {
    const data = {
      contact: {
        phone: process.env.CONTACT_PHONE || '+91 00000 00000',
        email: process.env.CONTACT_EMAIL || 'sarangabjp@example.com',
        address: process.env.OFFICE_ADDRESS || 'Saranga, Bankura, West Bengal'
      },
      donation: {
        upiId: process.env.DONATION_UPI_ID || 'sarangabjp@exampleupi',
        qrImage: process.env.DONATION_QR_IMAGE || '/assets/donation-qr-placeholder.svg'
      },
      leaders: pool
        ? await query('SELECT * FROM leaders ORDER BY sort_order ASC, id DESC')
        : memory.leaders,
      updates: pool
        ? await query('SELECT * FROM updates WHERE is_published = TRUE ORDER BY COALESCE(event_date, created_at::date) DESC, id DESC LIMIT 12')
        : memory.updates,
      gallery: pool
        ? await query('SELECT * FROM gallery_items ORDER BY sort_order ASC, id DESC LIMIT 24')
        : memory.gallery,
      members: pool
        ? await query('SELECT * FROM members ORDER BY is_featured DESC, id DESC LIMIT 24')
        : memory.members
    };
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.post('/api/membership', async (req, res, next) => {
  try {
    const body = clean(req.body);
    validateRequired(body, ['full_name', 'phone', 'address']);

    if (pool) {
      const rows = await query(
        `INSERT INTO membership_applications
        (full_name, father_or_spouse, phone, email, address, village_or_ward, booth_no, age, profession, designation_requested, image_url, message)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING id, status, created_at`,
        [
          body.full_name,
          body.father_or_spouse || null,
          body.phone,
          body.email || null,
          body.address,
          body.village_or_ward || null,
          body.booth_no || null,
          body.age || null,
          body.profession || null,
          body.designation_requested || null,
          body.image_url || null,
          body.message || null
        ]
      );
      return res.status(201).json(rows[0]);
    }

    const application = { id: memory.applications.length + 1, ...body, status: 'pending', created_at: new Date().toISOString() };
    memory.applications.push(application);
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/login', async (req, res, next) => {
  try {
    const password = req.body.password || '';
    const ok = adminPassword.startsWith('$2')
      ? await bcrypt.compare(password, adminPassword)
      : crypto.timingSafeEqual(Buffer.from(password.padEnd(adminPassword.length)), Buffer.from(adminPassword.padEnd(password.length)));

    if (!ok) return res.status(401).json({ error: 'Invalid password' });
    res.cookie('admin_token', createToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 12
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

app.get('/api/admin/dashboard', requireAdmin, async (req, res, next) => {
  try {
    if (pool) {
      const [applications, members, leaders, updates, gallery] = await Promise.all([
        query('SELECT * FROM membership_applications ORDER BY created_at DESC LIMIT 100'),
        query('SELECT * FROM members ORDER BY is_featured DESC, id DESC LIMIT 100'),
        query('SELECT * FROM leaders ORDER BY sort_order ASC, id DESC'),
        query('SELECT * FROM updates ORDER BY created_at DESC LIMIT 100'),
        query('SELECT * FROM gallery_items ORDER BY sort_order ASC, id DESC LIMIT 100')
      ]);
      return res.json({ applications, members, leaders, updates, gallery });
    }
    res.json({ applications: memory.applications, members: memory.members, leaders: memory.leaders, updates: memory.updates, gallery: memory.gallery });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/applications/:id', requireAdmin, async (req, res, next) => {
  try {
    const { status, designation } = clean(req.body);
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (pool) {
      const rows = await query(
        'UPDATE membership_applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, req.params.id]
      );
      const appRow = rows[0];
      if (!appRow) return res.status(404).json({ error: 'Application not found' });
      if (status === 'approved') {
        await query(
          `INSERT INTO members (full_name, designation, phone, village_or_ward, image_url, source_application_id)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT DO NOTHING`,
          [
            appRow.full_name,
            designation || appRow.designation_requested || 'Member',
            appRow.phone,
            appRow.village_or_ward,
            appRow.image_url,
            appRow.id
          ]
        );
      }
      return res.json(appRow);
    }

    const application = memory.applications.find((item) => String(item.id) === String(req.params.id));
    if (!application) return res.status(404).json({ error: 'Application not found' });
    application.status = status;
    if (status === 'approved') {
      memory.members.push({
        id: memory.members.length + 1,
        full_name: application.full_name,
        designation: designation || application.designation_requested || 'Member',
        phone: application.phone,
        village_or_ward: application.village_or_ward,
        image_url: application.image_url
      });
    }
    res.json(application);
  } catch (error) {
    next(error);
  }
});

function crudRoutes(name, table, fields) {
  app.post(`/api/admin/${name}`, requireAdmin, async (req, res, next) => {
    try {
      const body = clean(req.body);
      validateRequired(body, fields.required);
      if (pool) {
        const columns = fields.all;
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(',');
        const values = columns.map((column) => Object.prototype.hasOwnProperty.call(body, column) ? body[column] : null);
        const rows = await query(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders}) RETURNING *`, values);
        return res.status(201).json(rows[0]);
      }
      const item = { id: memory[name].length + 1, ...body, created_at: new Date().toISOString() };
      memory[name].push(item);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });

  app.delete(`/api/admin/${name}/:id`, requireAdmin, async (req, res, next) => {
    try {
      if (pool) {
        await query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
      } else {
        memory[name] = memory[name].filter((item) => String(item.id) !== String(req.params.id));
      }
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });
}

crudRoutes('leaders', 'leaders', {
  required: ['full_name', 'designation'],
  all: ['full_name', 'designation', 'bio', 'image_url', 'sort_order']
});
crudRoutes('updates', 'updates', {
  required: ['title', 'body'],
  all: ['title', 'body', 'category', 'event_date', 'image_url']
});
crudRoutes('gallery', 'gallery_items', {
  required: ['title', 'image_url'],
  all: ['title', 'image_url', 'caption', 'sort_order']
});
crudRoutes('members', 'members', {
  required: ['full_name', 'designation'],
  all: ['full_name', 'designation', 'phone', 'village_or_ward', 'image_url', 'is_featured']
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  console.error(error);
  res.status(status).json({ error: status === 500 ? 'Server error' : error.message });
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Saranga BJP Paribar website running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize application', error);
    process.exit(1);
  });
