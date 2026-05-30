# Apache VHost Setup

This project includes ready-to-use Apache VirtualHost templates for:

- `admin.digimium.store`
- `digimium.store`

Files:

- [`admin.digimium.store.conf`](C:\xampp\htdocs\Sales-Management-System\deploy\apache\admin.digimium.store.conf)
- [`digimium.store.conf`](C:\xampp\htdocs\Sales-Management-System\deploy\apache\digimium.store.conf)

## Expected Server Paths

- Admin app: `/var/www/admin.digimium.store`
- Storefront: `/var/www/digimium.store`

Both vhosts assume Apache is allowed to read local `.htaccess` files with `AllowOverride All`.

## Enable Required Apache Modules

```bash
sudo a2enmod rewrite headers expires ssl
sudo systemctl restart apache2
```

## Copy VHost Files Into Apache

If your repo is at `/var/www/Sales-Management-System`:

```bash
sudo cp /var/www/Sales-Management-System/deploy/apache/admin.digimium.store.conf /etc/apache2/sites-available/
sudo cp /var/www/Sales-Management-System/deploy/apache/digimium.store.conf /etc/apache2/sites-available/
```

## Enable Sites

```bash
sudo a2dissite 000-default.conf
sudo a2ensite admin.digimium.store.conf
sudo a2ensite digimium.store.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## SSL Certificates

The provided vhost files already include standard Let's Encrypt certificate paths:

- `/etc/letsencrypt/live/admin.digimium.store/fullchain.pem`
- `/etc/letsencrypt/live/admin.digimium.store/privkey.pem`
- `/etc/letsencrypt/live/digimium.store/fullchain.pem`
- `/etc/letsencrypt/live/digimium.store/privkey.pem`

Generate them with:

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d admin.digimium.store -d digimium.store -d www.digimium.store
sudo certbot renew --dry-run
```

## Admin App Production Reminder

In [`admin.digimium.store/.env`](C:\xampp\htdocs\Sales-Management-System\admin.digimium.store\.env), use production-safe values:

```dotenv
DIGIMIUM_SESSION_SECURE=true
DIGIMIUM_STOREFRONT_PATH=/var/www/digimium.store
DIGIMIUM_STOREFRONT_PUBLIC_URL=https://digimium.store
APP_ENV=production
APP_DEBUG=false
```

## Related Files

- [`admin.digimium.store/.htaccess`](C:\xampp\htdocs\Sales-Management-System\admin.digimium.store\.htaccess)
- [`digimium.store/.htaccess`](C:\xampp\htdocs\Sales-Management-System\digimium.store\.htaccess)
- [`admin.digimium.store/DEPLOY_EC2_RDS_APACHE.md`](C:\xampp\htdocs\Sales-Management-System\admin.digimium.store\DEPLOY_EC2_RDS_APACHE.md)
