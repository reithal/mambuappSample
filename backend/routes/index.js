const express = require('express');
const router = express.Router(['caseSensitive', 'strict']);
const crypto = require('crypto');
const dotenv = require('dotenv');
const { get } = require('http');
const { error } = require('console');

router.use(express.json());
dotenv.config();

let dynamicHTML = '<p>Unknown</p>';

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('Welcome !');
});


router.post('/process-data', async (req, res) => {
  try {
    const receivedData = req.body;
    //console.debug("received data", receivedData);

    if (!receivedData || !receivedData.signed_request) {
      console.error('Line 23 Validation Error: Missing or invalid data in request body.', receivedData);
      return res.status(401).send('Unauthorized: Missing or invalid signature.');
    }
    const decodedData = decodeSignature(receivedData);

    if (!decodedData.isDecoded) {
      console.error('Line 29 Validation Error: Unable to decode.', decodedData);
      return res.status(401).send('Unauthorized: Missing or invalid signature.');
    }

    const userEncodedKey = decodedData.data.USER_KEY;
    const entityId = decodedData.data.OBJECT_ID;
    console.log(`Received data for userId: ${userEncodedKey} from EntityKey:  ${entityId} `);


    // --- Use Environment Variables for API URL ---
    // Ensure MAMBU_API_URL is defined in your .env file
    const mambuApiBaseUrl = process.env.MAMBU_API_URL;
    if (!mambuApiBaseUrl) {
      console.error('Configuration Error: MAMBU_API_URL is not set in environment variables.');
      return res.status(500).send('Server configuration error: External API URL not set.');
    }

    const mambuDomain = new URL(mambuApiBaseUrl).origin; // Result: 'https://yourtenant.mambu.com'
    console.log(`Mambu Domain: ${mambuDomain}`);

    const mambuApiHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.mambu.v2+json',
      // --- Use Environment Variables for API Key (if applicable) ---
      // If your API requires an API key in a header:
      // 'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`,
      'apiKey': process.env.MAMBU_API_KEY, // Example for an X-API-Key header
    };

    const apiConfiguration = {
      apiUrl: mambuApiBaseUrl,
      headers: mambuApiHeaders
    };


    console.info(`Attempting to call Mambu Users API: ${userEncodedKey}`);
    const userDetails = await getUsersById(userEncodedKey, apiConfiguration);

    // TODO: To be Verify
    if (!userDetails || !userDetails._Mambu_App_Roles_Users || !userDetails.hasFundingAccess =='YES') {
      console.error('External API Response Error: Expected user Mambu App access but received:', userDetails._Mambu_App_Roles_Users);
      return res.status(403).send("Permission Denied: Could not process custom fied data or user doesn't have access for this Mambu App.");
    }
    const userName = `${userDetails.firstName} ${userDetails.lastName}`.trim();
    

    // TODO: Need to validate custom fields and perform Loan Search
    const depositDetails = await getDepositAccountById(entityId, apiConfiguration);

    if (!depositDetails) {
      console.error('External API Response Error: Expected details on deposit account but received:', depositDetails);
      return res.status(500).send('Server Error: Could not process deposit account data from Mambu API.');
    }
    console.log(`Successfully fetched deposit account: ${depositDetails.id} `);
    const loanAccounts = await postSearchLoans(depositDetails.id, apiConfiguration);

    if (!loanAccounts || !Array.isArray(loanAccounts)) {
      console.error('External API Response Error: Expected an array of loan accounts, but received:', loanAccounts);
      return res.status(500).send('Server Error: Could not process loan account data from external API.');
    }
    console.log(`Successfully fetched ${loanAccounts.length} loan accounts.`);
    
    
    // --- Fetch the Client Details ---
    const clientKeys = loanAccounts.map((clients) => clients.accountHolderKey);
    const uniqueClientKeys = [...new Set(clientKeys)]; // Still good to get unique keys
    console.log(`Workspacing details for ${uniqueClientKeys.length} unique clients sequentially...`);
    const clientsData = {}; // Object to store client details by their key
    for (const key of uniqueClientKeys) {
        try {
            const clientDetails = await getClientById(key, apiConfiguration);
            clientsData[clientDetails.encodedKey] = clientDetails;
        } catch (error) {
            console.error(`Failed to fetch client details for key ${key} sequentially:`, error.message);
            // Continue even if one client fetch fails
        }
    }
    console.log('Finished fetching client details.');
    

    // --- Prepare Data for EJS Rendering ---
    const initialData = {
      userName: userName, // Use actual fetched user name
      depositDetails: depositDetails,
      loanAccounts: loanAccounts.map(loan => {
          // Attach client details to each loan account for easier rendering
          loan.clientDetails = clientsData[loan.accountHolderKey];
          return loan;
      
      }),
      mambuDomain: mambuDomain
    };
   // Render the EJS template with initial data
    res.render('index', { initialData });

  } catch (error) {
    console.error('Internal Server Error during /process-data:', error);
    res.status(500).send('Internal Server Error occurred.');
  }
})

router.post('/', (req, res) => {
  try {
    let check = decodeSignature(req.body);
    if (check.isDecoded) {
      dynamicHTML = "<html><style>h1 {color: #73757d;}</style><body><h1>Loan Info Mambu App</h1>";
      dynamicHTML += `<p style="width:800px; word-wrap:break-word; display:inline-block;">The body of request received is ${JSON.stringify(req.body)}</p>`;
      dynamicHTML += `<p>The PART1 of request received is ${req.body.signed_request.split('.')[0]}`;
      dynamicHTML += `<br style="width:800px; word-wrap:break-word; display:inline-block;">The PART2 of request received is ${req.body.signed_request.split('.')[1]}</p>`;
      dynamicHTML += `<p>The data decoded is: ${JSON.stringify(check.data)}</p>`;
      dynamicHTML += `<p>Welcome user encodedKey: ${check.data.USER_KEY}, your IP Address is ${req.header('x-forwarded-for')}}</p>`;
      dynamicHTML += `<p>You have accesed the entity ID: ${check.data.OBJECT_ID} from ${check.data.DOMAIN}</p>`;
      dynamicHTML += `</html>`;

      res.send(dynamicHTML);
    } else {
      res.sendStatus(401);

    }
  } catch (error) {
    console.error(error);
    res.statusCode(401);
  }

})

function decodeSignature(reqBody) {
  try {
    const signedRequest = reqBody.signed_request;
    const splitSignature = signedRequest.split('.');
    const dataRequest = JSON.parse(new Buffer.from(splitSignature[1], 'base64'));
    let compare = crypto.createHmac('sha256', process.env.APP_SECRET).update(splitSignature[1]).digest('hex');
    console.debug(`decoded Data Part 2 = ${dataRequest}`);
    console.debug(`Encrypted Part 2 = ${compare}`);
    if (compare === splitSignature[0]) {
      let result = { 'isDecoded': true, 'data': dataRequest }
      return result;
    } else {
      let result = { 'isDecoded': false, 'data': null }
      console.debug(`Compared Fail. ${compare} != ${splitSignature[0]}`)
      return result;
    }
  } catch (error) {
    console.error('Internal Server Error during decode: ', error);
    throw new Error('Invalid signature');
  }
}

async function getUsersById(userId, apiConfiguration) {
  const response = await fetch(`${apiConfiguration.apiUrl}/users/${userId}?detailsLevel=FULL`, {
    headers: apiConfiguration.headers,
    method: 'GET'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Mambu API Error: Status ${response.status} - ${response.statusText}. Response: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  return data;
}

async function getDepositAccountById(depositId, apiConfiguration) {
  const response = await fetch(`${apiConfiguration.apiUrl}/deposits/${depositId}?detailsLevel=FULL`, {
    headers: apiConfiguration.headers,
    method: 'GET'
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Mambu API Error: Status ${response.status} - ${response.statusText}. Response: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  return data;
}

async function postSearchLoans(fundAccountId, apiConfiguration) {
  const response = await fetch(`${apiConfiguration.apiUrl}/loans:search?detailsLevel=FULL`, {
    headers: apiConfiguration.headers,
    method: 'POST',
    body: JSON.stringify(
      {
        "sortingCriteria": {
          "field": "id",
          "order": "DESC"
        },
        "filterCriteria": [

          {
            "field": "_Funding_Source_Loan_Accounts.Source_Account_Loan_Accounts",
            "operator": "EQUALS_CASE_SENSITIVE",
            "value": fundAccountId
          }

        ]
      }
    )
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Mambu API Error: Status ${response.status} - ${response.statusText}. Response: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  return data;
}

async function getClientById(clientId, apiConfiguration) {
  const response = await fetch(`${apiConfiguration.apiUrl}/clients/${clientId}`, {
    headers: apiConfiguration.headers,
    method: 'GET'
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Mambu API Error: Status ${response.status} - ${response.statusText}. Response: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  return data;
}

module.exports = router;
