<div align="center">
  <img src="public/vite.svg" alt="JanDarpan Logo" width="100"/>
  <h1>JanDarpan - Mirror of the People 🇮🇳</h1>
  <p><strong>An AI-powered civic accountability platform empowering citizens to report local infrastructure issues and track official responses.</strong></p>

  [![Live Demo](https://img.shields.io/badge/Live%20Demo-jandarpan.vercel.app-blue?style=for-the-badge&logo=vercel)](https://jandarpan.vercel.app)
  
</div>

---

## 📖 About The Application

JanDarpan (translating to "Mirror of the People") bridges the gap between citizens and their elected representatives. It addresses the common problem of civic issues (like potholes, garbage dumps, and broken streetlights) going unnoticed by authorities. By combining crowdsourcing, AI verification, and live geospatial tracking, JanDarpan ensures that every reported issue is visible, verified, and directed to the correct local official.

### Core Features

*   **📸 AI-Verified Issue Reporting:** Citizens can snap a photo of a civic issue. To prevent spam and abuse, JanDarpan uses Google Gemini AI to analyze the image, confirm it is a genuine outdoor civic problem, automatically categorize it, and assign a severity score (1-10).
*   **🗺️ Live Radar Map:** A real-time, interactive map that plots all reported issues across the country. It clusters nearby issues and visually indicates their severity and current resolution status.
*   **🗳️ Community Validation:** To further ensure authenticity, community members can view issues on the map and "verify" (upvote) them, signaling to officials that the problem is affecting many people.
*   **🏛️ Secure Official Dashboard:** Elected officials are provided with secure accounts. They can log in to view a filtered dashboard of issues reported specifically in their jurisdiction. They can track the status, and once a repair is made, update the issue to "Resolved".
*   **⚖️ NetaKhoj (MyNeta) Integration:** Total transparency for politicians. Users can click on any constituency on the Live Radar map to instantly view their Member of Parliament's details (pulled from the MyNeta API), including educational background and declared criminal cases.
*   **🏆 Accountability Rankings:** The platform ranks elected officials based on their response time and issue resolution rates, creating a transparent Hall of Fame (and Shame).

---

## 💻 Technical Architecture

JanDarpan is built to be a fast, responsive, and secure modern web application. It utilizes a Serverless architecture to ensure high availability and security.

### 🛠️ Technology Stack

*   **Frontend Framework:** React.js powered by Vite for lightning-fast HMR and optimized production builds.
*   **Styling & UI:** Tailwind CSS for utility-first styling, and Framer Motion for premium, liquid-smooth animations.
*   **Database & Storage:** Appwrite (Backend-as-a-Service) is used for storing civic issues, politician data, and user authentication. Appwrite Storage handles secure, compressed uploads of evidence photos.
*   **Serverless APIs:** Vercel Edge Serverless Functions (`api/` directory) act as a secure proxy for all database interactions. This hides database credentials from the client and allows for strict server-side validation.
*   **Artificial Intelligence:** Google Gemini 2.5 Flash Vision API (with Groq Llama fallbacks) handles image recognition and natural language processing for issue verification.
*   **Geospatial Mapping:** Leaflet.js and React-Leaflet handle the rendering of the Live Radar Map, plotting complex GeoJSON constituency boundaries efficiently.

### 🔐 Security & Privacy Implementation

1.  **Server-Side Database Proxy:** The frontend never connects directly to the Appwrite Database SDK. Instead, it hits `/api/issues` endpoints on Vercel. These endpoints use the `node-appwrite` Server SDK, which bypasses Row Level Security (RLS) safely on the backend using a private API key, protecting the Database structure from malicious users.
2.  **EXIF Data Stripping:** To protect the anonymity and physical safety of whistleblowers, all uploaded photos are stripped of EXIF metadata (like device model and precise original capture coordinates) before being stored.
3.  **Cross-Origin Proxies (CORS):** The application relies on external APIs (like MyNeta) that do not natively support CORS. This is bypassed securely using Vercel's `vercel.json` edge rewrites, piping requests through the Vercel edge network to avoid browser preflight blocks.

---

## 🚀 Setup & Installation

Follow these steps to get JanDarpan running locally on your machine.

### 1. Prerequisites
*   Node.js (v18 or higher)
*   An [Appwrite](https://appwrite.io/) account (Cloud or Self-Hosted)
*   A [Google Gemini API Key](https://aistudio.google.com/)

### 2. Clone and Install
```bash
git clone <your-github-repo-url>
cd jandarpan
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
VITE_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
VITE_APPWRITE_PROJECT_ID="your_project_id"
VITE_APPWRITE_DATABASE_ID="your_database_id"
VITE_APPWRITE_ISSUES_COLLECTION_ID="your_issues_collection_id"
VITE_APPWRITE_REPRESENTATIVES_COLLECTION_ID="your_reps_collection_id"
VITE_APPWRITE_STORAGE_BUCKET_ID="your_storage_bucket_id"

# Vercel Serverless Backend Key (Requires Full Read/Write Permissions)
APPWRITE_API_KEY="your_secret_api_key"

# Google Gemini Vision Key
VITE_GEMINI_API_KEY="your_gemini_key"
```

### 4. Run Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌩️ Deployment to Vercel

1. Ensure you have the [Vercel CLI](https://vercel.com/docs/cli) installed (`npm i -g vercel`).
2. Run `vercel --prod` to deploy to Vercel's Edge Network.
3. **IMPORTANT:** Go to your Vercel Dashboard -> Project Settings -> Environment Variables. You MUST add your `APPWRITE_API_KEY` here. If you omit this, the Serverless backend will fail to connect to Appwrite and return 500 errors.
4. Go to your Appwrite Dashboard -> Project -> Platforms. Add your Vercel deployment URL (e.g., `jandarpan.vercel.app`) as a Web Platform to bypass Appwrite CORS restrictions.

---
<div align="center">
  <p>Built for the citizens, by the citizens.</p>
</div>
