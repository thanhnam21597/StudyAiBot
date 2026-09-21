# Walrus Study Assistant (StudyMate Bot) 🚀

An intelligent personalized study companion powered by **Walrus Protocol (MemWal)** decentralized storage and open-source Large Language Models (LLMs).

---

## 🌟 Key Features

- **Intelligent Study Assistant:** Explains complex concepts, debugs code, and breaks down algorithms (Computer Science, Math, Languages, etc.) with a supportive, step-by-step approach.
- **Decentralized Memory Retrieval (Read Memory):** Automatically loads the student's prior learning context (progress, goals, weak points, in-progress tasks) directly from Walrus Memory across chat sessions without requiring repetitive re-explanations.
- **Persistent Long-Term Synchronization (Write Memory):** Extracts key takeaways, active projects, and unresolved bugs to publish decentralized blob snapshots on the Walrus Protocol.
- **Modern Full-Stack Architecture:**
  - **Backend:** Python Django, Django REST Framework, integrated with Walrus Publisher & Aggregator APIs.
  - **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons.

---

## 📁 Project Structure

```text
walrus-study-assistant/
├── backend/                       # Django Backend
│   ├── config/                    # Project configurations (settings.py, urls.py, wsgi.py)
│   ├── apps/
│   │   ├── chat/                  # Conversation & LLM integration module
│   │   └── memory/                # Walrus Protocol (MemWal) decentralized memory module
│   ├── manage.py
│   └── requirements.txt
├── frontend/                      # ReactJS + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/            # ChatWindow, MessageInput, MemoryStatus
│   │   ├── services/              # API Client (Axios)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── run_backend.bat                # 1-click script to start Django backend
├── run_frontend.bat               # 1-click script to start React frontend
├── start_all.bat                  # 1-click script to launch both servers
├── .gitignore
└── README.md
```

---

## 🛠️ Quickstart Guide

### ⚡ Easy Mode (Windows 1-Click)
Double-click **`start_all.bat`** in the root folder to spin up both Backend and Frontend simultaneously.

### 💻 Manual Setup

#### 1. Backend (Django)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start backend development server
python manage.py runserver 127.0.0.1:8000
```

#### 2. Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Navigate to `http://localhost:5173/` in your browser to experience StudyMate Bot.
