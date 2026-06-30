# 🧬 Life Saver

> **Life Saver** is a premium, AI-powered personal productivity assistant and organizer designed to gamify, structure, and automate your daily life. It brings together task scheduling, habits, calendar integration, and AI-driven intelligence under one unified, visually stunning interface.

---

## 🚀 Key Features

*   **🤖 AI Assistant & Chatbot**: Interactive real-time assistant powered by LangChain and OpenAI, operating over WebSockets for instant response generation and intelligent context-aware task suggestion.
*   **📅 Calendar & Task Orchestration**: Native integration with Google Calendar API to synchronize and schedule tasks, deadlines, and meetings effortlessly.
*   **🎮 Gamification & Habits**: Transform productivity into a game! Track goals and daily habits, earn Experience Points (XP), unlock custom levels, and celebrate streaks with rich UI transitions and confetti animations.
*   **📊 Interactive Analytics**: Sleek, visual dashboards powered by Recharts showing productivity patterns, task completion velocities, and habit streaks.
*   **⚡ AI Action Engine**: Automatic analysis of user habits and goal descriptions to formulate actionable schedules.

---

## 🛠️ Tech Stack

### Frontend
*   **Core**: React 19, TypeScript, Vite 8
*   **Styling**: Tailwind CSS v4, Framer Motion (for premium fluid animations)
*   **State Management**: Zustand, React Query (for asynchronous caching)
*   **Visuals**: Recharts (analytics charts), Lucide Icons, Canvas Confetti

### Backend
*   **Core**: Django 5, Django REST Framework (DRF), Django Channels (WebSockets)
*   **Asynchronous Tasks**: Celery, Redis (for event broker and caching)
*   **Database**: PostgreSQL
*   **AI Engine**: OpenAI API, LangChain, FAISS (vector database for retrieval-augmented generation)
*   **Third-party Services**: Firebase Admin (authentication / push notifications), Google OAuth (Calendar API)

---

## 📂 Project Structure

```
life_saver/
├── backend/                  # Django REST framework backend
│   ├── apps/                 # Core domain modules (auth, ai_chatbot, goals, tasks, etc.)
│   ├── config/               # Settings configuration (base, dev, production)
│   ├── manage.py             # CLI manager
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React frontend
│   ├── src/                  # React application source code
│   │   ├── features/         # Modular feature folders (landing, dashboard, ai-chat, etc.)
│   │   ├── components/       # Common reusable components
│   │   └── routes/           # Routing configuration
│   └── package.json          # Node dependencies
└── README.md                 # Main workspace documentation
```

---

## ⚙️ Getting Started

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   PostgreSQL
*   Redis

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Create a `.env` file in the `backend/` directory referencing `.env` settings. Ensure you configure:
   *   `DATABASE_URL` (PostgreSQL connection string)
   *   `REDIS_URL` (e.g. `redis://localhost:6379/0`)
   *   `OPENAI_API_KEY` (for AI features)
   *   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (for Calendar OAuth)

5. **Run Migrations & Start Server**:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

6. **Start Celery Worker (In a separate terminal)**:
   ```bash
   celery -A config worker --loglevel=info
   ```

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Configure `.env.local` based on `.env.example` to point to the backend server:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 🌐 Deployment

*   **Backend**: Deployed to Google Cloud Platform (configured with `.gcloudignore` and `Dockerfile`).
*   **Frontend**: Deployed to Firebase Hosting (configured with `firebase.json`).
*   **Live Website**: https://life-saver-19de5.web.app/
