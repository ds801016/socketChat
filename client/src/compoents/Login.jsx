import React, { useState } from "react";
import axios from "axios";

export default function Login({ setUser }) {
  const [name, setName] = useState("");
  const handleLogin = async (e) => {
    e.preventDefault();
    const { data } = await axios.post("/user", { name });
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };
  return (
    <div>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button>Login</button>
      </form>
    </div>
  );
}
