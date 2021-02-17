import express from "express";
import { MongoClient } from "mongodb";
import { HError } from "../errors/http_errors";
import { mongo_url } from "../utils/mongodb_config";
import { generateUniqueIdentifier } from "../utils/uid";
import { asyncHandler } from '../errors/handle_async'

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const endpointStyle = "/register?username=xxxxx&game_id=xxxxx";

    // Check for required parameters
    if (!req.query.username) {
      throw HError.parameterMissing("username", endpointStyle);
    } else if (!req.query.game_id) {
      throw HError.parameterMissing("game_id", endpointStyle);
    }

    // Connect and select 'typewriter' database
    const db = (await MongoClient.connect(mongo_url, { useUnifiedTopology: true })).db("typewriter");

    const rooms_exists = (await db.collection("rooms").find({ game_id: req.query.game_id }).count()) !== 0;

    if (!rooms_exists) {
      throw HError.parameterValueNotFound("game_id", req.query.game_id.toString());
    }

    // Check if there is a document which has a 'game_id' of the query param 'game_id'
    // and contains an user which has the requested name
    const name_exists_in_rooms =
      (await db
        .collection("rooms")
        .find({ game_id: req.query.game_id.toString(), users: { $elemMatch: { username: req.query.username.toString() } } })
        .count()) !== 0;

    if (name_exists_in_rooms) {
      throw HError.exists("username", req.query.username.toString());
    }

    // Check if the username has already been used to register for joining a room
    const name_exists_in_prejoins = (await db
      .collection("prejoins")
      .find({ username: req.query.username, game_id: req.query.game_id.toString() }).count()) !== 0;

    if (name_exists_in_prejoins) {
      throw HError.exists("username", req.query.username.toString());
    }

    // Generate an 8-bit identifier (hex)
    let ref = await generateUniqueIdentifier(async (new_ref) => {
      return (await db.collection("prejoins").find({ new_ref }).count()) !== 0;
    });

    db.collection("prejoins").insertOne({
      ref,
      username: req.query.username,
      game_id: req.query.game_id,
      expires: Math.floor(new Date().getTime() / 1000) + 20,
    });

    res.json({
      type: "success",
      result: {
        type: "REGISTERED",
        ref,
      },
    });
  })
);

export default router;
