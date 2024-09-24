const express = require("express");
const dotenv = require("dotenv");
const path = require('path'); // Import the path module
const { sequelize, connectDB } = require('./config/database'); // Update import
const user = require('./routes/userroutes');


dotenv.config();
const app = express();

app.use(express.json());

// Connect to MySQL database
connectDB();

// Define your API routes
app.use('/api/v1/', user);


const PORT = process.env.PORT || 60000;
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
  });