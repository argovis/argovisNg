const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const config = require('config');
const compression = require('compression'); //All routes are compressed
const helmet = require('helmet'); //sets appropriate HTTP headers

const index = require('./routes/index');

const app = express();
app.use(compression()); //Compress all routes
app.use(helmet());

const ENV = config.util.getEnv('NODE_ENV');
//don't show the log when it is test
if(ENV !== 'test') {
  //use morgan to log at command line
  app.use(logger('dev'));
}

app.use(favicon(path.join(__dirname,'src','assets', 'img','favicon.ico')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressValidator()); // Add this after the bodyParser middlewares!

// Set the MIME type explicitly
express.static.mime.define({'application/wasm': ['wasm']});

app.use(express.static(path.join(__dirname, './dist'))); // Point static path to ng dist
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.json({"message": err.message});
});

module.exports = app;
