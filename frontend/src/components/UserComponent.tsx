import React from "react";
import "../index.css";
import { makeStyles } from "@material-ui/core/styles";
import { Avatar, Typography } from "@material-ui/core";

const useStyles = makeStyles({
  padding: {
    padding: 5,
  },
  leftMargin: {
    marginLeft: 20,
  },
  marginAndPadding: {
    margin: 5,
    padding: 5,
  },
});

export default function User(prop: {
  userName: string;
  lastGuess: string;
  score: number;
  guessedCorrect: boolean;
  isGuesser: boolean;
}): React.ReactElement {
  const classes = useStyles();
  return (
    <div className="flex-row">
      <Avatar>{prop.userName.charAt(0)}</Avatar>
      <div className={[classes.leftMargin, "flex-col"].join(" ")}>
        <Typography variant="body1" gutterBottom className="user-name-field">
          {prop.userName}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Most recent guess: {prop.lastGuess}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Score: {prop.score}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {prop.isGuesser
            ? prop.guessedCorrect
              ? "Guessed Correctly"
              : "Still Guessing"
            : "Current Player"}
        </Typography>
      </div>
    </div>
  );
}
