# Labour Bridge — backend starter + existing frontend

This project keeps the supplied HTML frontend and adds a Node.js/Express REST API with MySQL.

## Current status
- Backend API and MySQL schema are included.
- API modules: register/login/current user, jobs search/create/edit/close, applications, worker profiles, reports/admin review, wage records, worker reviews.
- The supplied frontend is copied unchanged. It is still a demo UI using sample/localStorage data; it must be wired to the API before calling the complete site production-ready.
- Email/OTP, real-time chat, payment gateway, image uploads, map/GPS, notifications, admin bootstrap, and full frontend integration are not implemented in this starter.

## Local setup (Windows PowerShell or Ubuntu terminal)
1. Install Node.js LTS and MySQL 8.
2. Open a terminal in `backend` and run `npm install`.
3. Copy `.env.example` to `.env`; set DB credentials and a long random JWT_SECRET. Never commit `.env`.
4. Create a MySQL application user and import `sql/schema.sql` using a MySQL client. Example:
   `mysql -u root -p < sql/schema.sql`
   Then create a restricted user for the app and update `.env` (do not use root in production).
5. Start API: `npm run dev`.
6. Visit `http://localhost:5000/api/health`; expected response: `{"success":true,"status":"ok","database":"connected"}`.
7. Serve `frontend/index.html` using VS Code Live Server (typically `http://localhost:5500`) and set `FRONTEND_ORIGIN` to that origin.

## API quick map
- `POST /api/auth/register` — {name,email,password,role:'worker'|'employer',phone?}
- `POST /api/auth/login` — {email,password}
- `GET /api/auth/me` — Bearer token
- `GET /api/jobs?keyword=&location=&category=&jobType=`
- `GET /api/jobs/:id`
- `POST /api/jobs` — employer/admin token
- `PATCH /api/jobs/:id`, `DELETE /api/jobs/:id` — owner/admin token
- `POST /api/applications` — worker token, {job_id,cover_note?}
- `GET /api/applications/mine` — worker token
- `GET /api/applications/job/:jobId` — owning employer/admin
- `PATCH /api/applications/:id/status` — owning employer/admin, {status}
- `GET /api/workers?skill=&location=`
- `GET /api/workers/me`, `PUT /api/workers/me` — worker token
- `POST /api/reports` — authenticated user; `GET /api/reports` and `PATCH /api/reports/:id/status` — admin token
- `GET /api/wages/mine` — worker token; `POST /api/wages` — employer/admin token
- `GET /api/reviews/worker/:id`; `POST /api/reviews` — employer token

## Important security note
Do not expose MySQL publicly. Use HTTPS, strong secrets, backups, least-privilege DB credentials, monitoring, and production CORS origins. Admin creation must be handled securely (not through public registration). Review and test all routes before real users rely on the service.

## AWS deployment plan
Recommended learning-friendly architecture: frontend on S3 + CloudFront; API on an EC2 instance behind Nginx and HTTPS; MySQL on Amazon RDS (private networking). Keep DB in private subnets/security groups, allow the API instance to connect to port 3306, and never open RDS to `0.0.0.0/0`. AWS resources can incur charges; check current pricing and set a billing budget before creating them.
