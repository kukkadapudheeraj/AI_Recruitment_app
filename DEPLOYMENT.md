# 🚀 AI Recruitment App - AWS EC2 Deployment

## Quick Deployment Guide

### 📋 Prerequisites

- AWS Account with EC2 access
- SSH key pair (.pem file)
- OpenAI API key

---

## 🎯 Option 1: Automated Setup (Recommended)

### Step 1: Launch EC2 Instance

1. **Launch Ubuntu 22.04 LTS** (t2.micro for free tier)
2. **Security Group Rules:**
   ```
   SSH (22)     - Your IP only
   HTTP (80)    - 0.0.0.0/0
   HTTPS (443)  - 0.0.0.0/0
   Custom (8000) - 0.0.0.0/0
   Custom (8787) - 0.0.0.0/0
   ```
3. **Download your SSH key** (.pem file)

### Step 2: Run Setup Script

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Download and run the setup script
wget https://raw.githubusercontent.com/your-repo/ec2-setup.sh
chmod +x ec2-setup.sh
bash ec2-setup.sh
```

### Step 3: Upload Application Files

```bash
# On your local machine (where you have the app files)
wget https://raw.githubusercontent.com/your-repo/upload-app.sh
chmod +x upload-app.sh
bash upload-app.sh
```

---

## 🛠️ Option 2: Manual Setup

### Step 1: Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 2: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 4: Install Dependencies

```bash
sudo npm install -g pm2
sudo apt install -y python3 nginx git
```

### Step 5: Create App Directory

```bash
mkdir -p ~/ai-recruitment-app/server
cd ~/ai-recruitment-app
```

### Step 6: Upload Files

Use SCP to upload your application files:

```bash
# From your local machine
scp -i your-key.pem -r ./ai-recruitment-app-regen/* ubuntu@your-ec2-ip:~/ai-recruitment-app/
```

### Step 7: Configure Environment

```bash
# On EC2
cd ~/ai-recruitment-app/server
nano .env
```

Add to `.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=8787
ALLOWED_ORIGIN=*
DEFAULT_MODEL=gpt-4o-mini
```

### Step 8: Install Server Dependencies

```bash
cd ~/ai-recruitment-app/server
npm install
```

### Step 9: Start Services

```bash
# Start API server
pm2 start server.js --name "ai-recruitment-api"

# Start static file server
cd ~/ai-recruitment-app
pm2 start "python3 -m http.server 8000" --name "ai-recruitment-static"

# Save PM2 configuration
pm2 save
pm2 startup
```

---

## 🌐 Access Your Application

After deployment, access your app at:

- **Main App:** `http://your-ec2-public-ip`
- **Direct Static:** `http://your-ec2-public-ip:8000`
- **API Server:** `http://your-ec2-public-ip:8787`

---

## 🔧 Management Commands

### Check Status

```bash
pm2 status
```

### View Logs

```bash
pm2 logs
```

### Restart Services

```bash
pm2 restart all
```

### Stop Services

```bash
pm2 stop all
```

---

## 🔒 Production Recommendations

### 1. Setup Domain & SSL

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 2. Configure Nginx (included in automated setup)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
    }

    location /api/ {
        proxy_pass http://localhost:8787;
    }
}
```

### 3. Setup Firewall

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

---

## 📊 Monitoring & Maintenance

### System Resources

```bash
htop
df -h
free -h
```

### Application Logs

```bash
pm2 logs ai-recruitment-api
pm2 logs ai-recruitment-static
```

### Update Application

1. Upload new files
2. Restart services: `pm2 restart all`

---

## 💰 Cost Estimation

- **t2.micro:** Free (first year)
- **t3.small:** ~$15/month
- **Domain:** ~$12/year
- **SSL:** Free (Let's Encrypt)

---

## 🆘 Troubleshooting

### Services Not Starting

```bash
pm2 logs
sudo systemctl status nginx
```

### Port Issues

```bash
sudo netstat -tlnp | grep -E ':(80|8000|8787)'
```

### Permission Issues

```bash
sudo chown -R ubuntu:ubuntu ~/ai-recruitment-app
```

### API Key Issues

```bash
cd ~/ai-recruitment-app/server
cat .env
```

---

## 📞 Support

If you encounter issues:

1. Check the logs: `pm2 logs`
2. Verify services: `pm2 status`
3. Check firewall: `sudo ufw status`
4. Test connectivity: `curl localhost:8000`

---

**🎉 Your AI Recruitment App is now live and ready to use!**
