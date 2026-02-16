import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import type { Role, JoinPayload, Room } from "../../shared/types";

const app = express();
app.use(cors());

const server = http.createServer(app);

const rooms = new Map<string, Room>();

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  
});

server.listen(3001, () => {
  console.log("Server listening on port 3001");
});
