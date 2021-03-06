import React, { useEffect } from "react";
import Sketch from "react-p5";
import p5Types from "p5";
import { useMemo } from "react";
import Stage from "../stage/Stage";
import { SpriteNode } from "../stage/SpriteNode";
import { Sprite } from "../stage/Sprite";
import { useState } from "react";
import { IPoint } from "../stage/IPoint";
import { Shape } from "../stage/Shape";
import socket from "../socket";
import { Button, Typography } from "@material-ui/core";
import { useParams } from "react-router-dom";
import UserData from "../../../backend/src/UserData";

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

const STICKMAN_LENGTH = 60;

function drawSprite(p5: p5Types, x: number, y: number, color = "#FF0000") {
  p5.push();
  p5.strokeWeight(2);
  p5.fill(color);
  p5.ellipse(x, y, 20, 20);
  p5.pop();
}

function drawSpriteNodes(
  p5: p5Types,
  currX: number,
  currY: number,
  sprites: SpriteNode[]
) {
  sprites.forEach((element) => {
    p5.strokeWeight(5);
    p5.noFill();
    switch (element.limbShape) {
      case Shape.Line: {
        p5.line(currX, currY, element.getX(), element.getY());

        break;
      }
      case Shape.Circle: {
        p5.circle(
          (currX + element.getX()) / 2,
          (currY + element.getY()) / 2,
          element.length
        );
        break;
      }
    }
    drawSpriteNodes(p5, element.getX(), element.getY(), element.children);
    drawSprite(p5, element.getX(), element.getY());
  });
}

function getClosestSprite(
  x: number,
  y: number,
  nodes: SpriteNode[]
): SpriteNode {
  let closestNode: SpriteNode = nodes[0];
  let minDistance: number = closestNode.getSquaredDistanceFrom(x, y);
  nodes.forEach((it) => {
    const distFromMouse = it.getSquaredDistanceFrom(x, y);

    if (it.children.length > 0) {
      const minChild = getClosestSprite(x, y, it.children);
      const minChildDist = minChild.getSquaredDistanceFrom(x, y);

      if (minChildDist < minDistance) {
        closestNode = minChild;
        minDistance = minChildDist;
      }
    }

    if (distFromMouse < minDistance) {
      closestNode = it;
      minDistance = distFromMouse;
    }
  });

  return closestNode;
}

export default function StickmanComponent(): React.ReactElement {
  const [canvasSize, setCanvasSize] = useState({ width: 16, height: 9 });
  const { gameId } = useParams();

  const center = useMemo<Point>(
    () => new Point(canvasSize.width / 2, canvasSize.height / 2),
    [canvasSize]
  );

  const [stickmanSprite, setStickmanSprite] = useState(
    Stage.generateStickman(center.x, center.y, STICKMAN_LENGTH)
  );
  const [selectedNode, setSelectedNode] = useState<IPoint>();
  const [user, setUser] = useState<UserData>();

  useEffect(() => {
    socket.emit("getUsers", gameId);
  }, [gameId]);

  useEffect(() => {
    socket.on(
      "stickmanReceiveMove",
      (data: { message: string; id: string }) => {
        if (socket.id != data.id) {
          const sprite: Sprite = Sprite.fromJson(data.message);
          setStickmanSprite(sprite);
        }
      }
    );

    socket.on("setUsers", (serverUsers: Array<UserData>) => {
      for (const it of serverUsers) {
        if (it.userId == socket.id) {
          setUser(it);
          break;
        }
      }
    });

    socket.on("startRound", () => {
      setStickmanSprite(
        Stage.generateStickman(center.x, center.y, STICKMAN_LENGTH)
      );
    });

    return () => {
      socket.off("stickmanReceiveMove");
      socket.off("startRound");
    };
  });

  const onClick = (p5: p5Types) => {
    const closestChild = getClosestSprite(
      p5.mouseX,
      p5.mouseY,
      stickmanSprite.sprites
    );
    const closestDist = closestChild.getSquaredDistanceFrom(
      p5.mouseX,
      p5.mouseY
    );
    const parentDist = stickmanSprite.getSquaredDistanceFrom(
      p5.mouseX,
      p5.mouseY
    );
    if (closestDist < parentDist) {
      setSelectedNode(closestChild);
    } else {
      setSelectedNode(stickmanSprite);
    }
  };

  const onDrag = (p5: p5Types) => {
    if (selectedNode != undefined) {
      if (selectedNode instanceof Sprite) {
        // TODO: Dont let this overflow the form
        selectedNode.movePos(p5.mouseX, p5.mouseY);
      } else if (selectedNode instanceof SpriteNode) {
        const selectedParent = selectedNode.parent;

        const parentX = selectedParent.getX();
        const parentY = selectedParent.getY();

        const angle =
          180 -
          Math.atan2(p5.mouseX - parentX, p5.mouseY - parentY) *
            (180 / Math.PI);

        selectedNode.setAngle(angle);
      }
      socket.emit("stickmanEmitMove", stickmanSprite.toJson());
    }
  };

  const updateCanvasSize = () => {
    const newWidth = document.getElementById("stickman-container")!.clientWidth;
    const newHeight = newWidth * (9 / 16);
    setCanvasSize({
      width: newWidth,
      height: newHeight,
    });
    return [newWidth, newHeight];
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    const [width, height] = updateCanvasSize();
    p5.createCanvas(width, height).parent(canvasParentRef);
  };

  const draw = (p5: p5Types) => {
    p5.clear();
    drawSpriteNodes(
      p5,
      stickmanSprite.getX(),
      stickmanSprite.getY(),
      stickmanSprite.sprites
    );

    drawSprite(p5, stickmanSprite.getX(), stickmanSprite.getY(), "#FFA500");
  };

  const windowResized = (p5: p5Types) => {
    updateCanvasSize();
    p5.resizeCanvas(canvasSize.width, canvasSize.height);
  };

  const resetSprite = () => {
    const newMan = Stage.generateStickman(center.x, center.y, STICKMAN_LENGTH);
    setStickmanSprite(newMan);
    socket.emit("stickmanEmitMove", newMan.toJson());
  };

  return (
    <div>
      <div className="flex-col">
        <Typography variant="h3" className="hint_text">
          {user?.word}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => resetSprite()}
          disabled={user?.isGuesser}
        >
          RESET
        </Button>
      </div>
      <Sketch
        setup={setup}
        draw={draw}
        windowResized={windowResized}
        mouseDragged={user?.isGuesser ? () => {} : onDrag}
        mousePressed={user?.isGuesser ? () => {} : onClick}
      />
    </div>
  );
}
