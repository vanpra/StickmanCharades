import React, { useEffect, useState } from "react";
import "../index.css";
import { Card } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import socket from "../socket";
import User from "./UserComponent";
import UserData from "../../../backend/src/UserData";
import { TextField, Button } from "@material-ui/core";
import { useParams } from "react-router-dom";

class ChatMessage {
  senderId: string;
  message: string;

  constructor(senderId: string, message: string) {
    this.senderId = senderId;
    this.message = message;
  }
}

const useStyles = makeStyles({
  chatContainer: {
    verticalAlign: "center",
    margin: 5,
    padding: 10,
  },
  padding: {
    padding: 5,
  },
  margin: {
    margin: 5,
  },
  marginAndPadding: {
    margin: 5,
    padding: 5,
  },
  currentPlayer: {
    backgroundColor: "gold",
  },
  guessedCorrectly: {
    backgroundColor: "green",
  },
});

export default function ChatComponent(): React.ReactElement {
  const classes = useStyles();

  const [chatMessage, setChatMessage] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<Array<UserData>>([]);
  const [user, setUser] = useState<UserData>();

  const { gameId } = useParams();

  useEffect(() => {
    socket.emit("getUsers", gameId);
  }, [gameId]);

  useEffect(() => {
    socket.on("chat", (data: { id: string; message: string }) => {
      setChats([...chats, new ChatMessage(data.id, data.message)]);
    });

    socket.on("setUsers", (serverUsers: Array<UserData>) => {
      for (const it of serverUsers) {
        if (it.userId == socket.id) {
          setUser(it);
          break;
        }
      }
      setUsers(serverUsers);
    });

    return () => {
      socket.off("chat");
      socket.off("users");
    };
  });

  const submitGuess = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    socket.emit("chat", chatMessage);
    setChatMessage("");
  };

  const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div>
      <>
        {users.map((user: UserData, index: number) => (
          <Card
            className={
              classes.marginAndPadding + " " + user == undefined
                ? ""
                : user.isGuesser
                ? user.guessed
                  ? classes.guessedCorrectly
                  : ""
                : classes.currentPlayer
            }
            variant="outlined"
            key={index}
          >
            <User
              userName={user.username}
              lastGuess={user.lastGuess}
              score={user.score}
              guessedCorrect={user.guessed}
              isGuesser={user.isGuesser}
              key={index}
            />
          </Card>
        ))}
      </>

      <Card className={classes.chatContainer} variant="outlined">
        <form className="chat-form" onSubmit={(e) => submitForm(e)}>
          <TextField
            variant="outlined"
            color="secondary"
            className="chat-input"
            label="Guess"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
          />
          <Button
            className="chat-submit"
            onClick={(e) => submitGuess(e)}
            variant="outlined"
            color="secondary"
            disabled={!user?.isGuesser || user?.guessed}
          >
            Enter
          </Button>
        </form>
      </Card>
      <div>
        <Button
          className="game-start"
          onClick={() => {
            socket.emit("startGame");
          }}
          variant="contained"
          color="secondary"
        >
          START
        </Button>
      </div>
      <div>
        {chats.map((value, index) => {
          return (
            <p
              className={value.senderId == socket.id ? "curr" : "other"}
              key={index}
            >
              {value.message}
            </p>
          );
        })}
      </div>
    </div>
  );
}
