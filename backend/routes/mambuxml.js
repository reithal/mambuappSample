const express = require('express');
const router = express.Router();
const path = require('path');

/* GET home page. */
router.get('/', function (req, res, next) {
    const options = {
      root: path.join(__dirname, '../public'),
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
      }
  };
  let fileName = './xmlfiles/mambuLoanApp.xml';
 // res.send('Welcome to Express MAMBUAPP');
  if (req.baseUrl == '/sampleapp') {
  fileName = './xmlfiles/mambuSampleInfo.xml';
  }
  if (req.baseUrl == '/fundingapp') {
  fileName = './xmlfiles/mambuFundingApp.xml';
  }
  
  res.sendFile(fileName, options, function (err) {
      if (err) {
          console.error('Error sending file:', err);
          throw new Error('Error sending file');
          
      } else {
          console.log('Sent:', fileName);
      }
  });
});

module.exports = router;
