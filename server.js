const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const { Server } = require("socket.io");
//routes
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const connectDb = async () => {
  await mongoose.connect(
    "mongodb+srv://ds801015:ao8W9i1uscyAOEb7@test.ek7si.mongodb.net/?retryWrites=true&w=majority"
  );
  console.log("db connected");
};
connectDb();

app.use("/user", userRoutes);
app.use("/conversation", conversationRoutes);
app.use(express.static(path.join(__dirname, "./client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});
const server = app.listen(
  8080,
  console.log(
    "server started on port 8080******************************************"
  )
);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // console.log("user connected " + socket.id);

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    // console.log("user joined personal room " + userData._id);
    socket.emit("connected");
  });

  //joining the room
  socket.on("socket_join_room", ({ conversationId }) => {
    // console.log(data);
    socket.join(conversationId);
    // console.log("user joined room: " + conversationId);
  });
  //sending and recieving messages
  socket.on("socket_send_message", (data) => {
    // console.log(data.receiverId._id);
    if (data.receiverId._id) {
      socket.in(data.receiverId._id).emit("socket_receive_message", data);
    } else {
      socket.in(data.receiverId).emit("socket_receive_message", data);
    }
  });
  socket.on("socket_message_seen", (data) => {
    data = { ...data, messageSeen: true };
    if (data) {
      socket.in(data.senderId._id).emit("socket_seen_recieved", data);
    }
  });
  socket.on("disconnect", () => {
    console.log("user disconnected " + socket.id);
  });
});
