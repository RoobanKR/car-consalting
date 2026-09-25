import './env';
import { createServer } from 'node:http';
import { auth as googleAuth } from '@googleapis/drive';
import { config } from '@/lib/server/config';

/**
 * One-off helper: turns a Google OAuth client into the refresh token the upload
 * code needs. Run it with `npm run drive:auth`.
 *
 * A refresh token is what lets the server upload as you without a browser being
 * present. An API key cannot do this, and a service account has no Drive storage
 * quota on a personal Google account — hence OAuth.
 *
 * This uses the loopback redirect rather than the old copy-the-code flow, because
 * Google blocked out-of-band OAuth in 2022. "Desktop app" clients are allowed to
 * redirect to any http://localhost port without registering it first.
 */
const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}`;

function page(title: string, detail: string) {
  return `<!doctype html><meta charset="utf-8"><title>${title}</title>
<body style="font:16px/1.6 system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0;color:#1e2340">
<div style="text-align:center;max-width:32rem;padding:2rem">
<h1 style="color:#4736d4;margin:0 0 .5rem">${title}</h1><p>${detail}</p></div>`;
}

async function main() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || config.googleDrive.clientId;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || config.googleDrive.clientSecret;

  if (!clientId || !clientSecret) {
    console.error('\nMissing OAuth client details.\n');
    console.error('1. Enable the Drive API:');
    console.error('   https://console.cloud.google.com/apis/library/drive.googleapis.com\n');
    console.error('2. Create credentials → OAuth client ID → Application type "Desktop app":');
    console.error('   https://console.cloud.google.com/apis/credentials\n');
    console.error('3. Run this again with the client details:\n');
    console.error('   GOOGLE_DRIVE_CLIENT_ID=xxx GOOGLE_DRIVE_CLIENT_SECRET=yyy npm run drive:auth\n');
    process.exitCode = 1;
    return;
  }

  const oauth = new googleAuth.OAuth2(clientId, clientSecret, REDIRECT);
  const url = oauth.generateAuthUrl({
    access_type: 'offline',      // required, otherwise no refresh token comes back
    prompt: 'consent',           // forces a fresh refresh token even if approved before
    scope: ['https://www.googleapis.com/auth/drive.file']  // only files this app creates
  });

  const refreshToken = await new Promise<string>((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const incoming = new URL(req.url || '/', REDIRECT);
      const code = incoming.searchParams.get('code');
      const denied = incoming.searchParams.get('error');

      if (denied) {
        res.end(page('Access denied', 'Nothing was changed. You can close this tab and run the command again.'));
        server.close();
        reject(new Error(`Google returned: ${denied}`));
        return;
      }
      if (!code) { res.statusCode = 404; res.end('Waiting for the Google redirect.'); return; }

      try {
        const { tokens } = await oauth.getToken(code);
        if (!tokens.refresh_token) throw new Error('Google did not return a refresh token.');
        res.end(page('Connected', 'Google Drive is linked. Go back to your terminal for the values to save.'));
        server.close();
        resolve(tokens.refresh_token);
      } catch (error) {
        res.end(page('Something went wrong', 'Check the terminal for details.'));
        server.close();
        reject(error as Error);
      }
    });

    server.on('error', reject);
    server.listen(PORT, () => {
      console.log('\nOpen this URL and sign in as the account that should own the files:\n');
      console.log('   ' + url + '\n');
      console.log(`Waiting for Google to redirect back to ${REDIRECT} ...`);
      console.log('(Press Ctrl+C to cancel.)\n');
    });
  });

  console.log('\nDone. Add these three lines to .env.local in the project root:\n');
  console.log(`GOOGLE_DRIVE_CLIENT_ID=${clientId}`);
  console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret}`);
  console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}`);
  console.log('\nThen restart the app. Uploads switch to Drive automatically.\n');
}

main().catch((error: Error) => {
  console.error('\nDrive auth failed:', error.message);
  if (error.message.includes('EADDRINUSE')) {
    console.error(`Port ${PORT} is busy. Close whatever is using it and try again.\n`);
  }
  process.exitCode = 1;
});
