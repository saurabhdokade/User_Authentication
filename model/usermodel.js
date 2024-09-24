// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        trim: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        trim: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        trim: true,
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true,
    },
 }, {

    tableName:"Users",
    timestamps:false
    
});

// Hash the password before saving
User.beforeCreate(async (user) => {
    user.password = await bcrypt.hash(user.password, 10);
});

// Generate and hash password token
User.prototype.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Set token expire time (e.g., 10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

module.exports = User;
