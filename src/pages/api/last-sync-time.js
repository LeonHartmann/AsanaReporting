import fs from 'fs';
import path from 'path';

const LAST_SYNC_FILE = path.join(process.cwd(), 'last-sync-time.txt');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Read the last sync time from file
      const lastSyncTime = fs.readFileSync(LAST_SYNC_FILE, 'utf8');
      res.status(200).json({ lastSyncTime });
    } catch (error) {
      // If file doesn't exist or can't be read, return null
      res.status(200).json({ lastSyncTime: null });
    }
  } else if (req.method === 'POST') {
    try {
      // Write the new sync time to file
      fs.writeFileSync(LAST_SYNC_FILE, new Date().toISOString());
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error writing sync time:', error);
      res.status(500).json({ error: 'Failed to save sync time' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 