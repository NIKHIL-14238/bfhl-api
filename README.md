# BFHL Node Explorer — SRM Round 1

## ⚡ Quick Setup

### 1. Fill in your details
Open `index.js` and update lines 10–12:
```js
const USER_ID        = "yourname_ddmmyyyy";         // e.g. "rahulsharma_15032003"
const EMAIL_ID       = "your.email@srmist.edu.in";  // your college email
const COLLEGE_ROLL   = "RA2111003010001";            // your roll number
```

### 2. Run locally
```bash
npm install
npm start
# → http://localhost:3000
```

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/bfhl-project.git
git push -u origin main
```

### 4. Deploy to Render (free, easiest)
1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Done — you get a URL like `https://bfhl-project.onrender.com`

### 5. Deploy to Vercel (alternative)
```bash
npm i -g vercel
vercel
```

---

## API

**POST** `/bfhl`
```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X"]
}
```

Returns full hierarchy analysis with cycle detection, depth, invalid/duplicate entries.
