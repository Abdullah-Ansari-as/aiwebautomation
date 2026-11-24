# Deploying WebAIAutomation on Oracle Cloud (Ampere A1, Ubuntu 24.04)

This guide takes you from no server at all to https://webaiautomation.com running on one Oracle Cloud Infrastructure (OCI) virtual machine. Everything runs on that one machine:

```
Internet ──443/80──▶ nginx ──▶ Next.js (127.0.0.1:3000, systemd) ──▶ MongoDB (127.0.0.1:27017, auth on)
                                                                 └──▶ Resend API (email notifications)
```

| Item | Choice |
| --- | --- |
| VM shape | `VM.Standard.A1.Flex`, 2 OCPUs, 12 GB RAM, 50 GB boot volume (ARM64 / aarch64) |
| OS | Canonical Ubuntu 24.04 LTS (aarch64 image), on a kernel MongoDB 8 supports (step 4) |
| Node.js | 22 LTS (the version the app was tested with). Minimum 20.19 (MongoDB driver 7) |
| Database | MongoDB Community Server 8.0, localhost only, authentication enabled |
| Web server | nginx reverse proxy, HTTPS from Let's Encrypt (Certbot) |
| Process manager | systemd (units in `deploy/systemd/`). PM2 isn't needed |
| Canonical address | `https://webaiautomation.com`. `www` and `http://` redirect to it |

Commands shown as `$` run **on your computer**. All others run **on the server** over SSH as the default `ubuntu` user, unless marked otherwise. Replace everything written `<like-this>`. Steps marked **Verify on the VM** depend on what Oracle and Ubuntu publish on the day you deploy, so check the output before continuing.

> **Before you start:** the Always Free tier allows up to 4 OCPUs and 24 GB RAM of Ampere A1 in total, plus 200 GB of block storage. A1 capacity is sometimes unavailable ("Out of host capacity"). If that happens, try another availability domain or try again later. Upgrading the account to Pay As You Go usually helps, and Always Free resources stay free. Check your own account's limits under **Governance → Limits** before relying on this.

---

## 1. Create the Oracle Cloud VM

1. Sign in to the OCI Console and pick your **home region**. Always Free resources must be in the home region.
2. **Networking → Virtual Cloud Networks → Start VCN Wizard → "Create VCN with Internet Connectivity"**. Accept the defaults and create.
3. **Compute → Instances → Create instance**:
   - **Name:** `webaiautomation`
   - **Image:** *Change image → Ubuntu → Canonical Ubuntu 24.04* (choose the **aarch64** build if asked).
   - **Shape:** *Change shape → Ampere → `VM.Standard.A1.Flex`*, **2 OCPUs**, **12 GB** memory.
   - **Networking:** the VCN you just created, its **public** subnet, *Assign a public IPv4 address*.
   - **SSH keys:** *Upload public key files* (see step 2) or paste your public key.
   - **Boot volume:** *Specify a custom boot volume size* → **50 GB**.
4. Create the instance and wait until it shows **Running**.
5. **Give it a permanent (reserved) public IP.** The address assigned at creation is *ephemeral*. A reserved IP stays yours even if you re-create the VM, so your DNS never has to change. Do this **before** creating DNS records:
   1. **Networking → IP Management → Reserved public IPs → Reserve public IP address**. Use the same compartment as the VM.
   2. Open the instance → **Attached VNICs** → the primary VNIC → **IPv4 Addresses**. On the primary private IP, open the **⋮** menu → **Edit**.
   3. A private IP can hold only one public IP. Select **No public IP** and save. The ephemeral address is released for good, and an open SSH session drops.
   4. **Edit** again, select **Reserved public IP → Select existing reserved IP**, choose the one from step 1, and save.

   Use this reserved address from now on (`<public-ip>`). Console wording varies slightly between OCI releases.
6. **Cloud firewall: Security List rules.** Go to *Networking → Virtual Cloud Networks → your VCN → Security Lists → Default Security List*. The ingress rules must end up as:

   | Source | Protocol | Dest. port | Purpose |
   | --- | --- | --- | --- |
   | `<your-ip>/32` (recommended) or `0.0.0.0/0` | TCP | 22 | SSH |
   | `0.0.0.0/0` | TCP | 80 | HTTP + Let's Encrypt validation |
   | `0.0.0.0/0` | TCP | 443 | HTTPS |

   The wizard already created the port 22 rule. Edit its source to your own IP if you have a stable one. Add the 80 and 443 rules with **Add Ingress Rules**. **Never add 27017 (MongoDB) or 3000 (the app).** The VM itself also has a firewall; step 15 opens 80/443 there.

## 2. Connect with SSH keys

Create a key pair on your computer if you don't have one, and upload the **.pub** file in step 1.3:

```bash
$ ssh-keygen -t ed25519 -f ~/.ssh/oci_webaiautomation -C "webaiautomation"
$ ssh -i ~/.ssh/oci_webaiautomation ubuntu@<public-ip>
```

Password login is disabled on OCI Ubuntu images. Keep the private key safe and back it up: without it you can't log in. If you ever lock yourself out, the OCI Console's **Console connection** (serial console) on the instance page is the recovery route.

## 3. Refresh package lists and check the platform

Don't run a full upgrade yet. The kernel must be chosen first (step 4).

```bash
sudo apt update
sudo apt install -y git curl gnupg ca-certificates
sudo timedatectl set-timezone UTC
uname -m                         # must print: aarch64
lscpu | grep -i "model name"     # Ampere A1 = Neoverse-N1 (ARMv8.2-A; MongoDB requires ARMv8.2-A or later)
uname -r                         # the running kernel — used in step 4
```

No compiler (`build-essential`) is needed. The project has no native modules that build from source (see step 5).

**Optional:** add 2 GB of swap as a safety net for builds:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. Choose a kernel that MongoDB 8 supports

**Why this matters:** MongoDB 8 refuses to start on Linux kernels **6.19 up to and including 7.0.13**. The mongod log reports that these kernel versions have a known incompatibility, caused by the kernel's restartable-sequences (rseq) changes and the memory allocator inside mongod. Ubuntu 24.04 now ships kernels in that range:
- Ubuntu 24.04.5 (September 2026) brought a **7.0** kernel.
- When this guide was written, the Oracle cloud kernel package `linux-oracle` in `noble-updates` pointed to a 7.0 kernel.

So **don't assume** your VM's kernel is safe, and don't let a routine upgrade move it. MongoDB may change this list. Check the "Production Notes" page of the MongoDB manual on the day you deploy.

**4.1 Check every kernel on the machine.** Paste this helper into your SSH session:

```bash
check_kernel() {
  local v="${1%%-*}"
  if dpkg --compare-versions "$v" lt 6.19; then echo "OK for MongoDB 8:            $1"
  elif dpkg --compare-versions "$v" lt 7.0.14; then echo "INCOMPATIBLE with MongoDB 8: $1"
  else echo "CHECK MongoDB's production notes before using: $1"; fi
}
check_kernel "$(uname -r)"                                       # the running kernel
for k in /boot/vmlinuz-*; do check_kernel "${k#/boot/vmlinuz-}"; done   # every installed kernel
apt-cache policy linux-oracle | sed -n 1,3p                      # what the default (rolling) track would install
```

**4.2 Use the 6.8 kernel series.** It's Ubuntu 24.04's original kernel line, and it stays below the affected range for good. **Verify on the VM** that the versioned package exists for arm64 and that it points to 6.8 kernels:

```bash
apt-cache policy linux-oracle-6.8 | sed -n 1,3p
apt-cache show linux-oracle-6.8 | grep -m1 '^Depends'     # must mention 6.8.0-... packages
```

If `linux-oracle-6.8` isn't available, stop. Pick another versioned track below 6.19 that `apt-cache policy` shows for arm64, for example `linux-oracle-6.17`, and check its `Depends` line the same way.

**If `uname -r` ends in `-generic` instead of `-oracle`,** your image uses Ubuntu's generic kernel. Use the same steps with these names: `linux-generic` is the 6.8 track, and `linux-generic-hwe-24.04`, `linux-image-generic-hwe-24.04` and `linux-headers-generic-hwe-24.04` are the rolling packages to remove.

**4.3 Switch tracks, block incompatible kernels, then upgrade.** First, take a safety copy. In the OCI Console go to **Compute → Instances → your instance → Boot volume → Create manual backup**, and wait until it shows Available. Then:

```bash
# a) Install the 6.8 kernel track alongside whatever is there now
sudo apt install -y linux-oracle-6.8
ls /boot/vmlinuz-6.8.*                     # must list at least one 6.8 kernel before you continue

# b) Remove the rolling meta-packages so nothing pulls in newer kernel series
#    (only the ones that are installed are removed; the kernel itself stays for now)
ROLLING=$(dpkg-query -W -f='${db:Status-Abbrev} ${Package}\n' linux-oracle linux-image-oracle linux-headers-oracle linux-tools-oracle 2>/dev/null | awk '$1=="ii"{print $2}')
echo "Rolling meta-packages to remove: ${ROLLING:-none}"
[ -n "$ROLLING" ] && sudo apt remove -y $ROLLING

# c) Tell apt never to install a kernel from the affected series (unattended upgrades respect this)
sudo tee /etc/apt/preferences.d/mongodb-kernel-guard >/dev/null <<'EOF'
# MongoDB 8 refuses to start on Linux 6.19 - 7.0.13. Never install those kernel series.
# Review this file only after MongoDB's production notes say a newer kernel is supported.
Package: linux-image-6.19* linux-image-unsigned-6.19* linux-image-7.0.* linux-image-unsigned-7.0.*
Pin: version *
Pin-Priority: -1
EOF
apt-cache policy linux-oracle-6.8 | sed -n 1,3p          # still has a candidate (6.8 is not blocked)

# d) Now the full upgrade is safe
sudo apt full-upgrade -y
```

**4.4 Remove any incompatible kernel that's already installed, then reboot into 6.8:**

```bash
BAD=$(for k in /boot/vmlinuz-*; do v="${k#/boot/vmlinuz-}"; n="${v%%-*}"; \
  dpkg --compare-versions "$n" ge 6.19 && dpkg --compare-versions "$n" lt 7.0.14 && echo "$v"; done)
echo "Incompatible kernels installed: ${BAD:-none}"
# Purge every installed package of those kernels (image, unsigned image, modules, headers, tools)
for v in $BAD; do
  PKGS=$(dpkg-query -W -f='${db:Status-Abbrev} ${Package}\n' "*${v}*" 2>/dev/null | awk '$1=="ii"{print $2}')
  echo "Removing: $PKGS"; sudo apt purge -y $PKGS
done
```

- If you're *currently running* one of these kernels, apt asks whether to abort removing the running kernel. Answer **No**: the system keeps running from memory and boots the remaining 6.8 kernel next time.
- Only proceed if `ls /boot/vmlinuz-6.8.*` still lists a kernel.

```bash
sudo apt autoremove --purge -y
sudo reboot                       # reconnect after ~1 minute
uname -r                          # must start with 6.8
for k in /boot/vmlinuz-*; do check_kernel "${k#/boot/vmlinuz-}"; done   # re-paste check_kernel from 4.1 first; all "OK"
```

If the VM doesn't come back, use the **Console connection** (serial console) on the instance page, or restore the boot volume backup from step 4.3.

**4.5 Keep it that way:**
- `linux-oracle-6.8` keeps delivering security updates *within* 6.8. The guard file stops apt and unattended upgrades from installing 6.19 / 7.0.x kernels.
- After any update that installs a kernel, run the `for k in /boot/vmlinuz-*` check **before** rebooting.
- If mongod ever fails to start after a reboot, check `uname -r` first (see Troubleshooting).

## 5. Install Node.js

The app needs Node.js ≥ 20.19 (required by the MongoDB driver; Next.js needs ≥ 20.9) and was tested with Node 22. Install Node 22 LTS from NodeSource. It provides native ARM64 builds.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v      # v22.x
```

**ARM64 compatibility:** the project has no native modules that compile from source. Its native dependencies all ship prebuilt `linux-arm64` packages, and they're recorded in `package-lock.json`:
- Next.js SWC compiler: `@next/swc-linux-arm64-gnu`
- Image optimization: `sharp`, via `@img/sharp-linux-arm64`
- Tailwind CSS: `@tailwindcss/oxide-linux-arm64-gnu`, `lightningcss-linux-arm64-gnu`
- Test tooling: `@esbuild/linux-arm64`, `@rollup/rollup-linux-arm64-gnu`

The MongoDB driver is pure JavaScript. Node 22 reaches end of life in April 2027; plan the move to the next LTS before then.

## 6. Install MongoDB Community Server 8.0

These steps follow MongoDB's official Ubuntu instructions. The Ubuntu 24.04 ("noble") repository provides both `amd64` and `arm64` packages. **Finish step 4 first.**

```bash
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
  | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt update
sudo apt install -y mongodb-org
which mongosh mongodump mongorestore   # all three should be found
sudo systemctl enable --now mongod
sudo systemctl status mongod --no-pager    # must be "active (running)"
```

- If `mongodump`/`mongorestore` are missing, run `sudo apt install -y mongodb-database-tools`. If `mongosh` is missing, run `sudo apt install -y mongodb-mongosh`.
- If mongod fails to start, run `sudo tail -n 50 /var/log/mongodb/mongod.log`. A kernel-incompatibility message means step 4 wasn't completed.

Files: the config is `/etc/mongod.conf`, the data lives in `/var/lib/mongodb` and the log is `/var/log/mongodb/mongod.log`.

## 7. Enable MongoDB authentication

**7.1 Create an administrator.** Authentication is still off, so `mongosh` connects from localhost without a password. Generate the password first with `openssl rand -hex 24` and save it in your password manager (see step 12). Then start an interactive shell:

```bash
mongosh
```

Inside `mongosh`, type:

```javascript
use admin
db.createUser({ user: "siteAdmin", pwd: passwordPrompt(), roles: [ "userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase" ] })
exit
```

`passwordPrompt()` asks for the password without echoing it. It doesn't appear on screen, in your shell history or in `ps`. Don't feed these commands through a heredoc or pipe: the prompt needs an interactive terminal.

**7.2 Turn on authorization and confirm the localhost-only binding.** Edit `/etc/mongod.conf` (`sudo nano /etc/mongod.conf`) so these sections read:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1      # localhost only — never 0.0.0.0

security:
  authorization: enabled
```

```bash
sudo systemctl restart mongod
mongosh --quiet --eval 'db.adminCommand({ listDatabases: 1 })'   # must now FAIL with "requires authentication"
```

## 8. Create the application database and users

Generate two more passwords (`openssl rand -hex 24`) and save them. Log in as the administrator; it asks for the password:

```bash
mongosh --quiet -u siteAdmin --authenticationDatabase admin
```

Then, inside `mongosh`:

```javascript
// App user: read/write on the app database only — no admin rights.
use webaiautomation
db.createUser({ user: "webaiautomation_app", pwd: passwordPrompt(), roles: [ { role: "readWrite", db: "webaiautomation" } ] })

// Backup user: read-only on the app database (used by mongodump).
use admin
db.createUser({ user: "webaiautomation_backup", pwd: passwordPrompt(), roles: [ { role: "read", db: "webaiautomation" } ] })
exit
```

| User | Database | Roles | Used by |
| --- | --- | --- | --- |
| `siteAdmin` | admin | user admin, db admin, read/write any DB | you; `npm run db:setup`; restores |
| `webaiautomation_app` | webaiautomation | `readWrite` on `webaiautomation` | the website |
| `webaiautomation_backup` | admin | `read` on `webaiautomation` | nightly backups |

## 9. Keep MongoDB on localhost (verify)

```bash
sudo ss -ltnp | grep 27017      # must show 127.0.0.1:27017 only
```

Port 27017 is in neither the OCI Security List (step 1.6) nor the instance firewall (step 15). Both layers block it.

## 10. Get the code onto the server

Create a dedicated, unprivileged user that owns and runs the app:

```bash
sudo adduser --system --group --home /srv/webaiautomation --shell /usr/sbin/nologin webapp
sudo mkdir -p /srv/webaiautomation && sudo chown webapp:webapp /srv/webaiautomation
```

Every command that acts as this user below uses `sudo -u webapp -H`. The `-H` sets `HOME=/srv/webaiautomation`, so git finds the deploy key and npm uses its own cache.

**If the repository is private,** give the server a read-only deploy key:

```bash
sudo -u webapp -H mkdir -p -m 700 /srv/webaiautomation/.ssh
sudo -u webapp -H ssh-keygen -t ed25519 -N "" -f /srv/webaiautomation/.ssh/id_ed25519 -C "webaiautomation-server"
sudo cat /srv/webaiautomation/.ssh/id_ed25519.pub
```

Add that key in GitHub under **Repository → Settings → Deploy keys → Add deploy key**, and leave "Allow write access" **unchecked**. Then clone (answer "yes" to the GitHub host-key prompt):

```bash
sudo -u webapp -H git clone git@github.com:<your-account>/<your-repo>.git /srv/webaiautomation/app-tmp
sudo -u webapp -H bash -c 'shopt -s dotglob && mv /srv/webaiautomation/app-tmp/* /srv/webaiautomation/ && rmdir /srv/webaiautomation/app-tmp'
```

> The project has no Git remote yet. Push it to GitHub (or another Git host) from your computer first. Never commit `.env*` files; `.gitignore` already excludes them.

## 11. Install npm dependencies

```bash
cd /srv/webaiautomation
sudo -u webapp -H npm ci
```

`npm ci` installs exactly what `package-lock.json` specifies, including the ARM64 native packages. Development dependencies are needed for the build (TypeScript, Tailwind), so don't use `--omit=dev`.

## 12. Passwords and production environment variables

**12.1 Generate every secret as hexadecimal:**

```bash
openssl rand -hex 24      # run once per secret; 48 characters of 0-9a-f
```

Use a separate output for each of: `ADMIN_PASSWORD`, `AUTH_SECRET`, and the three MongoDB passwords (siteAdmin, app, backup). Store them in your password manager. The app requires ADMIN_PASSWORD ≥ 12 and AUTH_SECRET ≥ 32 characters; 48 hex characters meets both with 192 bits of randomness.

**Why hex and not a password-manager default:** `.env` files have special characters. These were tested against this project:
- **`#` starts a comment** in unquoted values, in both Next.js and Node's `--env-file`: `abc#defGHIjkl12` is read as `abc`.
- **`$` is expanded as a variable by Next.js**, even inside single quotes: `abc$HOMExyz…` is read as `abc` or something else entirely. Node's `--env-file` (used by `npm run db:setup` and `npm run email:test`) does *not* expand it, so the app and the scripts would see different values.
- **Quotes, spaces and backslashes** add more parsing rules.

A mangled `ADMIN_PASSWORD` either becomes a different, weaker password or falls below 12 characters, and then admin sign-in is disabled. Hex characters have no special meaning anywhere: not in `.env` files, the shell, or MongoDB connection strings (no URL-encoding needed). Password checking in the app is unchanged: constant-time comparison, minimum lengths enforced.

**12.2 Create the environment file.** Only `webapp` can read it:

```bash
# creates an empty, owner-only file — only if it doesn't exist yet (never overwrite a filled-in one)
[ -e /srv/webaiautomation/.env.production.local ] || sudo install -m 600 -o webapp -g webapp /dev/null /srv/webaiautomation/.env.production.local
sudo -u webapp -H nano /srv/webaiautomation/.env.production.local
```

```dotenv
# MongoDB — app user from step 8
MONGODB_URI=mongodb://webaiautomation_app:<app-password-hex>@127.0.0.1:27017/webaiautomation?authSource=webaiautomation
MONGODB_DB_NAME=webaiautomation

# Admin login (super admin = ADMIN_EMAIL + ADMIN_PASSWORD; team members are added in /admin/team)
AUTH_SECRET=<openssl rand -hex 24>
ADMIN_EMAIL=<your login email>
ADMIN_PASSWORD=<openssl rand -hex 24>
ADMIN_NAME=<your name, optional>
APP_URL=https://webaiautomation.com

# Email notifications (Resend)
RESEND_API_KEY=<re_... key from resend.com>
EMAIL_FROM=WebAIAutomation <leads@webaiautomation.com>
LEADS_NOTIFY_EMAIL=<inbox that should receive new leads>

# Public (read at BUILD time; rebuild after changing)
NEXT_PUBLIC_WHATSAPP_NUMBER=<digits only, with country code, e.g. 15551234567>
NEXT_PUBLIC_BOOKING_URL=<Calendly / Cal.com link, optional>
```

> **Using MongoDB Atlas instead of a self-hosted MongoDB?** Skip the MongoDB install steps, create a database user in Atlas (role: *readWrite* on `webaiautomation`, or *Atlas admin* just for the first `npm run db:setup`), allow the server's public IP under **Atlas → Network Access**, and set `MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/webaiautomation?retryWrites=true&w=majority`. Use a hex password (no URL-encoding needed). Backups are then handled by Atlas.

- Next.js loads `.env.production.local` automatically for `next build` and `next start`. The `npm run db:setup` and `email:test` scripts read it too.
- `EMAIL_FROM` must use a domain you have verified in Resend (**Resend → Domains**). Add the DNS records Resend shows you. The `Name <address>` form shown parses correctly.
- Changing `ADMIN_PASSWORD` or `AUTH_SECRET` signs out every admin session. That's intended.
- Never copy this file into the repository or paste it into chats or tickets.

## 13. Prepare the database and build

**13.1 Create collections, validators and indexes** using the administrator (collMod needs `dbAdmin`). The password is read by a hidden prompt and handed to the script through a preserved environment variable. It never appears on a command line, so it stays out of `ps`, out of shell history and out of the sudo log (which records command lines):

```bash
cd /srv/webaiautomation
read -rs -p "siteAdmin password: " MPW && echo
export MONGODB_SETUP_URI="mongodb://siteAdmin:${MPW}@127.0.0.1:27017/?authSource=admin"
unset MPW
sudo -u webapp -H --preserve-env=MONGODB_SETUP_URI npm run db:setup
unset MONGODB_SETUP_URI
```

- Expected output: `created collection: leads`, `lead_notes` and `rate_limits` with their indexes, then `Database "webaiautomation" is ready.`
- The script never prints the connection string. On errors, credentials are redacted.
- It's safe to re-run; it never deletes data.
- The `ubuntu` user's default sudo rule (`ALL`) permits `--preserve-env`. If your sudo policy refuses it ("not allowed to preserve the environment"), ask an administrator to allow it rather than putting the URI on the command line.

**13.2 Build:**

```bash
sudo -u webapp -H npm run build
```

The build prerenders about 100 pages and should finish in a few minutes on 2 OCPUs. It doesn't need the database.

## 14. Start the app with systemd

```bash
sudo cp /srv/webaiautomation/deploy/systemd/webaiautomation.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now webaiautomation
sudo systemctl status webaiautomation --no-pager
curl -sI http://127.0.0.1:3000 | head -1          # HTTP/1.1 200 OK
journalctl -u webaiautomation -n 50 --no-pager     # recent logs
```

- The unit runs as `webapp`, listens on **127.0.0.1:3000 only** (`next start -H 127.0.0.1`), restarts on failure and uses systemd sandboxing.
- *If you use PM2 instead,* start the app with `next start -p 3000 -H 127.0.0.1`. Plain `npm start` listens on all interfaces.

## 15. Instance firewall (do this before nginx and HTTPS)

OCI has **two** firewalls, and a port is reachable only if **both** allow it:

| Port | OCI Security List (step 1.6) | Instance iptables (this step) |
| --- | --- | --- |
| 22 (SSH) | allowed (ideally your IP only) | allowed by Oracle's default rules |
| 80 (HTTP, Let's Encrypt) | allowed | **add now** |
| 443 (HTTPS) | allowed | **add now** |
| 27017 (MongoDB), 3000 (app) | **never** | **never** (and both listen on 127.0.0.1 anyway) |

Oracle's Ubuntu images ship `iptables` rules that end with a `REJECT` rule. Insert ACCEPT rules **above** it:

```bash
sudo iptables -L INPUT -n --line-numbers          # find the line number of the REJECT rule (often 5 or 6)
sudo iptables -I INPUT <reject-line> -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT <reject-line> -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save                     # persist across reboots
sudo iptables -L INPUT -n --line-numbers          # 22, 80 and 443 ACCEPT rules must all appear before REJECT
```

- Don't enable `ufw` on top of Oracle's iptables rules; the two conflict.
- Don't delete Oracle's `InstanceServices` rules.
- Never add rules for 27017 or 3000.

## 16. nginx — phase 1 (HTTP, for obtaining the certificate)

```bash
sudo apt install -y nginx
sudo cp /srv/webaiautomation/deploy/nginx/webaiautomation.conf /etc/nginx/sites-available/webaiautomation
sudo ln -s /etc/nginx/sites-available/webaiautomation /etc/nginx/sites-enabled/webaiautomation
sudo rm -f /etc/nginx/sites-enabled/default        # our config provides the catch-all server
sudo nginx -t && sudo systemctl reload nginx
curl -sI -H "Host: webaiautomation.com" http://127.0.0.1/ | head -1   # HTTP/1.1 200 OK (proxied to the app)
curl -sI http://127.0.0.1/ | head -1 || true       # empty reply: unknown host names get no response (catch-all)
```

- The config **overwrites** `X-Real-IP` and `X-Forwarded-For` with the real client address. The app's rate limiting trusts these headers, so keep those lines if you edit the file.
- Requests for any other host name, such as scanners hitting the raw IP, are dropped.

## 17. Domain and HTTPS

**17.1 DNS.** At your domain's DNS provider, create these records (TTL 300 while testing):

| Type | Name | Value |
| --- | --- | --- |
| A | `@` (webaiautomation.com) | `<public-ip>` (the reserved IP) |
| A | `www` | `<public-ip>` |

Wait until `dig +short webaiautomation.com` and `dig +short www.webaiautomation.com` both return the server's IP. `http://webaiautomation.com` should now load the site; the firewall from step 15 is already open.

**17.2 Get the certificate** (both names on one certificate):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d webaiautomation.com -d www.webaiautomation.com \
  -m <your-email> --agree-tos --no-eff-email --deploy-hook "systemctl reload nginx"
```

`certonly` gets the certificate without editing your nginx files. The deploy hook is saved with the renewal settings, so nginx reloads the new certificate after every automatic renewal.

**17.3 nginx — phase 2 (HTTPS, final).** This replaces the phase-1 file at the same path:

```bash
sudo cp /srv/webaiautomation/deploy/nginx/webaiautomation-https.conf /etc/nginx/sites-available/webaiautomation
sudo nginx -t && sudo systemctl reload nginx
```

What it does:
- **`https://webaiautomation.com`** is the site.
- **`http://` (both names) and `https://www.webaiautomation.com`** permanently redirect (301) to `https://webaiautomation.com`.
- **Unknown host names** are dropped on port 80 and refused during the TLS handshake on 443, so no certificate is revealed.
- **While the app is stopped,** visitors see a short "We'll be right back" page with status 503 (step 21).

Check it from your computer:

```bash
$ curl -sI https://webaiautomation.com/ | head -1                     # HTTP/2 200
$ curl -sI https://www.webaiautomation.com/ | grep -iE "^HTTP|^location"  # 301 → https://webaiautomation.com/
$ curl -sI http://webaiautomation.com/ | grep -iE "^HTTP|^location"       # 301 → https://webaiautomation.com/
```

**17.4 Enable HSTS** once those three checks pass. In `/etc/nginx/sites-available/webaiautomation`, in the `server_name webaiautomation.com;` server block, uncomment:

```nginx
add_header Strict-Transport-Security "max-age=31536000" always;
```

then `sudo nginx -t && sudo systemctl reload nginx`. Add `includeSubDomains` only if every subdomain you'll ever use serves HTTPS. The app itself also sends `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` headers.

**17.5 Renewal:**

```bash
sudo systemctl status certbot.timer --no-pager      # automatic renewal is scheduled
sudo certbot renew --dry-run                        # must end with "Congratulations, all simulated renewals succeeded"
```

## 18. MongoDB backups

The scripts are `scripts/mongo-backup.sh` and `scripts/mongo-restore.sh`. Credentials live in root-only config files, never on a command line, in a heredoc or in a log.

**18.1 Credentials files.** Create each file empty with mode 600 first (the `test -e ||` guard never overwrites an existing file), then type the single line into it with nano. Don't use `echo` or heredocs for passwords: typed heredoc lines are saved in your shell history.

```bash
sudo install -d -m 700 -o root -g root /etc/webaiautomation
sudo test -e /etc/webaiautomation/mongodump.yaml || sudo install -m 600 -o root -g root /dev/null /etc/webaiautomation/mongodump.yaml
sudo nano /etc/webaiautomation/mongodump.yaml
```

Content (one line; backup user from step 8):

```yaml
uri: mongodb://webaiautomation_backup:<backup-password-hex>@127.0.0.1:27017/?authSource=admin
```

```bash
sudo test -e /etc/webaiautomation/mongorestore.yaml || sudo install -m 600 -o root -g root /dev/null /etc/webaiautomation/mongorestore.yaml
sudo nano /etc/webaiautomation/mongorestore.yaml
```

Content (one line; administrator):

```yaml
uri: mongodb://siteAdmin:<admin-password-hex>@127.0.0.1:27017/?authSource=admin
```

```bash
sudo ls -l /etc/webaiautomation/      # both files: -rw------- root root
```

The scripts refuse to run if a config file is readable by anyone but its owner. mongodump and mongorestore read the URI from the file (`--config`), so it never appears in `ps` or in the systemd journal. If you'd rather not keep the administrator password on disk, create `mongorestore.yaml` only when you need to restore, and delete it afterwards with `sudo shred -u`.

**18.2 Install the scripts root-owned.** The checkout belongs to `webapp`, so root must never run scripts from it:

```bash
sudo install -o root -g root -m 755 /srv/webaiautomation/scripts/mongo-backup.sh /usr/local/sbin/webaiautomation-backup
sudo install -o root -g root -m 755 /srv/webaiautomation/scripts/mongo-restore.sh /usr/local/sbin/webaiautomation-restore
sudo webaiautomation-backup        # first manual run → /var/backups/webaiautomation/webaiautomation-<timestamp>.archive.gz
```

These are **copies**. When an update changes `scripts/mongo-backup.sh` or `scripts/mongo-restore.sh`, run the two `install` commands again (step 21 checks this for you).

**18.3 Schedule a daily backup** at 03:15 UTC:

```bash
sudo cp /srv/webaiautomation/deploy/systemd/webaiautomation-backup.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now webaiautomation-backup.timer
systemctl list-timers webaiautomation-backup.timer
journalctl -u webaiautomation-backup --no-pager | tail
```

**18.4 Retention.** By default, **nothing is ever deleted**. To keep only the last *N* days, uncomment `Environment=RETENTION_DAYS=30` in `/etc/systemd/system/webaiautomation-backup.service` and run `sudo systemctl daemon-reload`. That deletes archives (and their `.sha256` files) older than 30 days from `/var/backups/webaiautomation` only. Choose the number deliberately and write it down.

**18.5 Keep copies off the server.** A backup on the same disk doesn't survive losing the VM. Archives contain customer data, so store copies privately and encrypted. For example:
- **OCI Object Storage:** create a **private** bucket, install the OCI CLI, and run `oci os object put --bucket-name <bucket> --file <archive>`.
- **rclone** to any S3-compatible or other storage you control: `rclone copy /var/backups/webaiautomation <remote>:<bucket>`.

Archives are root-only (mode 600) on the server, so copy them as root or via a root-owned job.

**18.6 Restore.** Practise this before you need it.

```bash
# 1) Safe test: restore into a scratch database and inspect it
sudo webaiautomation-restore /var/backups/webaiautomation/<archive>.archive.gz --to webaiautomation_restore_test
mongosh --quiet -u siteAdmin --authenticationDatabase admin --eval 'db.getSiblingDB("webaiautomation_restore_test").leads.countDocuments()'
mongosh --quiet -u siteAdmin --authenticationDatabase admin --eval 'db.getSiblingDB("webaiautomation_restore_test").dropDatabase()'

# 2) Real recovery into the live database (stop the app first)
sudo systemctl stop webaiautomation
sudo webaiautomation-restore /var/backups/webaiautomation/<archive>.archive.gz --drop
sudo systemctl start webaiautomation
```

The restore script verifies the `.sha256` checksum and asks you to type the target database name before it writes anything. Without `--drop`, documents that already exist are skipped and the current version is kept, so only missing documents are added. With `--drop`, each collection is replaced by the backup's version, including its indexes and validator.

## 19. Security notes for operators

- **Admin sign-in** is limited to 8 attempts per 15 minutes per client IP. Counters are stored in MongoDB and shared by every app process.
- **If MongoDB is unreachable,** the same limits are enforced from the app process's memory, and the log says so once ("MongoDB unavailable; enforcing limits from this process's memory"). Limitations of this fallback:
  - It's per process and resets on restart.
  - It isn't shared between multiple app instances (this guide runs one).
  - Any other unexpected rate-limiter error makes sign-in refuse, rather than allow, attempts.
- **Client IPs** for rate limiting come from the `X-Real-IP` header that nginx sets. If you ever put a proxy or CDN (e.g. Cloudflare) in front of nginx, configure nginx's `real_ip` module for that provider. Otherwise all visitors share the proxy's IP and its rate-limit bucket.
- **Logs** (`journalctl -u webaiautomation`) never contain passwords, connection strings, API keys or raw visitor IPs. nginx access logs (`/var/log/nginx/`) do contain visitor IPs; Ubuntu rotates them.

## 20. Test the production site

Do this after HTTPS works (step 17). The admin session cookie is `Secure`, so admin sign-in only works over `https://`.

1. **Pages:** `https://webaiautomation.com`, `/services`, `/tools`, `/automation`, `/advertise` and `/free-ai-tools/word-counter` all load. `http://` and `www.` redirect to `https://webaiautomation.com`.
2. **Email setup:**
   ```bash
   cd /srv/webaiautomation && sudo -u webapp -H npm run email:test
   ```
   It must print `Accepted by Resend (200)`, and the email must arrive at `LEADS_NOTIFY_EMAIL`. Check spam too. If Resend returns 403/422, the sending domain isn't verified or `EMAIL_FROM` doesn't match it.
3. **Inquiry form:** open `https://webaiautomation.com/services#quote`, wait a few seconds, fill in real-looking details and submit. You should see "your request has been received" with a reference (`WAA-XXXXXX`).
4. **Notification:** an email titled "Service inquiry WAA-…" arrives. "Reply" goes to the visitor's address.
5. **Admin:** `https://webaiautomation.com/admin` sends you to `/admin/login`. A wrong password shows an error; the right password opens the dashboard. **Leads** lists the inquiry. On the lead page, *Email notification* shows **Sent**. Change the status and add a note, then reload: both are saved.
6. **Sponsor form:** `/advertise#sponsor-inquiry` creates a lead marked *Sponsor*.
7. **Security spot-checks** from your computer:
   ```bash
   $ curl -sI https://webaiautomation.com/admin/leads | head -3   # 307 redirect to /admin/login
   $ nc -vz -w 5 <public-ip> 27017                               # must fail
   $ nc -vz -w 5 <public-ip> 3000                                # must fail
   $ curl -sI http://<public-ip>/                                # empty reply (catch-all)
   ```
8. **Data:**
   ```bash
   mongosh -u siteAdmin --authenticationDatabase admin --eval 'db.getSiblingDB("webaiautomation").leads.find({}, {reference:1, email:1, status:1}).toArray()'
   ```
   To remove your test inquiries afterwards: `db.getSiblingDB("webaiautomation").leads.deleteOne({ reference: "WAA-XXXXXX" })`, plus the matching `lead_notes` by `leadReference`.

Logs: `journalctl -u webaiautomation`, `/var/log/nginx/error.log` and `/var/log/mongodb/mongod.log`.

## 21. Updating and redeploying (maintenance window)

`npm ci` deletes and reinstalls `node_modules`, and `npm run build` replaces `.next`. The running app depends on both, so **the site will not work correctly while they run** (several minutes on 2 OCPUs). Don't run them against a live app. Use this procedure. While the app is stopped, nginx shows visitors a "We'll be right back" page (503).

```bash
cd /srv/webaiautomation

# 1) Prepare (site still up): back up, record the current version, fetch the update
sudo webaiautomation-backup
PREV=$(sudo -u webapp -H git rev-parse HEAD); echo "Rollback point: $PREV"
sudo -u webapp -H git fetch
sudo -u webapp -H git log --oneline HEAD..@{u}                     # what will change

# 2) Maintenance window starts
sudo systemctl stop webaiautomation
sudo -u webapp -H git pull --ff-only
sudo -u webapp -H npm ci
#    Only if db/schema.mjs changed — same hidden-prompt method as step 13.1:
#    read -rs -p "siteAdmin password: " MPW && echo; export MONGODB_SETUP_URI="mongodb://siteAdmin:${MPW}@127.0.0.1:27017/?authSource=admin"; unset MPW
#    sudo -u webapp -H --preserve-env=MONGODB_SETUP_URI npm run db:setup; unset MONGODB_SETUP_URI
sudo -u webapp -H npm run build

# 3) Start and verify
sudo systemctl start webaiautomation
sleep 5
systemctl is-active webaiautomation                                 # active
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/     # 200
curl -s -o /dev/null -w "%{http_code}\n" https://webaiautomation.com/   # 200
journalctl -u webaiautomation -n 30 --no-pager                      # no errors

# 4) If the backup/restore scripts changed, refresh the root-owned copies
if ! sudo -u webapp -H git diff --quiet "$PREV" HEAD -- scripts/mongo-backup.sh scripts/mongo-restore.sh; then
  sudo install -o root -g root -m 755 scripts/mongo-backup.sh /usr/local/sbin/webaiautomation-backup
  sudo install -o root -g root -m 755 scripts/mongo-restore.sh /usr/local/sbin/webaiautomation-restore
  echo "Backup scripts updated"
fi
#    Likewise, if deploy/systemd/* or deploy/nginx/* changed, copy them as in steps 14, 16-17 and 18.3.
```

**Before you start:** if users might be mid-task (for example, you expect inquiries), pick a quiet time. For longer work, post a notice in advance. The window is usually the duration of `npm ci` plus the build.

**If something fails** (build error, service won't start, health check isn't 200):

```bash
sudo systemctl stop webaiautomation
sudo -u webapp -H git checkout "$PREV"           # back to the last working version (detached HEAD)
sudo -u webapp -H npm ci
sudo -u webapp -H npm run build
sudo systemctl start webaiautomation
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/  # 200
```

- `db:setup` only adds collections, indexes and validators, so rolling back the code needs no database rollback. If data was damaged, restore the backup from step 1 (see 18.6).
- Afterwards, fix the problem on your computer, push, and return the server to the branch with `sudo -u webapp -H git checkout <branch>` before the next update.

**Other changes:**
- Changing `NEXT_PUBLIC_WHATSAPP_NUMBER` requires a rebuild (use the procedure above). Other variables only need `sudo systemctl restart webaiautomation`.
- Keep the OS patched: `sudo apt update && sudo apt upgrade` monthly. If a kernel was installed, run the `/boot/vmlinuz-*` check from step 4.5 before rebooting.
- Read MongoDB's release notes before major MongoDB upgrades.

---

### Troubleshooting

| Symptom | Check |
| --- | --- |
| Site times out from outside | Security List ingress for 80/443 (step 1.6) and iptables order (step 15) |
| `certbot` validation fails | DNS points to the reserved IP (17.1); port 80 open in **both** firewalls (1.6, 15); phase-1 nginx config active (16) |
| 502/503 "We'll be right back" | App stopped or crashed: `systemctl status webaiautomation`, `journalctl -u webaiautomation -n 100` |
| mongod won't start after a reboot | `uname -r` and `sudo tail -n 50 /var/log/mongodb/mongod.log`. A kernel-incompatibility message means you booted a 6.19–7.0.13 kernel (step 4) |
| Forms say "temporarily unavailable" | `MONGODB_URI` missing in `.env.production.local`; restart after editing |
| Forms say "request wasn't saved" | MongoDB down or wrong credentials: `systemctl status mongod`, app logs |
| Admin says "sign-in isn't configured" | `AUTH_SECRET` (32+ chars) / `ADMIN_PASSWORD` (12+ chars) missing, too short, or mangled by `#`/`$` (step 12.1) |
| Admin login doesn't stick | You're on `http://`; the session cookie needs `https://` (step 17) |
| Lead shows "Email notification: Failed" | Resend key or domain; run `npm run email:test` for the exact error |
| `Unauthorized` from `db:setup` | Use `MONGODB_SETUP_URI` with the `siteAdmin` user (step 13.1) |
