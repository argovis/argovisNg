const express = require('express');
let router = express.Router();
const path = require('path');

/* GET ng home page. */
router.get('/', function(req, res, next) {
  res.redirect('/ng/home')
});

router.get('/ng/*', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../dist/', 'index.html'));
})

router.get('/ng/home', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../dist/', 'index.html'));
});

module.exports = router;
