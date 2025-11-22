require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const orderRoutes = require("./routes/orderRoutes");
const menuRoutes = require("./routes/menuRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);

app.get("/kitchen", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "kitchen.html"));
});

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Unexpected server error" });
});

io.on("connection", (socket) => {
  // eslint-disable-next-line no-console
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    // eslint-disable-next-line no-console
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kds-campus";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    server.listen(PORT, () =>
      // eslint-disable-next-line no-console
      console.log(`KDS server running on port ${PORT}`)
    );
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Mongo connection failed", error.message);
    process.exit(1);
  });
