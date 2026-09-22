import { config } from 'dotenv';

// Next reads .env.local automatically; these CLI scripts have to be told.
// The first file loaded wins, so .env.local takes priority over .env.
config({ path: '.env.local' });
config();
