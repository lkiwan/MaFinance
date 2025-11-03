# MaFinance Pro - Free Deployment Guide

Deploy your Moroccan stock market dashboard online for **FREE** using Render.

## 🚀 Option 1: Deploy on Render (Recommended)

Render offers free hosting for Flask apps + free PostgreSQL database.

### Step 1: Prepare Your Code

All files are already prepared! You have:
- ✅ `requirements.txt` - Python dependencies
- ✅ `start.sh` - Start script for Render
- ✅ `.gitignore` - Files to exclude from Git
- ✅ `init_db.py` - Auto-detects PostgreSQL or SQLite

### Step 2: Push to GitHub

1. **Initialize Git repository** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit: MaFinance Pro - Moroccan Stock Market Dashboard

Features:
- Real-time stock data from Casablanca Stock Exchange
- Interactive dashboard with search and filtering
- Detailed stock information and charts
- Web scraper for BVC data
- RESTful API with Flask backend
- Responsive UI with Tailwind CSS
- Security improvements (input validation, headers)
- Comprehensive documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

2. **Create a GitHub repository**:
   - Go to https://github.com/new
   - Name it: `mafinance-pro`
   - Make it Public or Private
   - Don't initialize with README (you already have files)
   - Click "Create repository"

3. **Push your code**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/mafinance-pro.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render

1. **Sign up for Render**:
   - Go to https://render.com
   - Sign up with GitHub (it's free!)

2. **Create PostgreSQL Database**:
   - Click "New +" → "PostgreSQL"
   - Name: `mafinance-db`
   - Database: `mafinance`
   - User: `mafinance_user`
   - Region: Choose closest to you
   - Plan: **Free** (select this!)
   - Click "Create Database"
   - **IMPORTANT**: Copy the "Internal Database URL" (you'll need it)

3. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your `mafinance-pro` repository
   - Configure:
     - **Name**: `mafinance-pro`
     - **Region**: Same as database
     - **Branch**: `main`
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt && python init_db.py`
     - **Start Command**: `bash start.sh`
     - **Plan**: **Free** (select this!)

4. **Add Environment Variables**:
   - Scroll to "Environment Variables"
   - Click "Add Environment Variable"
   - Add these:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Paste the Internal Database URL from step 2 |
   | `SECRET_KEY` | Generate random string: `python -c "import secrets; print(secrets.token_hex(32))"` |
   | `FLASK_ENV` | `production` |
   | `FLASK_DEBUG` | `False` |

5. **Deploy**:
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your app will be live at: `https://mafinance-pro.onrender.com`

### Step 4: Test Your Deployment

1. Visit your Render URL
2. Try creating an account
3. Add stocks to watchlist
4. Create price alerts
5. Everything should work with the PostgreSQL database!

---

## 🎯 Option 2: Deploy on Railway (Alternative)

Railway also offers free hosting with PostgreSQL.

### Quick Start:

1. **Sign up**: https://railway.app
2. **New Project** → "Deploy from GitHub"
3. **Add PostgreSQL** plugin
4. **Set Environment Variables**:
   - `DATABASE_URL` (auto-filled by Railway)
   - `SECRET_KEY` (generate one)
5. **Deploy**: Railway auto-detects and deploys!

---

## 🛠️ Troubleshooting

### Issue: Database tables not created

**Solution**: Manually run the init script:
```bash
# In Render dashboard, go to Shell tab and run:
python init_db.py
```

### Issue: "Module not found" errors

**Solution**: Check requirements.txt includes all dependencies:
```bash
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update requirements"
git push
```

### Issue: App crashes on startup

**Solution**: Check logs in Render dashboard:
- Click on your web service
- Go to "Logs" tab
- Look for error messages

### Issue: Database connection fails

**Solution**:
1. Verify DATABASE_URL is set correctly
2. Make sure you used the "Internal Database URL"
3. Restart the web service

---

## 📊 Free Tier Limitations

### Render Free Tier:
- ✅ 512 MB RAM
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ Sleeps after 15 min inactivity (wakes on request)
- ⚠️ 750 hours/month (enough for 24/7)

### PostgreSQL Free Tier:
- ✅ 256 MB RAM
- ✅ 1 GB Storage
- ✅ Expires after 90 days (then you need to recreate it)
- ✅ Automatic backups

---

## 🔒 Security Best Practices

1. **Never commit secrets**:
   - `.env` is in `.gitignore`
   - Use Render environment variables
   - Rotate SECRET_KEY regularly

2. **Enable HTTPS**:
   - Render provides free SSL automatically

3. **Set strong SECRET_KEY**:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

4. **Regular updates**:
```bash
pip list --outdated
pip install --upgrade flask pandas
```

---

## 🚀 Keeping Your App Awake

Free tier sleeps after 15 min. Solutions:

### Option 1: UptimeRobot (Free)
1. Sign up: https://uptimerobot.com
2. Add monitor for your Render URL
3. Ping every 5 minutes
4. ✅ Keeps app awake 24/7

### Option 2: Cron Job (GitHub Actions)
Add `.github/workflows/keep-alive.yml`:
```yaml
name: Keep Alive
on:
  schedule:
    - cron: '*/14 * * * *'  # Every 14 minutes
jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping
        run: curl https://YOUR-APP.onrender.com
```

---

## 📈 Upgrading (Optional)

If your app grows popular, upgrade to paid plans:

### Render Paid Plans:
- **Starter**: $7/month
  - No sleep
  - Better performance
  - More RAM

### PostgreSQL Paid Plans:
- **Starter**: $7/month
  - More storage
  - Better performance
  - No 90-day expiration

---

## 🎓 Next Steps

1. ✅ Deploy your app
2. 📱 Share the URL with users
3. 📊 Monitor performance in Render dashboard
4. 🔔 Set up UptimeRobot to keep it awake
5. 🌟 Add custom domain (optional)

---

## 💡 Tips

- **Custom Domain**: Add your own domain in Render settings (free with SSL)
- **Logs**: Monitor logs regularly for errors
- **Backups**: Export database periodically
- **Updates**: Push updates via Git, Render auto-deploys

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Your GitHub Issues**: Report bugs in your repository

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Web service created
- [ ] Environment variables set
- [ ] App deployed successfully
- [ ] Database initialized
- [ ] Test: Create account
- [ ] Test: Add to watchlist
- [ ] Test: Create alert
- [ ] UptimeRobot configured (optional)

---

**Congratulations! Your MaFinance Pro is now live! 🎉**

Share your live URL: `https://mafinance-pro.onrender.com`

---

*Made with ❤️ in Morocco | Powered by Casablanca Stock Exchange Data*
