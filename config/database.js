const { Sequelize } = require("sequelize");
// const sql = require("mysql2")
require('dotenv').config();

// Database configuration from environment variables
const dbName = process.env.DB_NAME || 'task manage';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';

// Create a new Sequelize instance with the MySQL database configuration
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    dialect: 'mysql',
    logging: false, // Set to true if you want to log SQL queries
});

// Function to connect to the database
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to MySQL has been established successfully.');
    } catch (err) {
        console.error(`DB connection error: ${err.message}`);
        process.exit(1); // Exit the process with failure
    }
};



// Export the Sequelize instance and the connect function
module.exports = { sequelize, connectDB };
