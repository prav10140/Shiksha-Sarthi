import React, { useState } from "react";
import "./ChatApp.css";

function ChatApp() {
  const [user, setUser] = useState({ name: "", role: "" });
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const joinChat = () => {
    if (user.name && user.role) {
      setLoggedIn(true);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages([
      ...messages,
      {
        text: message,
        name: user.name,
        role: user.role,
        time: new Date().toLocaleTimeString(),
      },
    ]);
    setMessage("");
  };

  if (!loggedIn) {
    return (
      <div className="login">
        <h2>Study Platform Chat</h2>
        <input
          placeholder="Your name"
          onChange={(e) => setUser({ ...user, name: e.target.value })}
        />
        <select onChange={(e) => setUser({ ...user, role: e.target.value })}>
          <option value="">Select role</option>
          <option value="Teacher">Teacher</option>
          <option value="Student">Student</option>
        </select>
        <button onClick={joinChat}>Join Chat</button>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <h3>Live Study Chat</h3>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <strong>
              {msg.name} ({msg.role})
            </strong>
            <p>{msg.text}</p>
            <span>{msg.time}</span>
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={message}
          placeholder="Type your message..."
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatApp;
