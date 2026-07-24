import admin from 'firebase-admin';

if (!admin.apps?.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (error) {
    console.warn("Failed to initialize Firebase Admin with default credentials. Running in mock mode.");
  }
}

export default admin;
