import React from "react";
import "./index.css";
import avatar from "./Assets/user.jpg";

export default function User() {
  return (
    <div className="flex-row">
      <img src={avatar} className="user-img"></img>
      <div className="flex-col">
        <p>Nickname</p>
        <p>Recent Chat</p>
      </div>
    </div>
  );
}