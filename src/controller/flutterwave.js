const _ = require('lodash');
const request = require('request');
const firestore = require('../../firebaseConfig');

const { initializePayment, verifyPayment } = require('../config/flutterwave')(request);

const baseUrl = process.env.NODE_ENV === 'production' ? process.env.APP_PROD_URL : process.env.APP_LOCAL_URL;
const baseUrlSever = process.env.NODE_ENV === 'production' ? process.env.PROD_SERVER : process.env.LOCAL_SERVER;
const link = process.env.LOGO;

exports.pay = async (req, res) => {
  const form = _.pick(req.body, ['amount', 'email', 'firstname', 'lastname', 'userId', 'phonenumber']);
  const now = new Date();
  form.tx_ref = `${now.getTime()}-${form.userId}-${now.getHours()}-${now.getMinutes()}`;
  form.currency = 'NGN';
  form.payment_options = 'card';
  form.redirect_url = `${baseUrlSever}/api/v1/flutterwave/verify-payment`;
  form.customer = {
    email: form.email,
    name: `${form.lastname} ${form.firstname}`,
    phonenumber: form.phonenumber,
  };

  form.meta = {
    customer_id: form.userId,
  };

  form.customizations = {
    title: 'Punter Maters',
    description: 'Betting code sharing and betting tips',
    logo: link,
  };

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
      link: response.data.link,
    });
  });
};

exports.verify = async (req, res) => {
  const { status } = req.query;
  if (status === 'cancelled' || status === 'declined') {
    const errorRef = req.query.tx_ref;
    res.redirect(`${baseUrl}/receipt/${errorRef}/error`);
    return;
  }
  const ref = req.query.transaction_id;
  verifyPayment(ref, async (error, body) => {
    if (error) {
      // handle errors appropriately
      res.redirect(`${baseUrl}/receipt/${ref}/error`);
      return res.status(500).send({
        status: 'error',
        error,
      });
    }
    const response = JSON.parse(body);
    const data = _.at(response.data,
      [
        'id', 'tx_ref', 'flw_ref', 'amount', 'app_fee', 'customer.email', 'customer.name', 'meta.customer_id', 'customer.phone_number',
        'customer.created_at', 'account_id', 'amount_settled', 'payment_type', 'card.type', 'card.first_6digits', 'card.last_4digits',
      ]);
    const [
      id, txRef, flwRef, amount, deduction, email, name, userId,
      phonenumber, createdAt, accountId, amountSettled, paymentType, cardType,
      first6Digits, last4Digits,
    ] = data;
    const docId = `${userId}_${flwRef}`;
    const userRef = firestore.db.collection('users').doc(userId);
    const doc = await userRef.get();
    const currentSub = doc.data().sub;
    const nameArr = name.split(' ');

    await firestore.db.collection('payments').doc(docId).set({
      transaction_id: id,
      reference: flwRef,
      tx_ref: txRef,
      deduction,
      amount: amount * 100,
      amountSettled,
      email,
      firtsname: nameArr[1],
      lastname: nameArr[0],
      phonenumber,
      userId,
      paymentType,
      cardType,
      accountId,
      createdAt,
      first6Digits: first6Digits || 'none',
      status,
      last4Digits: last4Digits || 'none',
      platform: 'flutterwave',
    });

    doc.ref.update({
      sub: currentSub + (amountSettled * 100),
    });

    return res.redirect(`${baseUrl}/receipt/${docId}/success`);
  });
};
