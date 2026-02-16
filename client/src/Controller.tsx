import { useEffect, useRef, useState } from "react";
import "./App.css";
import { io, Socket } from "socket.io-client";
import type { Role } from "../../shared/types";

function Controller() {
  const socketRef = useRef<Socket | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    // Register as controller once
    socket.emit("register", "controller" as Role);

    socket.on("STATUS", (status) => {
      setReady(status.speakerA && status.speakerB);
    });

    socket.on("ERROR", (msg) => alert(msg));

    return () => {
      socket.disconnect();
    };
  }, []);

  const startHost = () => {
    socketRef.current?.emit("START");
  };

  const joinHost = () => {
    socketRef.current?.emit("JOIN");
  };

  const startSimulator = () => {
    socketRef.current?.emit("START_SIMULATOR");
  };

  return (
    <>
      <button onClick={startHost}>Host</button>
      <button onClick={joinHost}>Join</button>
      <button onClick={startSimulator}>Start Crosswalk Simulator</button>
    </>
  );
}

export default Controller;
