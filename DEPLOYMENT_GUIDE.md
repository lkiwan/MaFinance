# Deploy MaFinance Pro to Render (FREE)

Get your Moroccan stock market dashboard online in **3 simple steps**.

---

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Sign Up for Render
1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account**
4. ✅ Done - you're logged in!

### Step 2: Deploy with One Click
1. Go to: **https://render.com/deploy?repo=https://github.com/lkiwan/MaFinance**
2. Render will ask to connect your GitHub
3. Click **"Connect"** and authorize Render
4. Render will show you what it's creating:
   - PostgreSQL Database (Free)
   - Web Service (Free)
5. Click **"Apply"** button
6. ✅ Wait 5-10 minutes while it deploys

### Step 3: Access Your Live App
1. Once deployment finishes, you'll see a **green "Live"** status
2. Click on your web service name
3. You'll see a URL like: **`https://mafinance-pro.onrender.com`**
4. Click the URL to open your live app!
5. ✅ Your app is online!

---

## ✅ What Gets Deployed Automatically

The `render.yaml` file handles everything:

- ✅ PostgreSQL database (1GB free storage)
- ✅ Web server (512MB RAM)
- ✅ All Python dependencies installed
- ✅ Database tables created
- ✅ SSL certificate (HTTPS)
- ✅ Environment variables configured

**You don't need to do anything manually!**

---

## 🧪 Test Your Deployed App

1. Visit your Render URL
2. Click **"Register"** to create an account
3. Log in with your new account
4. Try these features:
   - Search for Moroccan stocks
   - Add stocks to your watchlist
   - Create price alerts
   - View stock charts

---

## ⚠️ Important: Free Tier Info

### What You Get Free:
- ✅ Unlimited requests
- ✅ Automatic HTTPS/SSL
- ✅ 750 hours/month (enough for 24/7)
- ✅ Custom domain support
- ✅ Auto-deploy on Git push

### Free Tier Limits:
- ⚠️ App sleeps after 15 minutes of inactivity
- ⚠️ Takes ~30 seconds to wake up on first request
- ⚠️ PostgreSQL expires after 90 days (then recreate it)

### Keep Your App Awake (Optional):
Use **UptimeRobot** to ping your app every 5 minutes:
1. Sign up at: https://uptimerobot.com (free)
2. Add monitor for your Render URL
3. ✅ Your app stays awake 24/7

---

## 🔄 Update Your Deployed App

When you make changes to your code:

1. **Make changes locally** (edit your files)
2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Updated feature X"
   git push origin main
   ```
3. **Render auto-deploys** within 2-3 minutes!
4. ✅ Changes are live

---

## 🛠️ Troubleshooting

### Problem: App won't start
**Solution**: Check logs in Render dashboard
1. Click on your web service
2. Go to **"Logs"** tab
3. Look for error messages
4. Common fix: Make sure `requirements.txt` is updated

### Problem: Database not working
**Solution**: Reinitialize database
1. In Render dashboard, click **"Shell"** tab
2. Run: `python init_db.py`
3. Restart the web service

### Problem: App is slow
**Solution**: The free tier sleeps. Either:
- Wait 30 seconds for it to wake up, OR
- Set up UptimeRobot to keep it awake

---

## 💡 Pro Tips

1. **View Logs**: Always check logs if something breaks
2. **Environment Variables**: View/edit in Render dashboard under "Environment"
3. **Custom Domain**: Add your own domain in Render settings (free!)
4. **Database Backup**: Export your database monthly (it expires in 90 days)
5. **Monitor Usage**: Check Render dashboard for usage stats

---

## 📊 Need More Power?

If your app gets popular, upgrade to paid plans:

- **Web Service**: $7/month (no sleep, better performance)
- **Database**: $7/month (no expiration, more storage)

---

## 🎯 Deployment Checklist

- [ ] Created Render account
- [ ] Clicked "Deploy to Render" link
- [ ] Connected GitHub repository
- [ ] Clicked "Apply" to deploy
- [ ] Waited for deployment to finish
- [ ] Tested the live URL
- [ ] Created test account
- [ ] Added stock to watchlist
- [ ] Created price alert
- [ ] (Optional) Set up UptimeRobot

---

## 📞 Need Help?

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **GitHub Issues**: Report bugs at https://github.com/lkiwan/MaFinance/issues

---

## 🎉 You're Done!

Your MaFinance Pro is now **LIVE** and accessible worldwide!

**Share your URL**: `https://your-app-name.onrender.com`

---

_Made with ❤️ in Morocco | Powered by Casablanca Stock Exchange Data_
