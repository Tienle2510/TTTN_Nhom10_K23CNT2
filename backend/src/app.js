const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

/* =========================================================
   CONFIG
========================================================= */

const {
    testConnection,
    pool
} = require("./config/database");


/* =========================================================
   SERVICES
========================================================= */

const {
    checkAIHealth
} = require("./services/ai.service");


/* =========================================================
   ROUTES
========================================================= */

const authRoutes =
    require("./routes/auth.routes");

const emailRoutes =
    require("./routes/email.routes");

const gmailRoutes =
    require("./routes/gmail.routes");

const gmailFolderRoutes =
    require("./routes/gmail.folder.routes");


/* =========================================================
   APP
========================================================= */

const app = express();

const PORT =
    Number(process.env.PORT) || 3000;


/* =========================================================
   CORS
========================================================= */

app.use(
    cors({
        origin: true,
        credentials: true
    })
);


/* =========================================================
   BODY PARSER
========================================================= */

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);


/* =========================================================
   ROOT
========================================================= */

app.get(
    "/",
    (req, res) => {

        return res.json({

            success: true,

            message:
                "Hệ thống AI phân loại email đang hoạt động!",

            server:
                "Node.js + Express",

            database:
                "MySQL",

            ai:
                "Java AI",

            gmail:
                "Gmail API"

        });
    }
);


/* =========================================================
   API TEST
========================================================= */

app.get(
    "/api/test",
    (req, res) => {

        return res.json({

            success: true,

            message:
                "REST API hoạt động bình thường"

        });
    }
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    async (req, res) => {

        /* -----------------------------------------
           DATABASE
        ----------------------------------------- */

        let database = {

            status:
                "offline",

            message:
                "Không kết nối được MySQL"

        };


        try {

            const connection =
                await pool.getConnection();


            await connection.query(
                "SELECT 1"
            );


            connection.release();


            database = {

                status:
                    "online",

                message:
                    "MySQL đang hoạt động"

            };

        } catch (error) {

            console.error(
                "MYSQL HEALTH ERROR:",
                error.message
            );
        }


        /* -----------------------------------------
           JAVA AI
        ----------------------------------------- */

        let javaAI;


        try {

            javaAI =
                await checkAIHealth();

        } catch (error) {

            javaAI = {

                status:
                    "offline",

                message:
                    "Không kết nối được Java AI"

            };
        }


        /* -----------------------------------------
           BACKEND
        ----------------------------------------- */

        const backend = {

            status:
                "online",

            message:
                "Node.js Backend đang hoạt động"

        };


        /* -----------------------------------------
           SYSTEM STATUS
        ----------------------------------------- */

        const systemOnline =
            backend.status === "online" &&
            database.status === "online" &&
            javaAI.status === "online";


        return res
            .status(
                systemOnline
                    ? 200
                    : 503
            )
            .json({

                success:
                    systemOnline,

                system:
                    systemOnline
                        ? "online"
                        : "warning",

                services: {

                    backend,

                    database,

                    javaAI

                }

            });
    }
);


/* =========================================================
   AUTH ROUTES
========================================================= */

app.use(
    "/api/auth",
    authRoutes
);


/* =========================================================
   EMAIL ROUTES
========================================================= */

app.use(
    "/api/emails",
    emailRoutes
);


/* =========================================================
   GMAIL ROUTES
========================================================= */

app.use(
    "/api/gmail",
    gmailRoutes
);


/* =========================================================
   GMAIL FOLDER ROUTES
========================================================= */

app.use(
    "/api/gmail/folder",
    gmailFolderRoutes
);


/* =========================================================
   404
========================================================= */

app.use(
    (req, res) => {

        return res
            .status(404)
            .json({

                success: false,

                message:
                    "API không tồn tại",

                path:
                    req.originalUrl

            });
    }
);


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "SERVER ERROR:",
            err
        );


        if (
            res.headersSent
        ) {

            return next(err);

        }


        return res
            .status(500)
            .json({

                success: false,

                message:
                    "Lỗi máy chủ",

                error:
                    err.message

            });
    }
);


/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

    try {

        /* -----------------------------------------
           TEST MYSQL
        ----------------------------------------- */

        await testConnection();


        /* -----------------------------------------
           START EXPRESS
        ----------------------------------------- */

        app.listen(
            PORT,
            () => {

                console.log("");

                console.log(
                    "========================================"
                );

                console.log(
                    "          EMAIL AI BACKEND"
                );

                console.log(
                    "========================================"
                );

                console.log(
                    `Server : http://localhost:${PORT}`
                );

                console.log(
                    `Health : http://localhost:${PORT}/api/health`
                );

                console.log(
                    `Auth   : http://localhost:${PORT}/api/auth`
                );

                console.log(
                    `Email  : http://localhost:${PORT}/api/emails`
                );

                console.log(
                    `Gmail  : http://localhost:${PORT}/api/gmail`
                );

                console.log(
                    `Folder : http://localhost:${PORT}/api/gmail/folder`
                );

                console.log(
                    "========================================"
                );

                console.log(
                    "Backend đã sẵn sàng."
                );

                console.log("");

            }
        );

    } catch (error) {

        console.error("");

        console.error(
            "========================================"
        );

        console.error(
            "KHÔNG THỂ KHỞI ĐỘNG BACKEND"
        );

        console.error(
            "========================================"
        );

        console.error(
            error.message
        );

        console.error("");

        process.exit(1);
    }
}


/* =========================================================
   UNHANDLED REJECTION
========================================================= */

process.on(
    "unhandledRejection",
    (error) => {

        console.error(
            "UNHANDLED REJECTION:",
            error
        );

    }
);


/* =========================================================
   UNCAUGHT EXCEPTION
========================================================= */

process.on(
    "uncaughtException",
    (error) => {

        console.error(
            "UNCAUGHT EXCEPTION:",
            error
        );

    }
);


/* =========================================================
   START
========================================================= */

startServer();


/* =========================================================
   EXPORT
========================================================= */

module.exports = app;