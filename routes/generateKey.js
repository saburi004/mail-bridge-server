import crypto from "crypto";
import redis from "../redis.js";

export async function generateKey(req, res) {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }

  const apiKey = "pk_" + crypto.randomBytes(24).toString("hex");

  await redis.set(`user:${apiKey}`, email);

  res.json({ apiKey });
}
