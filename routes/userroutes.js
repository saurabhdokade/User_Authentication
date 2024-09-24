const express = require("express");
const { register, login, forgotPassword, resetPassword, getAllUsers, logoutUser, updateUser, deleteUser } = require("../controller/usercontroller")

const router = express.Router();

router.route("/").post(register)
router.route("/update/:email").put(updateUser)
router.route('/user/:email').delete(deleteUser)
router.route("/login").get(login)
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:token", resetPassword);
router.get("/logout", logoutUser);
router.get("/users", getAllUsers);

module.exports = router