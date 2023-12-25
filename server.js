const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1'); // common JS syntax & not ESM syntax? /v1? /v1[.]js? -v1?  
const { IamAuthenticator } = require('ibm-watson/auth');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const uuid = require('uuid');
require('dotenv').config();
const strings = require("strings.json");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

let NLU_APIKEY, NLU_URL;
let db, naturalLanguageUnderstanding; // naturalLanguageUnderstanding?

// Load from local .env file
console.log('Local env file found');
NLU_APIKEY = process.env.NLU_APIKEY;
NLU_URL = process.env.NLU_URL;

// Initialize lowdb
const adapter = new FileSync('db.json'); // we change 'db[.]json' to our preferred JSON file name
db = low(adapter);

// Check if 'reviews' ('movies'?) collection exists, create if not
if (!db.has('reviews').value()) { // movies?
  db.set('reviews', []).write(); // movies?
}

if (NLU_APIKEY && NLU_URL) {
  console.log("Authenticating & authorizing.");
    naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({ // new? not constructor? not function? "let"? "const"?
    version: '2020-08-01',
    authenticator: new IamAuthenticator({
      apikey: NLU_APIKEY
    }),
    url: NLU_URL // "serviceUrl"?
  });
}

// user asked for the index page
app.get('/', function (req, res, next) {
  console.log("Received a GET request to /home.");
  // show error if NLU credentials are not present
  errors = checkServiceCredentials();
  if (errors && errors.length > 0) {
    res.render('index.ejs', { msg: { errors } }); // errors
  } else {
    res.render('index.ejs', { msg: {} });
  }
});

// user posted nothing
app.post("/", (request, response) => {
  // handle all POST requests to the root path
  response.redirect("/reviews"); // Redirect to reviews page
});

// user is on the reviews page
app.get("/reviews", function (request, response) {
  console.log("Received a GET request to /reviews.");
  // get all the reviews from the local JSON document database
  let errors = checkServiceCredentials();
  if (errors && errors.length > 0) {
    response.render('reviews.ejs', { msg: { errors } }) // errors
  } else {
    const reviews = db.get('reviews').value(); // movies?
    response.render('reviews.ejs', { msg: { result: reviews } });
  }
});

// user posted a review
app.post("/reviews", function (request, response) {
  console.log("Received a POST request to /reviews.");
  
  let errors = checkServiceCredentials();

  let firstName = request.body.first_name;
  let lastName = request.body.last_name;
  let review = request.body.review;
  let movie = request.body.movie;

  if (!firstName || !lastName || !review || !movie) {
    errors.push(strings.INVALID_FORM);
  }

  if (errors && errors.length > 0) {
    response.render('reviews.ejs', { msg: { errors } }) // errors
  } else {
    let doc = {
      "firstName": firstName,
      "lastName": lastName,
      "movie": movie,
      "review": review
    };

    const analyzeParams = {
      'text': review,
      'features': {
        'sentiment': {}
      },
    };

    // move the NLU code out?

    naturalLanguageUnderstanding.analyze(analyzeParams)
      .then((analysisResults) => {
        console.log(JSON.stringify(analysisResults, null, 2));

        doc['sentiment'] = analysisResults.result.sentiment.document.label;
        doc['_id'] = uuid.v4() + ":1";

        // Save the review to the local JSON document database
        db.get('reviews').push(doc).write(); // movies?

        response.redirect('/reviews');
      })
      .catch((err) => {
        console.log('error:', err);
        response.render('reviews.ejs', { msg: { errors: [strings.NLU_NOT_ENOUGH_TEXT] } })
      });

  }
});

function checkServiceCredentials() {
  console.log("Checking service credentials.");
  let errors = [];
  if (!naturalLanguageUnderstanding) {
    errors.push(strings.NLU_PROBLEM);
  }
  return errors;
}

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.static(__dirname + '/views'));

let port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log("To view your app, open this link in your browser - http://localhost:" + port);
});
