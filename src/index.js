const path = require('path');
require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const User = require('../src/models/user'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI);
const con = mongoose.connection;
con.on('open', () => console.log('Connected to MongoDB'));

app.use(cors());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json());

const recipeRouter = require('../src/recipes-router'); 
const dietRouter = require('../src/diets-router'); 
const userRouter = require('../src/users-router'); 
const requestsRouter = require('../src/requests-router');
const upload = require('./upload-router');
const auth = require('./middleware/auth');

app.use('/api/requests', requestsRouter);
app.use('/api/recipes', recipeRouter);
app.use('/api/diets', dietRouter);
app.use('/api/users', userRouter);
app.use('/api/upload', upload);

app.use(express.static(path.join(__dirname, '../public'))); 

app.get('/adminPortal', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html')); 
});

app.listen(port, () => console.log('Server started'));
