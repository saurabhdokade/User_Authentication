const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendemail");
const { QueryTypes } = require('sequelize');
const { sequelize } = require("../config/database");
// const {executeQuery} = require('../config/database');  // Ensure this is properly configured

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);
        // Check if the user already exists
        const user = await sequelize.query(
            'SELECT * FROM Users WHERE email = :email',
            {
                replacements: { email },
                type: QueryTypes.SELECT
            }
        );

        if (user.length > 0) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Create a new user
        await sequelize.query(
            'INSERT INTO Users (name, email, password) VALUES (:name, :email, :password)',
            {
                replacements: { name, email, password: hashedPassword },
                type: QueryTypes.INSERT
            }
        );
        res.status(201).json({
            success: true,
            message: "User created successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateUser = async (req, res, next) => {
    // console.log(req)
    try {
        // console.log("hello update")
        const { email } = req.params;
        const { name, newEmail, password } = req.body;
     const userquery = `SELECT * FROM Users WHERE email = "${email}" `
    
        // Check if the user exists
        const user = await sequelize.query(
            userquery,
            {
                replacements: { email },
                type: QueryTypes.SELECT
            }
        );

        if (user.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Hash password if provided
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        // Build the SQL update query dynamically
        const updates = [];
        if (name) updates.push(`name = "${name}"`);
        if (newEmail) updates.push(`email ="${newEmail}"`);
        if (hashedPassword) updates.push(`password = "${password}"`);

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update"
            });
        }

        const updateQuery = `UPDATE Users SET ${updates.join(', ')} WHERE email ="${email}"`;
        console.log(updateQuery)
        // Execute the update query
        await sequelize.query(updateQuery, {
            replacements: { 
                name,
                newEmail,
                password: hashedPassword,
                email
            },
            type: QueryTypes.UPDATE
        });

        res.status(200).json({
            success: true,
            message: "User updated successfully"
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { email } = req.params;

        // Check if the user exists
        const user = await sequelize.query(
            'SELECT * FROM Users WHERE email = :email',
            {
                replacements: { email },
                type: QueryTypes.SELECT
            }
        );

        if (user.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Delete the user
        await sequelize.query(
            'DELETE FROM Users WHERE email = :email',
            {
                replacements: { email },
                type: QueryTypes.DELETE
            }
        );

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};



exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await sequelize.query(
            'SELECT * FROM Users WHERE email = :email',
            {
                replacements: { email },
                type: QueryTypes.SELECT
            }
        );

        if (user.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user[0].password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }
               
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: user[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

//
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        

        // Find the user by email
        const user = await sequelize.query(
            'SELECT * FROM Users WHERE email = :email',
            {
                replacements: { email },
                type: QueryTypes.SELECT
            }
        );

        if (user.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        console.log(resetToken)

        // Set token and expiry
        await sequelize.query(
            `UPDATE Users SET resetPasswordToken = :resetToken, resetPasswordExpire = :expire WHERE email = "${email}"`,
            {
                replacements: { resetToken, expire: Date.now() + 3600000, email },
                type: QueryTypes.UPDATE
            }
        );

        // Create reset URL
        const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/resetpassword/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: email,
                subject: "Password Reset Token",
                message,
            });

            res.status(200).json({ success: true, message: "Email sent" });
        } catch (error) {
            console.error(error);

            await sequelize.query(
                `UPDATE Users SET resetPasswordToken = NULL, resetPasswordExpire = NULL WHERE email = "${email}"`,
                {
                    replacements: { email },
                    type: QueryTypes.UPDATE
                }
            );
            console.log()

            return res.status(500).json({ success: false, message: "Email could not be sent" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const resetPasswordToken = req.params.token;

        // Find user by token and check if the token is not expired
        const user = await sequelize.query(
            'SELECT * FROM Users WHERE resetPasswordToken = :resetPasswordToken AND resetPasswordExpire > :now',
            {
                replacements: { resetPasswordToken, now: Date.now() },
                type: QueryTypes.SELECT
            }
        );

        if (user.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid token" });
        }

        // Set the new password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        await sequelize.query(
            'UPDATE Users SET password = :password, resetPasswordToken = NULL, resetPasswordExpire = NULL WHERE resetPasswordToken = :resetPasswordToken',
            {
                replacements: { password: hashedPassword, resetPasswordToken },
                type: QueryTypes.UPDATE
            }
        );

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.logoutUser = async (req, res, next) => {
    try {
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true
        });
  
        res.status(201).json({
            success: true,
            message: "Logged out"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await sequelize.query(
            'SELECT * FROM Users',
            {
                type: QueryTypes.SELECT
            }
        );

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
