const admin = require('firebase-admin');

// Sentinel: In a real app, you would require your serviceAccountKey.json or set GOOGLE_APPLICATION_CREDENTIALS
// For local testing without a real key, we initialize a mock admin app if credentials aren't present.
if (!admin.apps?.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (error) {
    console.warn("Failed to initialize Firebase Admin with default credentials. Running in mock mode.");
  }
}

module.exports = admin;
