import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import Login from "./compoents/Login";
import Messenger from "./compoents/Messenger";

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  return (
    <div className="App">
      {user ? (
        <Messenger user={user} setUser={setUser} />
      ) : (
        <Login setUser={setUser} />
      )}
    </div>
  );
}

export default App;
