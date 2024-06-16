import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

export async function verifyTransporter() {
	try {
		await transporter.verify();
		console.log("SMTP Server is ready to take our messages");
	} catch (error) {
		console.error("SMTP Server verification failed:", error);
	}
}

export async function sendEmail(to, data) {
	const mailOptions = {
		from: "contact@jeremysoler.com",
		to,
		subject: data.subject || "No Subject",
		html: generateHtml(data),
		attachments: data.attachment ? [data.attachment] : [],
		replyTo: data.email || "",
		encoding: "utf-8",
	};

	return transporter.sendMail(mailOptions);
}

function generateHtml(data) {
	return `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    .container h1 {
                        font-size: 24px;
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>${data.subject.toUpperCase()}</h1>
                    ${Object.entries(data.body)
											.map(
												([key, value]) => `
                                <h2><strong>${key.toUpperCase()}:</strong></h2>
                                <p style="margin: 0; white-space: pre-wrap">${value}</p>
                                <hr>
                            `,
											)
											.join("")}
                </div>
            </body>
        </html>
    `;
}

// Verify transporter on startup
verifyTransporter();