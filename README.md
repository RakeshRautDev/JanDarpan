# JanDarpan - Mirror of the People 🇮🇳

JanDarpan is an open-source civic accountability platform that empowers citizens to report local infrastructure issues and holds elected officials accountable. By leveraging AI image classification, geolocation mapping, and a real-time dashboard, JanDarpan bridges the gap between citizens and their representatives.

## Features ✨

*   **📸 AI-Powered Issue Reporting:** Citizens can snap a photo of a civic issue (like a pothole or open drain). The app automatically strips EXIF data for privacy and uses Gemini AI (or Groq Llama fallback) to classify the issue and assign a severity score (1-10).
*   **🗺️ Live Radar Map:** A real-time, interactive map (powered by Leaflet.js) that plots all reported issues across India. 
*   **🗳️ Community Verification:** Community members can view issues on the map and "verify" (upvote) them to validate their authenticity.
*   **🏛️ Official Dashboard:** Elected officials have a secure login to view issues reported specifically in their constituency. They can track the status of problems and mark them as "Resolved" once fixed.
*   **🏆 Rankings & Hall of Fame:** The platform ranks elected officials based on their response time and issue resolution rates.
*   **⚖️ MyNeta Integration:** Click on any constituency on the Live Radar map to instantly view the Member of Parliament's details pulled directly from the **MyNeta API**, including their educational background and any declared **criminal cases** (creating a transparent Hall of Fame/Shame).
*   **📊 Live Statistics:** The landing page features dynamic, animated statistics pulling real-time data from the Appwrite backend.

## Tech Stack 🛠️

*   **Frontend:** React, Vite, Tailwind CSS, Framer Motion
*   **Backend as a Service (BaaS):** Appwrite (Authentication, Database, Storage)
*   **Serverless APIs:** Vercel Serverless Functions (`api/` directory using `node-appwrite`)
*   **AI Models:** Google Gemini 2.5 Flash, Groq Llama
*   **Mapping:** Leaflet.js, React-Leaflet
*   **Icons:** Lucide React

---

## 🚀 Setup & Installation

Follow these steps to get JanDarpan running locally on your machine.

### 1. Prerequisites
*   Node.js (v18 or higher)
*   An [Appwrite](https://appwrite.io/) account (Cloud or Self-Hosted)
*   A [Google Gemini API Key](https://aistudio.google.com/) (Optional, but recommended for AI features)

### 2. Clone and Install
```bash
# Navigate to the project directory
cd jandarpan

# Install dependencies
npm install
```

### 3. Appwrite Backend Setup
You need to configure your Appwrite backend. We have provided an automated script to create the necessary database, collections, and attributes for you.

1. Go to your Appwrite Console and create a new Project.
2. Go to **Settings** and copy your **Project ID** and **API Endpoint**.
3. Create an API Key in Appwrite (Settings -> API Keys) with the following scopes:
   * `databases.read`, `databases.write`, `collections.read`, `collections.write`, `attributes.read`, `attributes.write`
4. Create a Storage Bucket in Appwrite for storing issue photos. Copy the **Bucket ID**.

### 4. Environment Variables
Create a `.env` file in the root of the `jandarpan` directory and fill in your details:

```env
VITE_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
VITE_APPWRITE_PROJECT_ID="your_project_id"
VITE_APPWRITE_DATABASE_ID="your_database_id"
VITE_APPWRITE_ISSUES_COLLECTION_ID="your_issues_collection_id"
VITE_APPWRITE_REPRESENTATIVES_COLLECTION_ID="your_reps_collection_id"
VITE_APPWRITE_STORAGE_BUCKET_ID="your_storage_bucket_id"

# API Key used by the setup script (Do NOT expose this in frontend code)
APPWRITE_API_KEY="your_secret_api_key"

# Optional: Gemini API for Image Classification
VITE_GEMINI_API_KEY="your_gemini_key"
```
*(Note: If you already ran the automated script with `node setup-appwrite.js`, your `.env` is likely already populated!)*

### 5. Run the Application
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌩️ Deployment to Vercel

JanDarpan utilizes **Vercel Serverless Functions** in the `api/` directory for secure database operations.

1. Ensure you have the [Vercel CLI](https://vercel.com/docs/cli) installed (`npm i -g vercel`).
2. Run `vercel --prod` to deploy.
3. **IMPORTANT:** Go to your Vercel Project Settings -> Environment Variables, and add the `APPWRITE_API_KEY` exactly as it is in your `.env`. Without this, the Serverless backend will return 500 errors.

---

## 📖 How to Use the App

### For Citizens (Reporting an Issue)
1. Navigate to the **Home Page**.
2. Click on the **"Report Issue"** button.
3. You will be asked to upload an image of the civic problem and optionally provide a brief text description.
4. The AI will analyze the image to confirm it is a genuine issue, assign a severity score, and categorize it (e.g., Pothole, Garbage).
5. The issue will immediately appear on the **Live Radar Map** for the community and officials to see.

### For Community (Verifying Issues)
1. Scroll down to the **Live Radar Map** on the Home Page.
2. Click on any colored marker on the map to see the details of the reported issue.
3. Click the **"Verify"** button to upvote the issue and confirm to officials that it is a real problem affecting the community.

### For Officials (Resolving Issues)
1. Go to the **Official Portal** (via the footer link or by navigating to `/login`).
2. Log in with your official Appwrite credentials.
3. You will be taken to the **Admin Dashboard**. Here, you will see a list of all issues reported in your jurisdiction.
4. Click on an issue to view the citizen's photo and the AI's severity assessment.
5. Once your team has fixed the problem, change the status to **"Resolved"**. This will update the status live on the public map.

---

## Project Structure
*   `src/pages/`: Contains the main views (`Home.jsx`, `Report.jsx`, `Admin.jsx`, `Login.jsx`).
*   `src/components/`: Reusable UI components (like the `LiveMap.jsx`).
*   `src/services/`: API and database connection logic (`appwriteDB.js`, `gemini.js`).
*   `src/contexts/`: React context providers (like `AuthContext.jsx` for managing user login state).

## License
MIT License
