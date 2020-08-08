const firestore = require('../../firebaseConfig');

const Validations = {

  async verifyUserToken(token) {
    const decoded = await firestore.admin.auth().verifyIdToken(token);
    return decoded;
  },

};

module.exports = Validations;
