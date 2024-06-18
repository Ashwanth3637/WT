const express = require('express');
const path = require('path');
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");

const app = express();
const port = 8000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const mongoUrl = "mongodb://localhost:27017/";
const dbName = "mydatabase";
let db;

MongoClient.connect(mongoUrl)
    .then((client) => {
        db = client.db(dbName);
        console.log(`Connected to MongoDB: ${dbName}`);

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/buy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'buy.html'));
});

app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/error', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'error.html'));
});

app.post('/signup', async (req, res) => {
    const { email, pass } = req.body;
    if (!db) {
        res.status(500).send("Database not initialized");
        return;
    }
    try {
        await db.collection("items").insertOne({ email, pass });
        console.log("User inserted successfully");
        res.redirect("/signin");
    } catch (err) {
        console.error("Error inserting user data:", err);
        res.status(500).send("Failed to sign up");
    }
});

app.post('/login', async (req, res) => {
    const { email, pass } = req.body;
    if (!db) {
        res.status(500).send("Database not initialized");
        return;
    }
    try {
        const user = await db.collection("items").findOne({ email, pass });
        if (user) {
            console.log("User authenticated successfully");
            res.redirect("/buy");
        } else {
            console.log("Authentication failed");
            res.redirect("/error");
        }
    } catch (err) {
        console.error("Error during authentication:", err);
        res.status(500).send("Failed to login");
    }
});

app.post('/order', async (req, res) => {
    const { mealName, price } = req.body;
    console.log(`Received order: ${mealName} with price: ${price}`);
    if (!db) {
        res.status(500).send("Database not initialized");
        return;
    }
    try {
        await db.collection("orders").insertOne({ mealName, price });
        console.log("Order placed successfully");
        res.json({ status: 'success' });
    } catch (err) {
        console.error("Error placing order:", err);
        res.status(500).json({ status: 'failure' });
    }
});

app.get('/orders', async (req, res) => {
    if (!db) {
        res.status(500).send("Database not initialized");
        return;
    }
    try {
        const orders = await db.collection("orders").find().toArray();
        res.json({ status: 'success', orders });
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ status: 'failure', reason: err.message });
    }
});

app.get('/summary', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'summary.html'));
});
