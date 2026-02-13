# InkScroll MVP (Manga/Manhwa PDF Platform)

Modern full-stack MVP for uploading and reading manga/manhwa PDFs.

## Stack
- **Frontend:** React (Vite), TailwindCSS, Framer Motion, React Router, react-pdf
- **Backend:** Node.js, Express, MongoDB Atlas
- **Auth/Storage:** Firebase Authentication + Firebase Storage

## Features
- Email/password + Google auth via Firebase
- MongoDB user sync with role system and verification badges
- Protected admin panel (`ADMIN` + `OWNER`)
- PDF + thumbnail upload with server-side type validation and upload progress
- In-browser immersive PDF reader (zoom, page nav, fullscreen)
- Premium dark UI with skeleton states, subtle hover animations, route transitions, and toast notifications

## Project structure
```
client/
  components/
  pages/
  hooks/
  context/
  services/
  layouts/
server/
  routes/
  controllers/
  models/
  middleware/
```

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file and fill credentials:
   ```bash
   cp .env.example .env
   ```
3. In Firebase console:
   - Enable **Email/Password** and **Google** sign-in providers.
   - Create storage bucket.
   - Create service account credentials (for backend admin SDK).
4. Run app:
   ```bash
   npm run dev
   ```

## Run commands
- `npm run dev` – start client + server
- `npm run build` – build client
- `npm run start` – run production server

## Security constraints implemented
- Only uploader/admin/owner can delete manga
- Only admin/owner can access `/api/admin/*`
- Only admin/owner can assign roles
- Upload validation enforces PDF + image and size limits
