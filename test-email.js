
import fetch from 'node-fetch';

async function runCallback() {
    try {
        console.log("Generating API Key...");
        const keyRes = await fetch("http://localhost:5000/generate-key", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com" })
        });

        if (!keyRes.ok) {
            console.error("Failed to generate key:", await keyRes.text());
            return;
        }

        const keyData = await keyRes.json();
        const apiKey = keyData.apiKey;
        console.log("API Key generated:", apiKey);

        console.log("Sending email...");
        const emailRes = await fetch("http://localhost:5000/send-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey
            },
            body: JSON.stringify({
                to: "saburinikam@gmail.com",
                subject: "Test Email from Support",
                message: "This is a test email sent to verify the fix."
            })
        });

        if (!emailRes.ok) {
            const errText = await emailRes.text();
            console.error("Failed to send email. Status:", emailRes.status);
            console.error("Response:", errText);
        } else {
            console.log("Email sent successfully!");
            const data = await emailRes.json();
            console.log(data);
        }

    } catch (err) {
        console.error("Error executing script:", err);
    }
}

runCallback();
