# Key Login Panel

## Run
1. Install Node.js 18+.
2. Run `npm install`
3. Set an admin password:
   - Linux/macOS: `ADMIN_PASSWORD='your-password' npm start`
   - Windows PowerShell: `$env:ADMIN_PASSWORD='your-password'; npm start`
4. Open `/` for key login and `/admin.html` for key management.

Keys are stored as SHA-256 hashes, so the raw keys are not saved on disk.

For production, put this behind HTTPS and replace the simple admin-password header with a proper authenticated admin session.
