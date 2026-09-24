/**
 * Application configuration.
 *
 * ⚠️  SECURITY: the fallback values below are real, working credentials committed
 * to this repository. Anyone who can read this file can reach the database, mint
 * admin sessions and use the Cloudinary account. Keep this repo private, and
 * rotate every value here if it is ever pushed somewhere public.
 *
 * Environment variables still win when they are set, so a host such as Vercel can
 * override any of these without a code change — set the matching variable there
 * and the committed value is ignored.
 *
 * This module must only ever be imported from server code (route handlers,
 * lib/server/*, scripts). Importing it from a client component would inline these
 * secrets into the browser bundle.
 */

const fromEnv = (name: string, fallback: string) => {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
};

export const config = {
  mongoUri: fromEnv('MONGODB_URI', 'mongodb+srv://smartcliff:Mern%40143@cluster0.hkb7jhx.mongodb.net/car-consulting?retryWrites=true&w=majority&appName=Cluster0'),
  jwtSecret: fromEnv('JWT_SECRET', '8fa48ce2c26f4639b32bd5054b3677da'),
  adminEmail: fromEnv('ADMIN_EMAIL', 'roobankr3@gmail.com'),
  adminPasswordHash: fromEnv('ADMIN_PASSWORD_HASH', '$2a$12$0aF9FL/0HryZecZ36DnWpuu.bWNGbz9.cBxkOIpnDus3lrMcxUXR6'),
  /** Home page counters. The vehicle and customer numbers are counted from the
   *  database; this one has no records behind it, so it is kept here. Set it to 0
   *  and the home page shows the number of cities covered instead. */
  partnerDealers: Number(process.env.PARTNER_DEALERS || 15),
  cloudinary: {
    cloudName: fromEnv('CLOUDINARY_CLOUD_NAME', 'dwwxwyhwg'),
    apiKey: fromEnv('CLOUDINARY_API_KEY', '375146684443485'),
    apiSecret: fromEnv('CLOUDINARY_API_SECRET', 'zCqNZ4vqfVTZry99qDbWcHanlk0')
  }
};
