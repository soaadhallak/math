# First

```bash
sudo apt update
```

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status
```

## Fail2ban

```bash
sudo apt install fail2ban
```

```bash
sudo systemctl enable --now fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

## NVM for Node

- <https://www.nvmnode.com/guide/download.html>

```bash
nvm install 22.20.0
```

## Docker

```bash
snap install docker

docker -v

```bash
docker compose up -d

#docker compose down

#docker system prune -a --volumes -f
```

## Access from Your Laptop (to access phpmyadmin localy)

```bash
ssh -L 8081:127.0.0.1:8080 your-user@your-server-ip
```

Then open:

- `http://127.0.0.1:8081`

## Lynx

```bash
apt-get install lynx
```

## Process Manager

```bash
npm install -g pm2

pm2 -v
```

```bash
pm2 status

pm2 start npm --name "my-app" -- run start

or 

pm2 start npm --name "primegateco.com" -- run start

pm2 list

pm2 logs my-app
```

### Save process list

```bash
pm2 save
pm2 startup
# Copy and execute that command exactly as shown.
pm2 save
```

```bash
pm2 restart my-app

pm2 stop my-app

pm2 delete my-app

pm2 monit
```

## NGINX

```bash
sudo apt install nginx
```

Create one server block per domain (recommended).

Example: domain1.com → localhost:3000

nano /etc/nginx/sites-available/domain1.conf

or

nano /etc/nginx/sites-available/primegateco.com.conf

```bash
server {
    listen 80;
    server_name domain1.com www.domain1.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Example: domain2.com → localhost:3001

/etc/nginx/sites-available/domain2.conf

```bash
server {
    listen 80;
    server_name domain2.com www.domain2.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

This pattern (server_name + proxy_pass) is the standard approach for hosting multiple sites behind one reverse proxy.

Enable the configs:

```bash
sudo ln -s /etc/nginx/sites-available/domain1.conf /etc/nginx/sites-enabled/

or

sudo ln -s /etc/nginx/sites-available/primegateco.com.conf /etc/nginx/sites-enabled/

sudo ln -s /etc/nginx/sites-available/domain2.conf /etc/nginx/sites-enabled/
```

remove default file

```bash
sudo rm /etc/nginx/sites-enabled/default
```

```bash
sudo nano /etc/nginx/sites-available/default-deny.conf
```

```bash
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    return 444;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/default-deny.conf /etc/nginx/sites-enabled/
```

Test + reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Verify everything

From the server:

```bash
curl -H "Host: domain1.com" http://127.0.0.1/

or

curl -H "Host: primegateco.com" http://127.0.0.1/

curl -H "Host: domain2.com" http://127.0.0.1/
```

## Store git creds on linux

```bash
git config --global credential.helper store
# then git pull, write creds, then will be saved
```
