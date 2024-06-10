const nodemailer = require("nodemailer");
const fastify = require("fastify");
const dotenv  = require("dotenv");
dotenv.config();

const server = fastify({
    logger: true
});


const transporter = nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port:process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
})

transporter.verify().then(() => {
    server.log.info("SMTP Server is ready to take our messages");
}).catch((err) => {
    server.log.error(err);
});

server.register(require("@fastify/multipart"), { attachFieldsToBody: true});

server.post("/send-email/:email", async (req, reply) => {
    const { email } = req.params;
    const reqBody = req.body;
    let configurabLeDatas = {
        email: "",
        subject: "",
        _autoresponse: "",
        body: {},
    }
    for(const [key, field] of Object.entries(reqBody)) {
        // check if the value is a Buffer
        if(field.type === "file") {
            configurabLeDatas.attachment = {
                filename: field.filename,
                content: field._buf,
            }
            continue;
        }else if(configurabLeDatas.hasOwnProperty(key)) {
            configurabLeDatas[key] = field.value;
        }else {
            if(!key.startsWith("_")) {
                configurabLeDatas.body[key] = field.value;
            }
        }
    }
    console.log(configurabLeDatas);
    try {
       const mail =  await transporter.sendMail({
            from: "contact@jeremysoler.com",
            to: email,
            subject: configurabLeDatas.subject || "No Subject",
            html: htmlToSend(configurabLeDatas),
            attachments: configurabLeDatas.attachment ? [configurabLeDatas.attachment] : [],
            replyTo: configurabLeDatas.email || "",
            encoding: "utf-8"
        });
        server.log.info(`Email sent: ${mail.messageId} with ${mail.response}`);
        reply.header("access-control-allow-origin","*").status(200).send({message: "Email sent successfully", succes: true });
    } catch (err) {
        server.log.error(err);
        reply.header("access-control-allow-origin","*").status(500).send({ message: "Email could not be sent", success: false });
    }
});


server.listen({
    port: 8080,
    host: "0.0.0.0"
}, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
    server.log.info(`Server listening at ${address}`);
});

const htmlToSend = (data) => {
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
                ${Object.entries(data.body).map(([key,value]) => {
                    return `
                        <h2><strong>${key.toUpperCase()}: </strong></h2>
                            <h3 style=3D"margin: 0;white-space: pre-wrap">
                                ${value}
                            </h3>
                        <hr>
                    `
                }).join(" ")}
            </div>
        </body>
    </html>
    `;
}
