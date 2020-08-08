const flutterwave = (request) => {
  const MySecretKey = `Bearer ${process.env.FLUTTER_TEST_SECRET_KEY}`;
  // sk_test_xxxx to be replaced by your own secret key
  const initializePayment = (form, mycallback) => {
    const option = {
      // for Live payments,
      url: `${process.env.FLUTTER_URL}/payments`,
      headers: {
        authorization: MySecretKey,
        'Content-Type': 'application/json',
        'cache-control': 'no-cache',
      },
      form,
    };
    const callback = (error, response, body) => mycallback(error, body);
    request.post(option, callback);
  };
  const verifyPayment = (ref, mycallback) => {
    const option = {
      url: `${process.env.FLUTTER_URL}/transactions/${encodeURIComponent(ref)}/verify`,
      headers: {
        authorization: MySecretKey,
        'Content-Type': 'application/json',
        'cache-control': 'no-cache',
      },
    };
    const callback = (error, response, body) => mycallback(error, body);
    request(option, callback);
  };
  return { initializePayment, verifyPayment };
};
module.exports = flutterwave;
