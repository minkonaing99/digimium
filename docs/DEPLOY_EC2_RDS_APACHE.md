# Deploy on AWS EC2 + RDS (Apache2, PHP)

This guide deploys the admin app at `/var/www/admin.digimium.store` and the public storefront at `/var/www/digimium.store` on Ubuntu EC2 with Apache2 and Amazon RDS MySQL.

## 1. Prerequisites

- AWS account
- `admin.digimium.store` and `digimium.store` DNS records pointed to the EC2 instance
- SSH key pair (`.pem`)
- Project code in Git

## 2. Create RDS (MySQL)

1. Open AWS Console -> `RDS` -> `Create database`.
2. Engine: `MySQL` (or MariaDB if you use it).
3. Use `Production` or `Dev/Test` template.
4. Set DB name, username, password.
5. In connectivity:

- VPC: same VPC as EC2
- Public access: `No`
- Security group: allow MySQL `3306` only from the EC2 security group

6. Create DB and wait until status is `Available`.
7. Copy the RDS endpoint.

## 3. Create EC2 (Ubuntu)

1. Open AWS Console -> `EC2` -> `Launch instance`.
2. AMI: `Ubuntu 22.04 LTS`.
3. Instance type: at least `t3.micro` for a small deployment.
4. Attach or create a security group with:

- `22` SSH from your IP
- `80` HTTP from `0.0.0.0/0`
- `443` HTTPS from `0.0.0.0/0`

5. Connect:

```bash
ssh -i /path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
```

## 4. Install Apache + PHP

```bash
sudo apt update
sudo apt install -y apache2 php php-cli php-mysql php-curl php-mbstring php-xml unzip git mysql-client
sudo a2enmod rewrite headers deflate expires ssl
sudo systemctl enable apache2
sudo systemctl restart apache2
```

## 5. Deploy project files

If the repo contains both sites together:

```bash
cd /var/www
sudo git clone <YOUR_REPO_URL> Sales-Management-System
sudo ln -s /var/www/Sales-Management-System/admin.digimium.store /var/www/admin.digimium.store
sudo ln -s /var/www/Sales-Management-System/digimium.store /var/www/digimium.store
sudo chown -R www-data:www-data /var/www/Sales-Management-System
sudo find /var/www/Sales-Management-System -type d -exec chmod 755 {} \;
sudo find /var/www/Sales-Management-System -type f -exec chmod 644 {} \;
```

If you deploy them as separate checkouts, place them directly at:

- `/var/www/admin.digimium.store`
- `/var/www/digimium.store`

## 6. Configure admin environment

```bash
cd /var/www/admin.digimium.store
sudo nano .env
```

Set at least:

```dotenv
DIGIMIUM_DB_HOST=<RDS_ENDPOINT>
DIGIMIUM_DB_PORT=3306
DIGIMIUM_DB_NAME=<DB_NAME>
DIGIMIUM_DB_USER=<DB_USER>
DIGIMIUM_DB_PASS=<DB_PASSWORD>

DIGIMIUM_SESSION_NAME=ERASESSID
DIGIMIUM_SESSION_SAMESITE=Lax
DIGIMIUM_SESSION_SECURE=true
DIGIMIUM_SESSION_MAX_LIFETIME=28800

DIGIMIUM_REMEMBER_SECRET=<LONG_RANDOM_SECRET>
DIGIMIUM_STOREFRONT_PATH=/var/www/digimium.store
DIGIMIUM_STOREFRONT_PUBLIC_URL=https://digimium.store

APP_ENV=production
APP_DEBUG=false
```

## 7. Apache VirtualHosts

Create the admin site config:

```bash
sudo nano /etc/apache2/sites-available/admin.digimium.store.conf
```

```apache
<VirtualHost *:80>
    ServerName admin.digimium.store
    DocumentRoot /var/www/admin.digimium.store

    <Directory /var/www/admin.digimium.store>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/admin_digimium_error.log
    CustomLog ${APACHE_LOG_DIR}/admin_digimium_access.log combined
</VirtualHost>
```

Create the storefront site config:

```bash
sudo nano /etc/apache2/sites-available/digimium.store.conf
```

```apache
<VirtualHost *:80>
    ServerName digimium.store
    ServerAlias www.digimium.store
    DocumentRoot /var/www/digimium.store

    <Directory /var/www/digimium.store>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/digimium_store_error.log
    CustomLog ${APACHE_LOG_DIR}/digimium_store_access.log combined
</VirtualHost>
```

Enable sites:

```bash
sudo a2dissite 000-default.conf
sudo a2ensite admin.digimium.store.conf
sudo a2ensite digimium.store.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## 8. Import database schema

```bash
mysql -h <RDS_ENDPOINT> -u <DB_USER> -p <DB_NAME> < "/var/www/admin.digimium.store/new database.sql"
```

## 9. HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d admin.digimium.store -d digimium.store -d www.digimium.store
sudo certbot renew --dry-run
```

## 10. Verify deployment

- Open `https://admin.digimium.store`
- Open `https://digimium.store`
- Test login on the admin app
- Test `/product_showcase.php` and confirm it updates `/var/www/digimium.store/data/services.json`
- Upload a service image and confirm it appears under `/var/www/digimium.store/images/services`
- Check browser Network tab for failed API calls

Logs:

```bash
sudo tail -f /var/log/apache2/admin_digimium_error.log
sudo tail -f /var/log/apache2/admin_digimium_access.log
sudo tail -f /var/log/apache2/digimium_store_error.log
sudo tail -f /var/log/apache2/digimium_store_access.log
```

## 11. Security checklist

- Keep `.env` out of Git
- Restrict RDS access to the EC2 security group only
- Keep SSH (`22`) limited to your IP
- Set `APP_DEBUG=false`
- Set `DIGIMIUM_SESSION_SECURE=true`
- Use a long random `DIGIMIUM_REMEMBER_SECRET`
- Keep OS packages updated

```bash
sudo apt update && sudo apt upgrade -y
```

## 12. Update deployment

If using a shared repo checkout:

```bash
cd /var/www/Sales-Management-System
sudo git pull
sudo chown -R www-data:www-data /var/www/Sales-Management-System
sudo systemctl reload apache2
```

If using separate checkouts, pull in each site directory separately.
