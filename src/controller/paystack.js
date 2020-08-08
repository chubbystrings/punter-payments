const _ = require('lodash');
const request = require('request');
const firestore = require('../../firebaseConfig');

const { initializePayment, verifyPayment } = require('../config/paystack')(request);

const URL = process.env.APP_LOCAL_URL;

exports.pay = async (req, res) => {
  const form = _.pick(req.body, ['amount', 'email', 'firstname', 'lastname', 'userId', 'phonenumber']);

  form.metadata = {
    firstname: form.firstname,
    lastname: form.lastname,
    userId: form.userId,
    phonenumber: form.phonenumber,
  };
  form.amount *= 100;

  initializePayment(form, (error, body) => {
    if (error) {
      return res.status(500).send({
        status: 'error',
        error,
      });
    }

    const response = JSON.parse(body);
    return res.status(200).send({
      status: 'success',
      link: response.data.authorization_url,
    });
  });
};

exports.verify = async (req, res) => {
  const ref = req.query.reference;
  verifyPayment(ref, async (error, body) => {
    if (error) {
      // handle errors appropriately
      res.redirect(`${URL}/receipt/${ref}/error`);
      return res.status(500).send({
        status: 'error',
        error,
      });
    }
    const response = JSON.parse(body);
    const data = _.at(response.data, [
      'reference', 'amount', 'status', 'channel', 'customer.email', 'metadata.firstname', 'metadata.lastname', 'metadata.userId', 'metadata.phonenumber', 'authorization.last4',
      'authorization.card_type',
    ]);
    const [
      reference, amount, status,
      channel, email, firstname, lastname, userId, phonenumber, last4Digits, cardType,
    ] = data;
    const docId = `${userId}_${reference}`;
    const userRef = firestore.db.collection('users').doc(userId);
    const doc = await userRef.get();
    const currentSub = doc.data().sub;
    const now = new Date();

    await firestore.db.collection('payments').doc(docId).set({
      transaction_id: ref,
      reference,
      amount,
      email,
      firstname,
      lastname,
      paymentType: channel,
      cardType,
      userId,
      last4Digits: last4Digits || 'none',
      phonenumber,
      status,
      platform: 'paystack',
      createdAt: now,
    });

    doc.ref.update({
      sub: currentSub + amount,
    });

    return res.redirect(`${URL}/receipt/${docId}/success`);
  });
};
