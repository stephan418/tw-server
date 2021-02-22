import express from "express";
import socketio from "socket.io";
import path from "path";
import registerRoutes from "./routes/register";
import createRoutes from "./routes/create";
import { errorHandler } from "./errors/error_handlers";
import { Db, MongoClient } from "mongodb";
import { mongo_url } from "./utils/mongodb_config";
import { SError } from "./errors/socket_errors";
import cors from "cors";
import { WordLists } from "./utils/words";

const words = new WordLists("default-words.json");

const app = express();

app.use(cors());

const http = require("http").createServer(app);
const io: socketio.Server = require("socket.io")(http, { cors: { origin: true, methods: ["GET", "POST"] } });

// Route for delivering the Website itself
// TODO: Move into its own microservice

io.on("connection", async (socket: socketio.Socket) => {
  let username: string | undefined = undefined;
  let game_id: string | undefined = undefined;

  socket.on("activate", async (args) => {
    if (!args || typeof args.ref !== "string") {
      socket.emit("error", SError.argumentMissing("ref", "string", { ref: "string" }).response);
      return;
    }

    const db = (await MongoClient.connect(mongo_url, { useUnifiedTopology: true })).db("typewriter");

    const prejoin_doc = (await db.collection("prejoins").find({ ref: args.ref }).toArray())[0];

    if (prejoin_doc === undefined) {
      socket.emit("error", SError.argumentValueNotFound("ref", args.ref).response);
    } else if (prejoin_doc.expires < Math.floor(new Date().getTime() / 1000)) {
      socket.emit("error", SError.limitExceeded("expiry", "the requested registration with the specified ref already expired").response);
    } else {
      const room_doc = (await db.collection("rooms").find({ game_id: prejoin_doc.game_id }).toArray())[0];

      // TODO: Room could already be deleted
      await db.collection("rooms").updateOne(
        { game_id: prejoin_doc.game_id },
        {
          $push: {
            users: {
              username: prejoin_doc.username,
              socket_id: socket.id,
              leader: prejoin_doc.leader,
              finished: false,
              speed: 0,
            },
          },
        }
      );

      io.to(prejoin_doc.game_id).emit("joined", { username: prejoin_doc.username });
      socket.join(prejoin_doc.game_id);
      socket.emit("activated", { username: prejoin_doc.username });
      socket.emit("users", { usernames: room_doc.users.map((user: { username: string }) => user.username) });

      let wordLists = [{name: "default", commonName: `Default (${words.default?._commonName})`}];

      for (let n of words.listNames) {
        wordLists.push({name: n, commonName: words.get(n)?._commonName || ''});
      }

      socket.emit("word-lists", { lists: wordLists });

      username = prejoin_doc.username;
      game_id = prejoin_doc.game_id;

      db.collection("prejoins").deleteOne({ ref: args.ref });
    }
  });

  socket.on("start", async () => {
    if (!game_id || !username) {
      socket.emit("error", SError.protocolNotFollowed("start", "activate").response);
      return;
    }

    const db = (await MongoClient.connect(mongo_url, { useUnifiedTopology: true })).db("typewriter");
    const room = (await db.collection("rooms").find({ game_id }).toArray())[0];
    const isLeader =
      (await db
        .collection("rooms")
        .find({ game_id, users: { $elemMatch: { socket_id: socket.id, leader: true } } })
        .count()) === 1;

    if (room === undefined) {
      socket.emit("error", SError.generic("Session invalid"));
    } else if (room.phase !== 0) {
      socket.emit("error", SError.limitExceeded("start_once", "the game can only be started once").response);
    } else if (!isLeader) {
      socket.emit("error", SError.permissionError("leader"));
    } else {
      db.collection("rooms").updateOne({ game_id }, { $set: { phase: 1 } });

      let room_words = words.default?.random(10);

      if (!room_words) {
        socket.emit("error", SError.argumentValueNotFound("word_list", "default"));
        return;
      };

      io.to(game_id as string).emit("starting", { in: 5, words: room_words });
      setTimeout(async () => {
        const db = (await MongoClient.connect(mongo_url, { useUnifiedTopology: true })).db("typewriter");
        db.collection("rooms").updateOne({ game_id }, { $set: { phase: 2 } });
        io.to(game_id as string).emit("started");
      }, 5000); // TODO: make 5s delay changable

      socket.emit("start-scheduled");
      db.collection("rooms").updateOne({ game_id }, { $set: { text_size: room_words.join(" ").length } });
    }
  });

  socket.on("update-progress", async (args) => {
    // TODO: cheat checking
    if (!args || typeof args.typed !== "number") {
      socket.emit("error", SError.argumentMissing("typed", "int", { ref: "string" }).response);
      return;
    } else if (!args || typeof args.speed !== "number") {
      socket.emit("error", SError.argumentMissing("speed", "int", { ref: "string" }).response);
    }

    if (!game_id || !username) {
      socket.emit("error", SError.protocolNotFollowed("start", "activate").response);
      return;
    }

    const rooms = (await MongoClient.connect(mongo_url, { useUnifiedTopology: true })).db("typewriter").collection("rooms");
    const room_doc = (await rooms.find({ game_id }).toArray())[0];

    if (room_doc.phase !== 2) {
      socket.emit("error", SError.protocolNotFollowed("update_progress", "started").response);
    } else if (room_doc.users.filter((user: any) => user.socket_id === socket.id)[0].finished) {
      socket.emit("error", SError.protocolNotFollowed("update_progress", "started").response); // TODO: Better fitted error
    } else {
      let typed = args.typed;
      let speed = args.speed;

      if (typed >= room_doc.text_size) {
        typed = room_doc.text_size;

        const position = await rooms.find({ game_id, users: { $elemMatch: { finished: true } } }).toArray();
        console.log(username, position);

        io.to(game_id).emit("finished-typing", { username: username, position: 1 });

        rooms.updateOne({ game_id, users: { $elemMatch: { username } } }, { $set: { "users.$.finished": true } });
      }

      io.to(game_id).emit("progress-update", { username, typed, speed });
    }
  });

  socket.on("reset", async (args) => {
    if (!game_id || !username) {
      socket.emit("error", SError.protocolNotFollowed("start", "activate").response);
      return;
    }

    const db = (await MongoClient.connect(mongo_url, { useUnifiedTopology: true })).db("typewriter");
    const room = (await db.collection("rooms").find({ game_id }).toArray())[0];
    const isLeader =
      (await db
        .collection("rooms")
        .find({ game_id, users: { $elemMatch: { socket_id: socket.id, leader: true } } })
        .count()) === 1;

    if (room === undefined) {
      socket.emit("error", SError.generic("Session invalid"));
    } else if (!isLeader) {
      socket.emit("error", SError.permissionError("leader"));
    } else {
      const room_doc = (await db.collection("rooms").find({ game_id }).toArray())[0];

      const users = room_doc.users.map((user: any) => {
        return { username: user.username, socket_id: user.socket_id, leader: user.leader, finished: false, speed: 0 };
      });

      db.collection("rooms").updateOne({ game_id }, { $set: { game_id, phase: 0, users } });

      io.to(game_id).emit("room-reset");
    }
  });
});

app.use("/register", registerRoutes);
app.use("/create", createRoutes);

app.use(errorHandler);

http.listen(3000);
