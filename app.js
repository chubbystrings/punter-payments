const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const rfs = require('rotating-file-stream'); // version 2.x
const paymentRoutes = require('./src/routes/index');

// set up express app
const app = express();
const requestLogStream = rfs.createStream('request.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'logs'),
});

// to resolve cross origin resource shearing (CORS) error add folowing to te response header
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));
// setup the logger
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: requestLogStream }));
app.use('/api/v1/auth', paymentRoutes);

module.exports = app;
