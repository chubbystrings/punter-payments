const express = require('express');

const flutterPaymentController = require('../controller/flutterwave');
const paystackPaymentController = require('../controller/paystack');
const Auth = require('../middlewares/auth');

const router = express.Router();

router.post('/paystack/pay', Auth.verifyToken, paystackPaymentController.pay);
router.get('/paystack/verify-payment', paystackPaymentController.verify);
router.post('/flutterwave/pay', Auth.verifyToken, flutterPaymentController.pay);
router.get('/flutterwave/verify-payment', flutterPaymentController.verify);

module.exports = router;
