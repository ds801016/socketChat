const express = require("express");
const router = express.Router();
const User = require("../models/userSchema");

//create user if not exist
router.post("/", async (req, res) => {
  const { name } = req.body;

  const userExist = await User.findOne({ name });

  if (userExist) {
    res.send(userExist);
  } else {
    const newUser = new User({ name });
    await newUser.save();
    res.send(newUser);
  }
});

//getting all the users
router.get("/", async (req, res) => {
  const users = await User.find();
  console.log("arrived");
  res.send(users);
});
//searching users
router.get("/searchUser", async (req, res) => {
  const { searchedInput } = req.query;
  const result = await User.find({ name: searchedInput });
  res.send(result);
});
module.exports = router;
