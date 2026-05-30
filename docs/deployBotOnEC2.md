# Digimium Bot — Docker Deployment Guide

## Overview

This guide covers how to build, run, and deploy the Digimium Telegram bot using Docker on an AWS EC2 instance. The bot connects to an AWS RDS MySQL database and sends daily notifications to a Telegram channel.

---

## Project Structure

```
digimium-bot/
├── digimium_dashboard.py   # entry point
├── handlers.py
├── notifications.py
├── auth.py
├── db.py
├── config.py
├── requirements.txt
├── Dockerfile
└── .env                    # never commit this to git
```

---

## Prerequisites

### Local Machine

- Docker installed and running
- Docker Hub account (https://hub.docker.com)

### AWS

- EC2 instance running Ubuntu 22.04
- RDS MySQL instance
- Security groups configured correctly (see Security Groups section)

---

## Step 1 — Environment Variables

Create a `.env` file in your project root. This file holds all secrets and config. **Never commit this to git.**

```env
BOT_TOKEN=your_telegram_bot_token
BOT_PASSWORD=your_bot_password
CHANNEL_ID=your_telegram_channel_id

DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=digimium_panel
```

**Where to find your RDS endpoint:**
AWS Console → RDS → Databases → click your database → Connectivity & security → Endpoint

---

## Step 2 — Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
FROM python:3.11-slim
WORKDIR /digimium-bot
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "digimium_dashboard.py"]
```

---

## Step 3 — Build the Image Locally

```bash
docker build -t digimium-bot:v1 .
```

Verify the image was created:

```bash
docker images
```

You should see `digimium-bot` with tag `v1` in the list.

---

## Step 4 — Test Locally Before Deploying

Always test locally before pushing to EC2.

```bash
docker run --env-file .env digimium-bot:v1
```

Expected output:

```
INFO - Database connection pool created successfully
INFO - Bot running with auto-scheduler...
INFO - HTTP Request: POST .../getMe "HTTP/1.1 200 OK"
INFO - Application started
```

If you see database errors, check your `.env` values and RDS security group.

---

## Step 5 — Push Image to Docker Hub

**Login to Docker Hub:**

```bash
docker login
```

**Tag your image with your Docker Hub username:**

```bash
docker tag digimium-bot:v1 yourusername/digimium-bot:v1
```

**Push the image:**

```bash
docker push yourusername/digimium-bot:v1
```

Verify it uploaded by visiting: https://hub.docker.com/r/yourusername/digimium-bot

---

## Step 6 — Configure AWS Security Groups

Before deploying to EC2, make sure your security groups allow the right traffic.

### RDS Security Group

Add an inbound rule:

- Type: MySQL/Aurora
- Port: 3306
- Source: your EC2 security group (not an IP — use the security group ID)

This allows your EC2 to connect to RDS without exposing MySQL to the internet.

### EC2 Security Group

Add inbound rules:

- Type: SSH, Port: 22, Source: your IP (for terminal access)

---

## Step 7 — Set Up EC2

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

**Install Docker:**

```bash
sudo apt update
sudo apt install docker.io -y
sudo service docker start
sudo usermod -aG docker $USER
newgrp docker
```

**Verify Docker is running:**

```bash
docker --version
```

---

## Step 8 — Deploy on EC2

**Create the `.env` file on EC2:**

```bash
nano .env
```

Paste your production environment variables (same format as Step 1) and save with `Ctrl+O` → Enter → `Ctrl+X`.

**Pull your image from Docker Hub:**

```bash
docker pull yourusername/digimium-bot:v1
```

**Run the container:**

```bash
docker run -d --env-file .env --name digimium-bot yourusername/digimium-bot:v1
```

**Verify it's running:**

```bash
docker ps
```

**Check the logs:**

```bash
docker logs digimium-bot
```

You should see the same output as your local test.

---

## Step 9 — Keep the Bot Running After EC2 Restart

By default, Docker containers stop when EC2 reboots. Add a restart policy:

```bash
docker run -d \
  --env-file .env \
  --name digimium-bot \
  --restart unless-stopped \
  yourusername/digimium-bot:v1
```

`--restart unless-stopped` means the container automatically restarts if EC2 reboots or if the container crashes — unless you manually stop it.

---

## Useful Commands

### Check running containers

```bash
docker ps
```

### View live logs

```bash
docker logs -f digimium-bot
```

### Stop the bot

```bash
docker stop digimium-bot
```

### Start the bot again

```bash
docker start digimium-bot
```

### Remove the container

```bash
docker rm digimium-bot
```

### Deploy a new version

```bash
# On your local machine
docker build -t yourusername/digimium-bot:v2 .
docker push yourusername/digimium-bot:v2

# On EC2
docker stop digimium-bot
docker rm digimium-bot
docker pull yourusername/digimium-bot:v2
docker run -d --env-file .env --name digimium-bot --restart unless-stopped yourusername/digimium-bot:v2
```

---

## Troubleshooting

### Database connection failed

- Check your `DB_HOST` in `.env` matches your RDS endpoint exactly
- Check RDS security group allows inbound from EC2 security group on port 3306
- Check your RDS username and password are correct

### Bot token error

- Make sure `BOT_TOKEN` in `.env` is valid
- Test the token at: `https://api.telegram.org/bot<YOUR_TOKEN>/getMe`

### Container keeps restarting

```bash
docker logs digimium-bot
```

Read the error — it will tell you exactly what's wrong.

### Permission denied running Docker

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## Security Reminders

- Never commit `.env` to git — add it to `.gitignore`
- Never hardcode secrets in your Dockerfile or Python files
- Use a dedicated database user with only the permissions it needs (not root)
- Rotate your bot token if it gets exposed
