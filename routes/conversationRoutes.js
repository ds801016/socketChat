const express = require("express");
const router = express.Router();
const User = require("../models/userSchema");
const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");

//getting all the conversation of a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  // console.log(userId.toString());
  const conversations = await Conversation.find({
    members: { $in: [userId] },
  }).populate("members latestMessage");
  res.send(conversations);
});
//creating a route if not exists
router.post("/", async (req, res) => {
  const conversationExist = await Conversation.findOne({
    $and: [
      { members: { $in: [req.body[0].toString()] } },
      { members: { $in: [req.body[1].toString()] } },
    ],
  });
  // const conversationExist = await Conversation.findOne({ members: req.body });
  // console.log(conversationExist);
  if (conversationExist) {
    res.send(conversationExist);
  } else {
    const newConversation = new Conversation({
      members: [req.body[0], req.body[1]],
    });
    newConversation.save();
    res.send(newConversation);
  }
});

//creating new messages
router.post("/message", async (req, res) => {
  const messageData = req.body;
  const newMessage = new Message(messageData);
  newMessage.populate("receiverId senderId");

  const { conversationId } = messageData;
  const conv = await Conversation.findById(conversationId).populate(
    "latestMessage members"
  );
  conv.latestMessage = newMessage._id;
  conv.unReadMessage = true;
  await conv.save();
  await newMessage.save();
  res.send(newMessage);
});

//getting messages
router.get("/message/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  const messages = await Message.find({ conversationId }).populate(
    "receiverId senderId"
  );
  const conv = await Conversation.findById(conversationId).populate(
    "latestMessage members"
  );
  if (messages.length > 0) {
    messages[messages.length - 1].messageSeen = true;
    const messageSeen = messages[messages.length - 1];
    await messageSeen.save();
    conv.unReadMessage = false;
    await conv.save();
    res.send({ messages, conv });
  }
});

//to delete a conversation
router.delete("/:conversationId", async (req, res) => {
  const { conversationId } = req.params;

  await Conversation.deleteOne({ _id: conversationId.toString() });
  await Message.deleteMany({ conversationId });
  res.send("done");
});
module.exports = router;
