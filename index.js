// import express from "express";
// import cors from "cors";
// import nodemailer from "nodemailer";
// import { rateLimit } from "./middleware/rateLimit.js";
// import { auth } from "./middleware/auth.js";
// import dotenv from "dotenv";
// import { domainCheck } from "./middleware/domainCheck.js";

// dotenv.config();
// const app = express();
// const PORT = process.env.PORT || 5000;

// const API_KEY = process.env.API_KEY || "pk_test_123456";

// app.use(cors());
// app.use(express.json());

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS
//   }
// });

// transporter.verify((error) => {
//   if (error) {
//     console.error("SMTP ERROR:", error);
//   } else {
//     console.log("✅ SMTP server ready");
//   }
// });

// app.post("/send-email", domainCheck, auth, rateLimit, async (req, res) => {
//   const apiKey = req.headers["x-api-key"];
//   if (apiKey !== API_KEY) {
//     return res.status(401).json({ success: false });
//   }

//   const { to, subject, message } = req.body;

//   try {
//     await transporter.sendMail({
//       from: "Mail Bridge <nikamsaburi16@gmail.com>",
//       to,
//       subject,
//       text: message
//     });

//     res.json({ success: true });
//   } catch (err) {
//     console.error("SEND ERROR:", err);
//     res.status(500).json({ success: false });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

import { domainCheck } from "./middleware/domainCheck.js";
import { auth } from "./middleware/auth.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { logEvent } from "./utils/logger.js";
import { generateKey } from "./routes/generateKey.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.post("/generate-key", generateKey);

// SMTP transporter (with pooling)made changes
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,           // smtp-relay.brevo.com
  port: Number(process.env.SMTP_PORT),   // 587
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  requireTLS: true,                      // IMPORTANT
  auth: {
    user: process.env.SMTP_USER,         // a041f4001@smtp-brevo.com
    pass: process.env.SMTP_PASS          // SMTP key
  },
  connectionTimeout: 20_000,             // 👈 VERY IMPORTANT
  greetingTimeout: 20_000,
  socketTimeout: 20_000
});


transporter.verify((error) => {
  if (error) {
    console.error("SMTP ERROR:", error);
  } else {
    console.log("✅ SMTP server ready");
  }
});

app.post(
  "/send-email",
  domainCheck,
  auth,
  rateLimit,
  async (req, res) => {
    const start = Date.now();
    const { to, subject, message } = req.body;

    // Respond immediately (fast API)
    res.json({ success: true });

    try {
      await transporter.sendMail({
        from: "Mail Bridge <no-reply@brevo.com>",
        to,
        subject,
        text: message
      });

      await logEvent({
        apiKey: req.apiKey,
        origin: req.headers.origin,
        to,
        status: "SUCCESS",
        responseTime: Date.now() - start
      });

    } catch (err) {
      console.error("Email error:", err);

      await logEvent({
        apiKey: req.apiKey,
        origin: req.headers.origin,
        to,
        status: "FAILED",
        responseTime: Date.now() - start
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
