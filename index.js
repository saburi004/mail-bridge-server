
// import express from "express";
// import cors from "cors";
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// import { domainCheck } from "./middleware/domainCheck.js";
// import { auth } from "./middleware/auth.js";
// import { rateLimit } from "./middleware/rateLimit.js";
// import { logEvent } from "./utils/logger.js";
// import { generateKey } from "./routes/generateKey.js";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());
// app.post("/generate-key", generateKey);

// // SMTP transporter (with pooling)made changes
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,           // smtp-relay.brevo.com
//   port: Number(process.env.SMTP_PORT),   // 587
//   secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
//   requireTLS: true,                      // IMPORTANT
//   auth: {
//     user: process.env.SMTP_USER,         // a041f4001@smtp-brevo.com
//     pass: process.env.SMTP_PASS          // SMTP key
//   },
//   connectionTimeout: 20_000,             // 👈 VERY IMPORTANT
//   greetingTimeout: 20_000,
//   socketTimeout: 20_000
// });


// transporter.verify((error) => {
//   if (error) {
//     console.error("SMTP ERROR:", error);
//   } else {
//     console.log("✅ SMTP server ready");
//   }
// });

// app.post(
//   "/send-email",
//   domainCheck,
//   auth,
//   rateLimit,
//   async (req, res) => {
//     const start = Date.now();
//     const { to, subject, message } = req.body;

//     // Respond immediately (fast API)
//     res.json({ success: true });

//     try {
//       await transporter.sendMail({
//         from: "Mail Bridge <no-reply@brevo.com>",
//         to,
//         subject,
//         text: message
//       });

//       await logEvent({
//         apiKey: req.apiKey,
//         origin: req.headers.origin,
//         to,
//         status: "SUCCESS",
//         responseTime: Date.now() - start
//       });

//     } catch (err) {
//       console.error("Email error:", err);

//       await logEvent({
//         apiKey: req.apiKey,
//         origin: req.headers.origin,
//         to,
//         status: "FAILED",
//         responseTime: Date.now() - start
//       });
//     }
//   }
// );

// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { domainCheck } from "./middleware/domainCheck.js";
import { auth } from "./middleware/auth.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { logEvent } from "./utils/logger.js";
import { generateKey } from "./routes/generateKey.js";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());
dotenv.config();

app.post("/generate-key", generateKey);

// app.post(
//   "/send-email",
//   domainCheck,
//   auth,
//   rateLimit,
//   async (req, res) => {
//     const start = Date.now();
//     const { to, subject, message } = req.body;

//     // respond immediately
//     try {
//       console.log(`Attempting to send email to ${to}...`);

//       const r = await fetch("https://api.brevo.com/v3/smtp/email", {
//         method: "POST",
//         headers: {
//           "api-key": process.env.BREVO_API_KEY,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           sender: {
//             email: "no-reply@brevo.com",
//             name: "Mail Bridge"
//           },
//           to: [{ email: to }],
//           subject: subject,
//           textContent: message
//         })
//       });

//       if (!r.ok) {
//         const errText = await r.text();
//         console.error("Brevo API error response:", errText);
//         throw new Error(errText);
//       }

//       console.log("Email sent successfully to", to);

//       await logEvent({
//         apiKey: req.apiKey,
//         origin: req.headers.origin,
//         to,
//         status: "SUCCESS",
//         responseTime: Date.now() - start
//       });

//       res.json({ success: true });

//     } catch (err) {
//       console.error("Brevo API error:", err.message);

//       await logEvent({
//         apiKey: req.apiKey,
//         origin: req.headers.origin,
//         to,
//         status: "FAILED",
//         responseTime: Date.now() - start
//       });

//       res.status(500).json({ success: false, error: err.message });
//     }
//   }
// );
app.post(
  "/send-email",
  domainCheck,
  auth,
  rateLimit,
  async (req, res) => {
    const start = Date.now();
    const { to, subject, message } = req.body;

    try {
      console.log(`Sending email via Resend → ${to}`);

      const { data, error } = await resend.emails.send({
        from: "Mail Bridge <no-reply@saburinikam.in>",
        to: to,
        subject: subject,
        text: message
      });

      if (error) {
        console.error("Resend API error:", error);
        throw new Error(error.message);
      }

      console.log("Email sent successfully:", data);

      await logEvent({
        apiKey: req.apiKey,
        origin: req.headers.origin,
        to,
        status: "SUCCESS",
        responseTime: Date.now() - start
      });

      res.json({ success: true, data });

    } catch (err) {
      console.error("Resend error:", err.message);

      await logEvent({
        apiKey: req.apiKey,
        origin: req.headers.origin,
        to,
        status: "FAILED",
        responseTime: Date.now() - start
      });

      res.status(500).json({ success: false, error: err.message });
    }
  }
);


app.get("/", (req, res) => {
  res.json({ status: "ok", service: "mail-bridge" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
