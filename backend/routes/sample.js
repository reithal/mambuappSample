const express = require('express');
const router = express.Router(['caseSensitive', 'strict']);
const crypto = require('crypto');
router.use(express.json());

let dynamicHTML = '<p>Unknown</p>';


/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('Welcome !');
});

router.post('/', (req, res) => {
  try {
    console.log(req.headers);
    let check = validateSignature(req);
    if (check.isValidated) {
      dynamicHTML = "<html><style>h1 {color: #73757d;}</style><body><h1>Sample Mambu App</h1>";
      dynamicHTML += `<p>Welcome user encodedKey: ${check.data.USER_KEY}</p>`;
      dynamicHTML += `<p>You have accesed the entity ID: ${check.data.OBJECT_ID} from ${check.data.DOMAIN}</p>`;
      res.send(dynamicHTML);
    } else {
      res.sendStatus(401);

    }
  } catch (error) {
    console.error(error);
    res.statusCode(401);
  }

})

function validateSignature(req) {
  try {
    const signedRequest = req.body.signed_request;
    const splitSignature = signedRequest.split('.');
    const dataRequest = JSON.parse(new Buffer.from(splitSignature[1], 'base64'));
    // Using secret here for sample only
    let compare = crypto.createHmac('sha256', 'Online12345').update(splitSignature[1]).digest('hex');
    console.debug(dataRequest);
    if (compare === splitSignature[0]) {
      let result = { 'isValidated' : true, 'data': dataRequest }
      return result;
    } else {
      let result = { 'isValidated': false, 'data': null }
      return result;
    }
  } catch (error) {
    throw new Error('Invalid signature');
  }
}



module.exports = router;