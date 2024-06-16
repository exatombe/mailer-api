import fastify from "fastify";
import dotenv from "dotenv";
import fastifyMultipart from "@fastify/multipart";
import { sendEmail } from "./mailer.js";

dotenv.config();

const server = fastify({
	logger: true,
});

server.register(fastifyMultipart, { attachFieldsToBody: true });

server.post("/send-email/:email", async (request, reply) => {
	const { body, params } = request;
	const emailData = {
		email: "",
		subject: "",
		_autoresponse: "",
		body: {},
		attachment: null,
	};

	for (const [key, field] of Object.entries(body)) {
		if (field.type === "file") {
			emailData.attachment = {
				filename: field.filename,
				content: field._buf,
			};
			continue;
		}

		if (Reflect.has(emailData, key)) {
			emailData[key] = field.value;
			continue;
		}

		if (!key.startsWith("_")) {
			emailData.body[key] = field.value;
		}
	}

	try {
		const mailResponse = await sendEmail(params.email, emailData);
		server.log.info(
			`Email sent: ${mailResponse.messageId} with ${mailResponse.response}`,
		);

		reply
			.header("access-control-allow-origin", "*")
			.status(200)
			.send({ message: "Email sent successfully", success: true });
	} catch (err) {
		server.log.error(err);
		reply
			.header("access-control-allow-origin", "*")
			.status(500)
			.send({ message: "Email could not be sent", success: false });
	}
});

server.listen(
	{
		port: 8080,
		host: "0.0.0.0",
	},
	(err, address) => {
		if (err) {
			server.log.error(err);
			process.exit(1);
		}
		server.log.info(`Server listening at ${address}`);
	},
);
