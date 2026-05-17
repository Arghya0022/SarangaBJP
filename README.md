# Saranga BJP Paribar Website

A complete Render-ready political community website with:

- Home page with mission, leadership, events, gallery, donation, and membership calls to action
- Membership application form
- Admin approval panel for pending membership applications
- Events and updates publishing
- Leadership and member designation cards with images
- Gallery-style media section
- Donation/UPI configuration
- PostgreSQL support with automatic table creation
- Render deployment files

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:init
npm run dev
```

Open `http://localhost:3000`.

If `DATABASE_URL` is not configured, the app starts with an in-memory demo store so the frontend can still be reviewed. Use PostgreSQL for production.

## Render Deployment

1. Push this project to GitHub.
2. Create a Render Blueprint from `render.yaml`.
3. Set `ADMIN_PASSWORD`, `DONATION_UPI_ID`, `DONATION_QR_IMAGE`, and contact env vars in Render.
4. Deploy.

## Updating Later

- Leadership, gallery, events, and approved members can be managed from `/admin.html`.
- Static text and layout can be edited in `public/index.html`, `public/membership.html`, and `public/styles.css`.
- Database tables are initialized from `db/schema.sql`.
