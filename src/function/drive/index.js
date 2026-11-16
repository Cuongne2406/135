import { google } from 'googleapis';

let cachedDrive = null;

export async function getDriveClient() {
  if (cachedDrive) return cachedDrive;
  const auth = new google.auth.GoogleAuth({
    projectId: process.env.GOOGLE_PROJECT_ID,
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  cachedDrive = google.drive({ version: 'v3', auth });
  return cachedDrive;
}
