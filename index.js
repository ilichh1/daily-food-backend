const express = require('express');
// Registered users
const authUsers = require('./users');
// List of food
const foodList = require('./food');

const bodyParser = require('body-parser');

const dietObjects = {
	"YWRtaW5+LX5wYXNz": {}
};

const app = express();

// Use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(8080, function() {
  console.log('Server started!');
});

app.post('/auth', function(req, res) {
	let { login, password } = req.body;
	let authSuccess = false;

	authUsers.forEach(user => {
		if (user.login === login && user.password === password) {
			authSuccess = true;
			return;
		}
	});

	if (authSuccess) {
		// Convert to Base64
		let token = Buffer.from(`${login}~-~${password}`, 'binary').toString('base64');
		// Expires in 24 hours
		let expires = Date.now() + (3600000 * 24);

		// Create the date objects
		dietObjects[token] = { calories: null, days: null };

		res.status(200).send({ token, expires });
	} else {
		res.status(401).send({ message: 'Invalid credentials' });
	}

});

app.get('/diet', function(req, res) {
	let authHeader = req.get('Authentication');

	if (!authHeader) {
		res.status(400).send({ message: 'Missing headers' });
		return;
	}

	console.log(dietObjects);

	let dietObject = dietObjects[authHeader];
	if (!dietObject) {
		res.status(404).send({ message: 'Diet not found' });
		return;
	}

	res.status(200).send({ diet: dietObject });
});

app.post('/diet', function(req, res) {
	// The same validations when we are creating a diet
	let authHeader = req.get('Authentication');

	if (!authHeader) {
		res.status(400).send({ message: 'Missing headers.' });
		return;
	}

	console.log(dietObjects);

	let dietObject = dietObjects[authHeader];
	if (!dietObject) {
		res.status(404).send({ message: 'Diet does not exist.' });
		return;
	}

	// Now we validate the objet in the POST params
	let newDiet = req.body.diet;
	if ( !(!!newDiet || !!newDiet.calories.min || !!newDiet.calories.max || !!newDiet.days) ) {
		res.status(400).send({ message: "Bad diet object." });
		return;
	}

	// Actually save the diet
	dietObjects[authHeader] = newDiet;
	res.status(200).send({ message: "Diet saved successfully."});
});

app.get('/food-list', function(req, res) {
	res.status(200).send({ foodList });
});