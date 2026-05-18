CREATE TABLE IF NOT EXISTS membership_applications (
  id SERIAL PRIMARY KEY,

  full_name TEXT NOT NULL,
  father_or_spouse TEXT,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT NOT NULL,
  village_or_ward TEXT,
  booth_no TEXT,
  age INTEGER,
  profession TEXT,
  designation_requested TEXT,
  image_url TEXT,
  message TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'leader', 'president', 'moderator', 'admin')),

  password_hash TEXT,

  approved_by TEXT,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,

  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  phone TEXT UNIQUE,
  village_or_ward TEXT,

  image_url TEXT,

  source_application_id INTEGER
    REFERENCES membership_applications(id)
    ON DELETE SET NULL,

  is_featured BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (source_application_id)
);



CREATE TABLE IF NOT EXISTS leaders (
  id SERIAL PRIMARY KEY,

  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,

  bio TEXT,

  image_url TEXT,

  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



CREATE TABLE IF NOT EXISTS updates (
  id SERIAL PRIMARY KEY,

  title TEXT NOT NULL,

  body TEXT NOT NULL,

  category TEXT NOT NULL DEFAULT 'Update',

  event_date DATE,

  image_url TEXT,

  is_published BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



CREATE TABLE IF NOT EXISTS gallery_items (
  id SERIAL PRIMARY KEY,

  title TEXT NOT NULL,

  image_url TEXT NOT NULL,

  caption TEXT,

  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,

  full_name TEXT NOT NULL,

  phone TEXT NOT NULL UNIQUE,

  password_hash TEXT NOT NULL,

  role TEXT NOT NULL
    CHECK (role IN (
  'super_admin',
  'president',
  'general_secretary',
  'leader',
  'booth_head',
  'booth_president',
  'administrator',
  'coordinator'
)),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



INSERT INTO leaders (
  full_name,
  designation,
  bio,
  image_url,
  sort_order
)

SELECT
  'Saranga BJP Paribar',
  'Local Leadership Team',
  'Dedicated karyakartas working for Saranga with organization, service, and booth-level coordination.',
  '/assets/leader-placeholder.svg',
  1

WHERE NOT EXISTS (
  SELECT 1 FROM leaders
);



INSERT INTO updates (
  title,
  body,
  category,
  event_date,
  image_url
)

SELECT
  'Membership drive open',
  'Saranga BJP Paribar is accepting new membership applications. Submit your details and the admin team will review your application.',
  'Membership',
  CURRENT_DATE,
  '/assets/update-placeholder.svg'

WHERE NOT EXISTS (
  SELECT 1 FROM updates
);



INSERT INTO gallery_items (
  title,
  image_url,
  caption,
  sort_order
)

SELECT
  'Community outreach',
  '/assets/gallery-placeholder.svg',
  'Add real event photos from the admin panel.',
  1

WHERE NOT EXISTS (
  SELECT 1 FROM gallery_items
);

CREATE TABLE IF NOT EXISTS admin_applications (
  id SERIAL PRIMARY KEY,

  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,

  requested_role TEXT NOT NULL CHECK (
    requested_role IN (
      'president',
      'general_secretary',
      'leader',
      'booth_head',
      'booth_president',
      'administrator',
      'coordinator'
    )
  ),

  image_url TEXT,
  message TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  password_hash TEXT,

  approved_by TEXT,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);