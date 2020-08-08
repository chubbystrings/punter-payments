const Validations = require('../validations/auth');

const Auth = {
  async verifyToken(req, res, next) {
    try {
      if (!req.headers.authorization) {
        return res.status(400).send({
          status: 'error',
          error: 'authorization not provided',
        });
      }
      const token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).send({
          status: 'error',
          error: 'authorization not provided',
        });
      }
      const decodedToken = await Validations.verifyUserToken(token);
      const { uid } = decodedToken;
      const userId = uid;
      if (!userId) {
        return res.status(401).send({
          status: 'error',
          error: 'Invalid Token',
        });
      }
      return next();
    } catch (error) {
      if (error.code) {
        return res.status(500).send({
          status: 'error',
          error: error.message,
        });
      }
      return res.status(500).send({
        status: 'error',
        error,
      });
    }
  },
};

module.exports = Auth;
