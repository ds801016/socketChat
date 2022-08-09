import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { MdDelete } from "react-icons/md";
import { format } from "timeago.js";

let socket, selectedChatCompare;

export default function Messenger({ setUser, user }) {
  const ref = useRef();

  const [searchedInput, setSearchedInput] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [freshMessages, setFreshMessages] = useState([]);
  const [searchingUser, setSearchingUser] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState(false);

  //useEffect on page load
  useEffect(() => {
    getConversations();

    socket = io("http://localhost:8080");
    socket.emit("setup", user);
    socket.on("connected", () => {
      setSocketConnected(true);
    });
  }, []);

  const handleLogOut = () => {
    setUser(null);
    localStorage.clear();
  };
  const handleSendingMessage = async (e) => {
    e.preventDefault();
    let messageData = {
      text: newMessage,
      receiverId: receiver._id,
      senderId: user._id,
      conversationId: selectedConversation._id,
    };

    const { data } = await axios.post("/conversation/message", messageData);
    setFreshMessages([...freshMessages, data]);
    socket.emit("socket_send_message", data);
    setNewMessage("");

    // setFreshMessages([...freshMessages,data])
  };
  const getMessages = async () => {
    const { data } = await axios.get(
      `conversation/message/${selectedConversation._id}`
    );
    setFreshMessages(data.messages);

    let tempConversations = conversations.map((conv) =>
      conv._id == data.conv._id ? (conv = data.conv) : (conv = conv)
    );

    socket.emit("socket_message_seen", data.messages[data.messages.length - 1]);

    let dummy = tempConversations.sort((a, b) => {
      // console.log();
      console.log(b.updatedAt - a.updatedAt);
      return parseInt(b.updatedAt) - parseInt(a.updatedAt);
    });
    setConversations(dummy);
  };

  //getting all the conversations of a user
  const getConversations = async () => {
    const { data } = await axios.get(`/conversation/${user._id}`);
    let dummy = data.sort((a, b) => {
      return parseInt(b.updatedAt) - parseInt(a.updatedAt);
    });
    setConversations(dummy);
  };
  //handle delete conversation
  const deleteCoversation = async (convId) => {
    console.log(convId);
    await axios.delete(`/conversation/${convId}`);
    setConversations(conversations.filter((conv) => conv._id != convId));
  };
  //creating conversations if not exists
  const handleConversation = async () => {
    const { data } = await axios.post("/conversation", [
      user._id,
      receiver._id,
    ]);

    setSelectedConversation(data);
  };

  //use effect on selected conversation
  useEffect(() => {
    if (receiver) {
      getMessages();
      socket.emit("socket_join_room", {
        conversationId: selectedConversation._id,
      });
      selectedChatCompare = selectedConversation;
    }
  }, [selectedConversation]);
  //useEffect on changed receiver
  useEffect(() => {
    if (receiver) {
      handleConversation();
    }
  }, [receiver]);

  useEffect(() => {
    socket.on("socket_receive_message", (data) => {
      let latestConv = conversations?.filter(
        (conv) => conv._id === data.conversationId
      )[0];
      let dummy = conversations?.filter(
        (conv) => conv._id !== data.conversationId
      );

      if (
        !selectedChatCompare ||
        selectedChatCompare._id != data.conversationId
      ) {
        getConversations();
      } else {
        setFreshMessages([...freshMessages, data]);

        socket.emit("socket_message_seen", data);
      }
    });

    socket.on("socket_seen_recieved", (data) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id != data.conversationId
      ) {
      } else {
        // let messageSeen = fresh;

        let tempMessages = freshMessages.map((message) =>
          message._id == data._id ? (message = data) : (message = message)
        );
        setFreshMessages(tempMessages);
      }
    });
  });
  //use effect for change in messages
  useEffect(() => {
    ref.current.scrollIntoView();
  }, [freshMessages]);
  //use effect on search user input
  useEffect(() => {
    const handleSearch = async () => {
      if (searchedInput.length > 0) {
        setSearchingUser(true);
        const { data } = await axios.get(
          `/user/searchUser?searchedInput=${searchedInput}`
        );
        setSearchedUsers(data);
      } else {
        setSearchedUsers([]);
        setSearchingUser(false);
        getConversations();
      }
    };
    handleSearch();
  }, [searchedInput]);
  return (
    <div>
      {" "}
      <div className="messenger">
        <div className="left-panel">
          <h2>{user?.name}</h2>
          <input
            className="searchUser"
            type="text"
            placeholder="Search user..."
            value={searchedInput}
            onChange={(e) => setSearchedInput(e.target.value)}
            tabIndex="0"
          />
          {/* conversations list here */}
          {conversations.length > 0 && !searchingUser
            ? conversations?.map((u) =>
                u?.members.map(
                  (conv) =>
                    conv._id != user._id && (
                      <div
                        onClick={() => setReceiver(conv)}
                        className={`user ${
                          selectedConversation?._id == u._id && "selected-chat"
                        }`}
                      >
                        <div className="upper-row">
                          {conv.name}
                          <MdDelete
                            onClick={() => deleteCoversation(u._id)}
                            className="delete-icon"
                          />
                        </div>
                        <div>
                          {u.latestMessage && (
                            <div
                              className={`lower-row ${
                                u.unReadMessage && "unread"
                              }`}
                            >
                              {u.latestMessage?.text?.length > 25
                                ? u.latestMessage?.text?.substring(0, 25) +
                                  "..."
                                : u.latestMessage?.text}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                )
              )
            : searchingUser &&
              searchedUsers.map((user) => (
                <div onClick={() => setReceiver(user)} className="user">
                  {user?.name}
                </div>
              ))}
        </div>
        {/* {selectedConversation && reciever && ( */}
        <div className="main-panel">
          <div className="user-panel">
            {receiver?.name}
            <button className="logout-btn" onClick={handleLogOut}>
              Logout
            </button>
          </div>
          <div className="messages">
            {/* messages here */}
            {freshMessages.map((message) => (
              <div
                className={`message ${
                  message.senderId._id == user._id
                    ? "own"
                    : message.senderId == user._id && "own"
                }`}
              >
                {message.text}
                <span>{format(message.createdAt)}</span>
                {message._id == freshMessages[freshMessages.length - 1]._id &&
                  message.senderId._id == user._id &&
                  message.messageSeen == true && (
                    <span className="seen-tag">seen</span>
                  )}
              </div>
            ))}
            <span ref={ref} className="messages-end"></span>
          </div>
          <form onSubmit={handleSendingMessage} className="write-message">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              type="text"
              placeholder="Wtite Something..."
            />
            <button>Send</button>
          </form>
        </div>
        {/* )} */}
      </div>
    </div>
  );
}
