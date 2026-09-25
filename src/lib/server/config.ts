/**
 * Application configuration, read from environment variables.
 *
 * Secrets never live in this file. Locally they come from .env.local (git-ignored;
 * see .env.example for the list). On Vercel set the same names under
 * Settings > Environment Variables.
 *
 * This module must only ever be imported from server code (route handlers,
 * lib/server/*, scripts). Importing it from a client component would inline these
 * secrets into the browser bundle.
 */

// Next.js expands "$NAME" inside .env files, so values containing "$" (bcrypt
// hashes) are written there as "\$"; undo that escape here.
const fromEnv = (name: string) => (process.env[name] || '').trim().replace(/\\\$/g, '$');

export const config = {
  mongoUri: fromEnv('MONGODB_URI'),
  jwtSecret: fromEnv('JWT_SECRET'),
  adminEmail: fromEnv('ADMIN_EMAIL'),
  adminPasswordHash: fromEnv('ADMIN_PASSWORD_HASH'),
  /** Home page counters. The vehicle and customer numbers are counted from the
   *  database; this one has no records behind it, so it is kept here. Set it to 0
   *  and the home page shows the number of cities covered instead. */
  partnerDealers: Number(process.env.PARTNER_DEALERS || 15),
  /** Google Drive media storage. An API key cannot upload to Drive and a service
   *  account has no storage quota on a personal Google account, so this uses OAuth
   *  against the account that owns the files. Fill these in and uploads switch from
   *  Cloudinary to Drive automatically; leave them blank to stay on Cloudinary.
   *  Run `npm run drive:auth` to obtain the refresh token. */
  googleDrive: {
    clientId: fromEnv('GOOGLE_DRIVE_CLIENT_ID'),
    clientSecret: fromEnv('GOOGLE_DRIVE_CLIENT_SECRET'),
    refreshToken: fromEnv('GOOGLE_DRIVE_REFRESH_TOKEN'),
    /** Optional: id of an existing Drive folder to keep everything under. */
    rootFolderId: fromEnv('GOOGLE_DRIVE_FOLDER_ID')
  },
  cloudinary: {
    cloudName: fromEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: fromEnv('CLOUDINARY_API_KEY'),
    apiSecret: fromEnv('CLOUDINARY_API_SECRET')
  }
};
