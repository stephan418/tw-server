import express from "express";
import { MongoClient } from "mongodb";
import { HError } from "../errors/http_errors";
import { asyncHandler } from "../errors/handle_async";
import { mongo_url } from "../utils/mongodb_config";
import { generateUniqueIdentifier } from "../utils/uid";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const endpointStyle = "/create?username=xxxxx";

    if (!req.query.username) {
      throw HError.parameterMissing("username", endpointStyle);
    }

    const db = (await MongoClient.connect(mongo_url, { useUnifiedTopology: true })).db("typewriter");

    const game_id = await generateUniqueIdentifier(async (new_id) => {
      return (await db.collection("rooms").find({ game_id: new_id }).count()) !== 0;
    });

    const ref = await generateUniqueIdentifier(async (new_ref) => {
      return (await db.collection("prejoins").find({ref: new_ref}).count()) !== 0;
    })

    db.collection("rooms").insertOne({
      game_id,
      phase: 0,
      users: [],
    });

    db.collection("prejoins").insertOne({
      ref,
      username: req.query.username,
      game_id,
      leader: true,
      expires: Math.floor(new Date().getTime() / 1000) + 30,
    })

    res.json({
      type: "success",
      result: {
        type: "CREATED",
        game_id,
        ref,
      }
    })
  })
);

export default router;
