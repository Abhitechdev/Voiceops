# VoiceOps — Setup & Deployment Guide

This guide covers local environment setup, Supabase database configuration, and deployment to the Hugging Face Space repository `nono455/Voiceops`.

---

## 1. Local Environment Setup

### Prerequisites
- Python 3.10+ (Python 3.11 recommended)
- Git CLI

### Step 1: Clone and Install Dependencies
```bash
git clone https://huggingface.co/spaces/nono455/Voiceops
cd Voiceops

# Create virtual environment
python -m venv .venv
# Activate on Windows:
.\.venv\Scripts\Activate.ps1
# Or on Linux/macOS:
source .venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory:
```ini
# Supabase PostgreSQL Database (IPv4 Pooler URL)
DATABASE_URL=postgresql://postgres.uskhvfuvuodjjysxiuqj:Abhi12%2334567890@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require

# Gnani AI Speech-to-Text API
GNANI_API_KEY=your_gnani_api_key_here
GNANI_API_ENDPOINT=https://api.vachana.ai/stt/v3
GNANI_LANGUAGE_CODE=te-IN
GNANI_MOCK_MODE=false

# Optional Hybrid Extraction
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 3: Initialize Database Schema
```bash
python -c "from services.db import init_db; init_db()"
# Optionally seed evaluation tickets:
python database/seed_supabase.py
```

### Step 4: Launch the Gradio Console Locally
```bash
python app.py
```
Open your browser at `http://127.0.0.1:7860`.

---

## 2. Hugging Face Space Deployment (`nono455/Voiceops`)

### Target Space Details
- **Space Repository:** `nono455/Voiceops`
- **URL:** `https://huggingface.co/spaces/nono455/Voiceops`
- **SDK:** Gradio
- **App File:** `app.py`

### Deployment Steps via Git

1. **Configure Hugging Face Space Remote:**
   ```bash
   git remote add space https://huggingface.co/spaces/nono455/Voiceops
   ```

2. **Authenticate with Hugging Face:**
   ```bash
   # Option A: Hugging Face CLI login
   huggingface-cli login

   # Option B: Git credential helper with personal HF access token
   git config credential.helper store
   ```

3. **Stage, Commit, and Push:**
   ```bash
   git add app.py requirements.txt README.md services/ schemas/ database/ tests/ docs/
   git commit -m "Deploy VoiceOps production Gradio MVP with Supabase and Gnani STT adapter"
   git push space master:main
   ```

### Space Secrets Configuration
In the Hugging Face Space web console, navigate to **Settings → Variables and secrets**:

1. **`DATABASE_URL`**: `postgresql://postgres.uskhvfuvuodjjysxiuqj:[URL_ENCODED_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require`
2. **`GNANI_API_KEY`**: Your live Gnani AI API key
3. **`GNANI_API_ENDPOINT`**: `https://api.vachana.ai/stt/v3`
4. **`GNANI_MOCK_MODE`**: `false` (or `true` for demo simulation)
5. **`OPENAI_API_KEY`**: (Optional) OpenAI API key for LLM structured extraction

