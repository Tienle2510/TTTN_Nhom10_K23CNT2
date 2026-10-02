const { google } = require("googleapis");
const gmailModel = require("../models/gmail.model");

/* =========================================================
   GOOGLE OAUTH CLIENT
========================================================= */

function createOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}


/* =========================================================
   AUTHENTICATED CLIENT
========================================================= */

async function getAuthenticatedClient(userId) {

    const account =
        await gmailModel.findGmailAccountByUserId(userId);

    if (!account) {
        throw new Error(
            "Tài khoản chưa kết nối Gmail."
        );
    }

    if (!account.refresh_token) {
        throw new Error(
            "Tài khoản Gmail chưa có refresh token. Hãy kết nối Gmail lại."
        );
    }

    const oauth2Client =
        createOAuthClient();

    oauth2Client.setCredentials({
        access_token:
            account.access_token,

        refresh_token:
            account.refresh_token,

        expiry_date:
            account.expiry_date
                ? new Date(
                    account.expiry_date
                ).getTime()
                : undefined
    });

    oauth2Client.on(
        "tokens",
        async (tokens) => {

            try {

                const accessToken =
                    tokens.access_token ||
                    account.access_token;

                const refreshToken =
                    tokens.refresh_token ||
                    account.refresh_token;

                const expiryDate =
                    tokens.expiry_date ||
                    account.expiry_date;

                await gmailModel.saveGmailAccount(
                    userId,
                    account.gmail_email,
                    accessToken,
                    refreshToken,
                    expiryDate
                );

            } catch (error) {

                console.error(
                    "Lỗi lưu Gmail token:",
                    error.message
                );

            }
        }
    );

    return oauth2Client;
}


/* =========================================================
   HEADER
========================================================= */

function getHeader(headers, name) {

    if (!Array.isArray(headers)) {
        return "";
    }

    const header =
        headers.find(
            item =>
                String(item.name).toLowerCase() ===
                String(name).toLowerCase()
        );

    return header
        ? header.value
        : "";
}


/* =========================================================
   BASE64URL
========================================================= */

function decodeBase64Url(data) {

    if (!data) {
        return "";
    }

    const normalized =
        data
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    return Buffer
        .from(normalized, "base64")
        .toString("utf8");
}


/* =========================================================
   EXTRACT BODY
========================================================= */

function extractBody(payload) {

    if (!payload) {
        return "";
    }

    if (
        payload.body &&
        payload.body.data
    ) {
        return decodeBase64Url(
            payload.body.data
        );
    }

    if (
        payload.parts &&
        Array.isArray(payload.parts)
    ) {

        // TEXT
        for (
            const part
            of payload.parts
        ) {

            if (
                part.mimeType ===
                "text/plain"
            ) {

                if (
                    part.body &&
                    part.body.data
                ) {

                    return decodeBase64Url(
                        part.body.data
                    );

                }
            }
        }

        // HTML
        for (
            const part
            of payload.parts
        ) {

            if (
                part.mimeType ===
                "text/html"
            ) {

                if (
                    part.body &&
                    part.body.data
                ) {

                    return decodeBase64Url(
                        part.body.data
                    );

                }
            }
        }

        // Recursive
        for (
            const part
            of payload.parts
        ) {

            const result =
                extractBody(part);

            if (result) {
                return result;
            }
        }
    }

    return "";
}


/* =========================================================
   CLEAN CONTENT
========================================================= */

function cleanContent(content) {

    if (!content) {
        return "";
    }

    return String(content)
        .replace(
            /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
            ""
        )
        .replace(
            /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
            ""
        )
        .replace(
            /<[^>]+>/g,
            ""
        )
        .trim();
}


/* =========================================================
   NORMALIZE MESSAGE
========================================================= */

function normalizeMessage(message) {

    const headers =
        message.payload?.headers || [];

    const from =
        getHeader(headers, "From");

    const to =
        getHeader(headers, "To");

    const cc =
        getHeader(headers, "Cc");

    const subject =
        getHeader(headers, "Subject");

    const date =
        getHeader(headers, "Date");

    const replyTo =
        getHeader(headers, "Reply-To");

    const content =
        cleanContent(
            extractBody(
                message.payload
            )
        );

    return {

        id:
            message.id,

        gmailMessageId:
            message.id,

        threadId:
            message.threadId,

        sender:
            from,

        recipient:
            to,

        cc:
            cc,

        replyTo:
            replyTo,

        subject:
            subject ||
            "(Không có tiêu đề)",

        content:
            content,

        date:
            date || null,

        internalDate:
            message.internalDate ||
            null,

        labelIds:
            message.labelIds ||
            [],

        snippet:
            message.snippet ||
            ""
    };
}


/* =========================================================
   GET ONE GMAIL MESSAGE
========================================================= */

async function getMessage(
    userId,
    messageId
) {

    const oauth2Client =
        await getAuthenticatedClient(
            userId
        );

    const gmail =
        google.gmail({
            version: "v1",
            auth: oauth2Client
        });

    const response =
        await gmail.users.messages.get({
            userId: "me",
            id: messageId,
            format: "full"
        });

    return normalizeMessage(
        response.data
    );
}


/* =========================================================
   LIST GMAIL FOLDER
========================================================= */

async function listFolder(
    userId,
    folder,
    maxResults = 30
) {

    const oauth2Client =
        await getAuthenticatedClient(
            userId
        );

    const gmail =
        google.gmail({
            version: "v1",
            auth: oauth2Client
        });

    const folderMap = {

        sent:
            "SENT",

        draft:
            "DRAFT",

        drafts:
            "DRAFT",

        trash:
            "TRASH"
    };

    const labelId =
        folderMap[
            String(folder).toLowerCase()
        ];

    if (!labelId) {

        throw new Error(
            "Folder Gmail không hợp lệ."
        );
    }

    const response =
        await gmail.users.messages.list({

            userId: "me",

            labelIds: [
                labelId
            ],

            maxResults:
                Math.min(
                    Number(maxResults) || 30,
                    50
                )
        });

    const messages =
        response.data.messages || [];

    const emails = [];

    for (
        const message
        of messages
    ) {

        try {

            const detail =
                await gmail.users.messages.get({

                    userId: "me",

                    id:
                        message.id,

                    format:
                        "full"
                });

            const normalized =
                normalizeMessage(
                    detail.data
                );

            emails.push({
                ...normalized,
                folder: labelId
            });

        } catch (error) {

            console.error(
                `Lỗi đọc Gmail ${message.id}:`,
                error.message
            );

        }
    }

    return {

        folder:
            labelId,

        total:
            emails.length,

        emails
    };
}


module.exports = {

    listFolder,

    getMessage
};