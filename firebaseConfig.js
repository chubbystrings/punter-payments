const admin = require('firebase-admin');

const serviceAccount = require('./serviceaccountkey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_UL,
});
const db = admin.firestore();

module.exports = {
  admin,
  db,
};
