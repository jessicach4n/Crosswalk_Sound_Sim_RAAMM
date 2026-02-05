import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

let clients: string[] = [];

io.on("connection", (socket) => {
  clients.push(socket.id);

  console.log("Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    clients = clients.filter(id => id !== socket.id);

  });
});

server.listen(3001, () => {
  console.log("Server running on 3001");
});
