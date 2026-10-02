const { google } = require("googleapis");

const gmailModel =
    require("../models/gmail.model");

const { pool } =
    require("../config/database");

const aiService =
    require("./ai.service");


// =====================================================
// TẠO GOOGLE OAUTH CLIENT
// =====================================================

function createOAuthClient() {

    return new google.auth.OAuth2(

        process.env.GOOGLE_CLIENT_ID,

        process.env.GOOGLE_CLIENT_SECRET,

        process.env.GOOGLE_REDIRECT_URI

    );

}


// =====================================================
// TẠO URL KẾT NỐI GMAIL
// =====================================================

function getAuthorizationUrl(
    userId
) {

    const oauth2Client =
        createOAuthClient();

    const state =
        Buffer
            .from(
                String(userId)
            )
            .toString(
                "base64url"
            );

    return oauth2Client.generateAuthUrl({

        access_type:
            "offline",

        prompt:
            "consent",

        scope: [

            "https://www.googleapis.com/auth/gmail.readonly",

            "https://www.googleapis.com/auth/gmail.send"

        ],

        state

    });

}


// =====================================================
// XỬ LÝ GOOGLE CALLBACK
// =====================================================

async function handleCallback(
    code,
    state
) {

    if (!code) {

        throw new Error(
            "Google không trả về authorization code."
        );

    }


    if (!state) {

        throw new Error(
            "Thiếu state từ Google."
        );

    }


    const userId =
        Number(

            Buffer
                .from(
                    state,
                    "base64url"
                )
                .toString(
                    "utf8"
                )

        );


    if (!userId) {

        throw new Error(
            "User ID không hợp lệ."
        );

    }


    const oauth2Client =
        createOAuthClient();


    const { tokens } =
        await oauth2Client.getToken(
            code
        );


    if (!tokens.access_token) {

        throw new Error(
            "Google không trả về access token."
        );

    }


    oauth2Client.setCredentials(
        tokens
    );


    const gmail =
        google.gmail({

            version:
                "v1",

            auth:
                oauth2Client

        });


    const profile =
        await gmail.users.getProfile({

            userId:
                "me"

        });


    const gmailEmail =
        profile.data.emailAddress;


    /*
     * Google đôi khi không trả refresh_token
     * nếu tài khoản đã cấp quyền trước đó.
     * Khi đó lấy refresh token cũ.
     */

    const oldAccount =
        await gmailModel
            .findGmailAccountByUserId(
                userId
            );


    const refreshToken =
        tokens.refresh_token ||
        oldAccount?.refresh_token;


    if (!refreshToken) {

        throw new Error(
            "Không lấy được refresh token từ Google."
        );

    }


    await gmailModel.saveGmailAccount(

        userId,

        gmailEmail,

        tokens.access_token,

        refreshToken,

        tokens.expiry_date || null

    );


    return {

        userId,

        gmailEmail

    };

}


// =====================================================
// LẤY GOOGLE CLIENT ĐÃ XÁC THỰC
// =====================================================

async function getAuthenticatedClient(
    userId
) {

    const account =
        await gmailModel
            .findGmailAccountByUserId(
                userId
            );


    if (!account) {

        throw new Error(
            "Tài khoản chưa kết nối Gmail."
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

    });


    return oauth2Client;

}


// =====================================================
// DECODE BASE64URL
// =====================================================

function decodeBase64Url(
    data
) {

    if (!data) {

        return "";

    }


    try {

        const normalized =
            data

                .replace(
                    /-/g,
                    "+"
                )

                .replace(
                    /_/g,
                    "/"
                );


        const padded =
            normalized +
            "=".repeat(

                (
                    4 -
                    (
                        normalized.length %
                        4
                    )
                ) % 4

            );


        return Buffer
            .from(
                padded,
                "base64"
            )
            .toString(
                "utf8"
            );

    } catch (error) {

        console.error(
            "DECODE BASE64 ERROR:",
            error.message
        );

        return "";

    }

}


// =====================================================
// LẤY HEADER EMAIL
// =====================================================

function getHeader(
    headers,
    name
) {

    if (!Array.isArray(headers)) {

        return "";

    }


    const header =
        headers.find(

            item =>

                String(
                    item.name
                )
                    .toLowerCase() ===

                String(
                    name
                )
                    .toLowerCase()

        );


    return header
        ? header.value
        : "";

}


// =====================================================
// LÀM SẠCH HTML EMAIL
// =====================================================

function htmlToText(
    html
) {

    if (!html) {

        return "";

    }


    let text =
        html;


    // Xóa script

    text =
        text.replace(

            /<script\b[^>]*>[\s\S]*?<\/script>/gi,

            " "

        );


    // Xóa style

    text =
        text.replace(

            /<style\b[^>]*>[\s\S]*?<\/style>/gi,

            " "

        );


    // Xóa head

    text =
        text.replace(

            /<head\b[^>]*>[\s\S]*?<\/head>/gi,

            " "

        );


    // Chuyển các thẻ block thành xuống dòng

    text =
        text.replace(

            /<\/?(p|div|section|article|header|footer|br|tr|li|h1|h2|h3|h4|h5|h6)[^>]*>/gi,

            "\n"

        );


    // Xử lý br/hr

    text =
        text.replace(

            /<(br|hr)\s*\/?>/gi,

            "\n"

        );


    // Xóa toàn bộ HTML tag

    text =
        text.replace(

            /<[^>]+>/g,

            " "

        );


    // Decode HTML entities

    text =
        text

            .replace(
                /&nbsp;/gi,
                " "
            )

            .replace(
                /&amp;/gi,
                "&"
            )

            .replace(
                /&lt;/gi,
                "<"
            )

            .replace(
                /&gt;/gi,
                ">"
            )

            .replace(
                /&quot;/gi,
                '"'
            )

            .replace(
                /&#39;/gi,
                "'"
            )

            .replace(
                /&#x27;/gi,
                "'"
            )

            .replace(
                /&apos;/gi,
                "'"
            )

            .replace(
                /&ndash;/gi,
                "-"
            )

            .replace(
                /&mdash;/gi,
                "-"
            )

            .replace(
                /&hellip;/gi,
                "..."
            )

            .replace(
                /&copy;/gi,
                "(c)"
            )

            .replace(
                /&reg;/gi,
                "(R)"
            );


    // Xóa URL tracking dài

    text =
        text.replace(

            /https?:\/\/[^\s]+/gi,

            " "

        );


    // Xóa khoảng trắng thừa

    text =
        text.replace(

            /[ \t]+/g,

            " "

        );


    // Xóa khoảng trắng đầu/cuối dòng

    text =
        text.replace(

            /[ \t]*\n[ \t]*/g,

            "\n"

        );


    // Gom dòng trống

    text =
        text.replace(

            /\n{3,}/g,

            "\n\n"

        );


    return text.trim();

}


// =====================================================
// LẤY BODY EMAIL
// =====================================================

function extractBody(
    payload
) {

    if (!payload) {

        return "";

    }


    // =================================================
    // EMAIL CÓ BODY TRỰC TIẾP
    // =================================================

    if (

        payload.body &&
        payload.body.data

    ) {

        const decoded =
            decodeBase64Url(
                payload.body.data
            );


        if (
            payload.mimeType ===
            "text/html"
        ) {

            return htmlToText(
                decoded
            );

        }


        return decoded.trim();

    }


    // =================================================
    // MULTIPART
    // =================================================

    if (

        payload.parts &&
        Array.isArray(
            payload.parts
        )

    ) {


        // text/plain

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

                    const text =
                        decodeBase64Url(
                            part.body.data
                        );


                    if (
                        text.trim()
                    ) {

                        return text.trim();

                    }

                }

            }

        }


        // text/html

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

                    const html =
                        decodeBase64Url(
                            part.body.data
                        );


                    const text =
                        htmlToText(
                            html
                        );


                    if (
                        text.trim()
                    ) {

                        return text.trim();

                    }

                }

            }

        }


        // Multipart lồng nhau

        for (
            const part
            of payload.parts
        ) {

            if (

                part.parts &&
                Array.isArray(
                    part.parts
                )

            ) {

                const nested =
                    extractBody(
                        part
                    );


                if (nested) {

                    return nested;

                }

            }

        }

    }


    return "";

}


// =====================================================
// GIỚI HẠN NỘI DUNG GỬI CHO AI
// =====================================================

function prepareContentForAI(
    content
) {

    if (!content) {

        return "";

    }


    let text =
        String(content)
            .replace(
                /\r/g,
                ""
            )
            .trim();


    const MAX_LENGTH =
        12000;


    if (
        text.length >
        MAX_LENGTH
    ) {

        text =
            text.substring(
                0,
                MAX_LENGTH
            ) +
            "\n[Đã rút gọn nội dung email]";

    }


    return text;

}


// =====================================================
// GHI PROCESSING LOG
// =====================================================

async function createProcessingLog(
    emailId,
    action,
    description
) {

    try {

        await pool.execute(

            `
            INSERT INTO processing_logs
            (
                email_id,
                action,
                description
            )
            VALUES (?, ?, ?)
            `,

            [
                emailId,
                action,
                description
            ]

        );

    } catch (error) {

        console.error(
            "PROCESSING LOG ERROR:",
            error.message
        );

    }

}


// =====================================================
// LƯU KẾT QUẢ PHÂN LOẠI
// =====================================================

async function saveClassification(
    emailId,
    categoryName,
    confidence
) {

    const [categories] =
        await pool.execute(

            `
            SELECT
                id,
                name
            FROM categories
            WHERE name = ?
            LIMIT 1
            `,

            [
                categoryName
            ]

        );


    let categoryId;


    if (
        categories.length >
        0
    ) {

        categoryId =
            categories[0].id;

    } else {

        const [otherCategories] =
            await pool.execute(

                `
                SELECT
                    id
                FROM categories
                WHERE name = 'Khác'
                LIMIT 1
                `

            );


        if (
            otherCategories.length ===
            0
        ) {

            throw new Error(
                "Không tìm thấy category 'Khác'."
            );

        }


        categoryId =
            otherCategories[0].id;

    }


    const [existing] =
        await pool.execute(

            `
            SELECT
                id
            FROM email_classifications
            WHERE email_id = ?
            LIMIT 1
            `,

            [
                emailId
            ]

        );


    if (
        existing.length >
        0
    ) {

        await pool.execute(

            `
            UPDATE email_classifications
            SET
                category_id = ?,
                confidence = ?,
                classified_at = CURRENT_TIMESTAMP
            WHERE email_id = ?
            `,

            [
                categoryId,
                confidence,
                emailId
            ]

        );

    } else {

        await pool.execute(

            `
            INSERT INTO email_classifications
            (
                email_id,
                category_id,
                confidence
            )
            VALUES (?, ?, ?)
            `,

            [
                emailId,
                categoryId,
                confidence
            ]

        );

    }


    return categoryId;

}


// =====================================================
// IMPORT 1 EMAIL GMAIL VÀO DATABASE + AI
// =====================================================

async function importGmailEmail(
    userId,
    emailData
) {

    const {
        sender,
        subject,
        content,
        gmailMessageId
    } = emailData;


    const [existingRows] =
        await pool.execute(

            `
            SELECT
                e.id,
                c.name AS category_name,
                ec.confidence
            FROM emails e
            LEFT JOIN email_classifications ec
                ON e.id = ec.email_id
            LEFT JOIN categories c
                ON ec.category_id = c.id
            WHERE e.gmail_message_id = ?
            LIMIT 1
            `,

            [
                gmailMessageId
            ]

        );


    if (
        existingRows.length >
        0
    ) {

        const existing =
            existingRows[0];


        return {

            emailId:
                existing.id,

            category:
                existing.category_name ||
                null,

            confidence:
                Number(
                    existing.confidence ||
                    0
                ),

            duplicated:
                true

        };

    }


    const cleanContent =
        prepareContentForAI(
            content || ""
        );


    const [result] =
        await pool.execute(

            `
            INSERT INTO emails
            (
                user_id,
                sender,
                subject,
                content,
                status,
                gmail_message_id
            )
            VALUES (?, ?, ?, ?, 'new', ?)
            `,

            [
                userId,
                sender || "",
                subject ||
                    "(Không có tiêu đề)",
                cleanContent,
                gmailMessageId
            ]

        );


    const emailId =
        result.insertId;


    try {

        await createProcessingLog(

            emailId,

            "GMAIL_IMPORT",

            "Email được nhận từ Gmail thật."

        );


        await createProcessingLog(

            emailId,

            "AI_PROCESSING_START",

            "Bắt đầu phân loại và tóm tắt email bằng Java AI."

        );


        const aiResult =
            await aiService.processEmail(

                sender || "",

                subject || "",

                cleanContent || ""

            );


        if (!aiResult) {

            throw new Error(
                "Java AI không trả về kết quả."
            );

        }


        const category =
            aiResult.category ||
            "Khác";


        const confidence =
            Number(
                aiResult.confidence ||
                0
            );


        const priority =
            aiResult.priority ||
            "medium";


        const phishingRisk =
            aiResult.phishingRisk ||
            "safe";


        const summary =
            aiResult.summary ||
            "";


        const keyPoints =
            Array.isArray(
                aiResult.keyPoints
            )
                ? aiResult.keyPoints
                : [];


        const keywords =
            Array.isArray(
                aiResult.keywords
            )
                ? aiResult.keywords
                : [];


        const reasons =
            Array.isArray(
                aiResult.reasons
            )
                ? aiResult.reasons
                : [];


        const scores =
            aiResult.scores ||
            {};


        console.log(
            "========================================"
        );

        console.log(
            "GMAIL → JAVA AI"
        );

        console.log(
            "Email ID:",
            emailId
        );

        console.log(
            "Sender:",
            sender
        );

        console.log(
            "Subject:",
            subject
        );

        console.log(
            "Content length:",
            cleanContent.length
        );

        console.log(
            "Category:",
            category
        );

        console.log(
            "Confidence:",
            confidence
        );

        console.log(
            "Priority:",
            priority
        );

        console.log(
            "Phishing Risk:",
            phishingRisk
        );

        console.log(
            "Summary:",
            summary
        );

        console.log(
            "Key Points:",
            keyPoints
        );

        console.log(
            "Keywords:",
            keywords
        );

        console.log(
            "========================================"
        );


        const aiLog = {

            category,

            confidence,

            priority,

            phishingRisk,

            summary,

            keyPoints,

            keywords,

            reasons,

            scores

        };


        await createProcessingLog(

            emailId,

            "AI_ANALYSIS",

            JSON.stringify(
                aiLog
            )

        );


        await saveClassification(

            emailId,

            category,

            confidence

        );


        await pool.execute(

            `
            UPDATE emails
            SET status = 'processed'
            WHERE id = ?
            `,

            [
                emailId
            ]

        );


        await createProcessingLog(

            emailId,

            "PROCESSING_COMPLETED",

            `Hoàn tất AI: ${category} | confidence: ${confidence}`

        );


        return {

            emailId,

            category,

            confidence,

            priority,

            phishingRisk,

            summary,

            keyPoints,

            keywords,

            reasons,

            scores,

            duplicated:
                false

        };


    } catch (error) {

        console.error(
            "GMAIL AI ERROR:",
            error.message
        );


        await pool.execute(

            `
            UPDATE emails
            SET status = 'new'
            WHERE id = ?
            `,

            [
                emailId
            ]

        );


        await createProcessingLog(

            emailId,

            "AI_PROCESSING_ERROR",

            error.message

        );


        throw error;

    }

}


// =====================================================
// ĐỒNG BỘ EMAIL TỪ GMAIL
// =====================================================

async function syncEmails(
    userId
) {

    const oauth2Client =
        await getAuthenticatedClient(
            userId
        );


    const gmail =
        google.gmail({

            version:
                "v1",

            auth:
                oauth2Client

        });


    const response =
        await gmail.users.messages.list({

            userId:
                "me",

            labelIds: [
                "INBOX"
            ],

            maxResults:
                30

        });


    const messages =
        response.data.messages ||
        [];


    const importedEmails = [];


    for (
        const message
        of messages
    ) {

        try {

            const existing =
                await gmailModel
                    .findEmailByGmailMessageId(
                        message.id
                    );


            if (existing) {

                continue;

            }


            const messageResponse =
                await gmail.users.messages.get({

                    userId:
                        "me",

                    id:
                        message.id,

                    format:
                        "full"

                });


            const gmailMessage =
                messageResponse.data;


            const headers =
                gmailMessage
                    .payload
                    ?.headers ||
                [];


            const sender =
                getHeader(
                    headers,
                    "From"
                );


            const subject =
                getHeader(
                    headers,
                    "Subject"
                );


            const content =
                extractBody(
                    gmailMessage.payload
                );


            const result =
                await importGmailEmail(

                    userId,

                    {

                        sender,

                        subject:
                            subject ||
                            "(Không có tiêu đề)",

                        content,

                        gmailMessageId:
                            message.id

                    }

                );


            importedEmails.push({

                gmailMessageId:
                    message.id,

                sender,

                subject,

                content,

                category:
                    result.category,

                confidence:
                    result.confidence,

                priority:
                    result.priority,

                phishingRisk:
                    result.phishingRisk,

                summary:
                    result.summary,

                keyPoints:
                    result.keyPoints,

                keywords:
                    result.keywords,

                duplicated:
                    result.duplicated

            });


        } catch (error) {

            console.error(

                `Lỗi xử lý Gmail ${message.id}:`,

                error.message

            );

        }

    }


    return {

        total:
            messages.length,

        imported:
            importedEmails.length,

        emails:
            importedEmails

    };

}


// =====================================================
// GỬI EMAIL GMAIL
// =====================================================

async function sendEmail(
    userId,
    to,
    subject,
    content
) {

    if (!to) {

        throw new Error(
            "Email người nhận không được để trống."
        );

    }


    const oauth2Client =
        await getAuthenticatedClient(
            userId
        );


    const gmail =
        google.gmail({

            version:
                "v1",

            auth:
                oauth2Client

        });


    const message = [

        `To: ${to}`,

        `Subject: ${subject || ""}`,

        "Content-Type: text/plain; charset=UTF-8",

        "Content-Transfer-Encoding: 8bit",

        "",

        content || ""

    ].join(
        "\r\n"
    );


    const encodedMessage =
        Buffer
            .from(
                message,
                "utf8"
            )
            .toString(
                "base64url"
            );


    const response =
        await gmail.users.messages.send({

            userId:
                "me",

            requestBody: {

                raw:
                    encodedMessage

            }

        });


    return {

        success:
            true,

        messageId:
            response.data.id

    };

}


// =====================================================
// LẤY EMAIL LOCAL THEO ID + USER
// =====================================================

async function getLocalEmailForAction(
    userId,
    emailId
) {

    const [rows] =
        await pool.execute(

            `
            SELECT
                id,
                user_id,
                sender,
                subject,
                content,
                gmail_message_id
            FROM emails
            WHERE id = ?
              AND user_id = ?
            LIMIT 1
            `,

            [
                emailId,
                userId
            ]

        );


    if (!rows.length) {

        throw new Error(
            "Không tìm thấy email hoặc email không thuộc tài khoản hiện tại."
        );

    }


    const email =
        rows[0];


    if (!email.gmail_message_id) {

        throw new Error(
            "Email này chưa có Gmail Message ID. Hãy đồng bộ email từ Gmail trước."
        );

    }


    return email;

}


// =====================================================
// LẤY EMAIL GỐC TỪ GMAIL
// =====================================================

async function getOriginalGmailMessage(
    userId,
    gmailMessageId
) {

    const oauth2Client =
        await getAuthenticatedClient(
            userId
        );


    const gmail =
        google.gmail({

            version:
                "v1",

            auth:
                oauth2Client

        });


    const response =
        await gmail.users.messages.get({

            userId:
                "me",

            id:
                gmailMessageId,

            format:
                "full"

        });


    return {

        gmail,

        message:
            response.data

    };

}


// =====================================================
// LÀM SẠCH HEADER
// =====================================================

function cleanHeaderValue(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /[\r\n]+/g,
            " "
        )
        .trim();

}


// =====================================================
// TRẢ LỜI EMAIL
// =====================================================

async function replyToEmail(
    userId,
    emailId,
    content
) {

    if (
        !content ||
        !String(content).trim()
    ) {

        throw new Error(
            "Nội dung trả lời không được để trống."
        );

    }


    const localEmail =
        await getLocalEmailForAction(

            userId,

            emailId

        );


    const {
        gmail,
        message
    } =
        await getOriginalGmailMessage(

            userId,

            localEmail.gmail_message_id

        );


    const headers =
        message.payload?.headers ||
        [];


    const from =
        getHeader(
            headers,
            "From"
        );


    const replyTo =
        getHeader(
            headers,
            "Reply-To"
        );


    const originalSubject =
        getHeader(
            headers,
            "Subject"
        ) ||
        localEmail.subject ||
        "(Không có tiêu đề)";


    const messageIdHeader =
        getHeader(
            headers,
            "Message-ID"
        );


    const referencesHeader =
        getHeader(
            headers,
            "References"
        );


    const recipient =
        cleanHeaderValue(
            replyTo ||
            from
        );


    if (!recipient) {

        throw new Error(
            "Không xác định được người nhận để trả lời."
        );

    }


    let replySubject =
        originalSubject;


    if (
        !/^Re:/i.test(
            replySubject
        )
    ) {

        replySubject =
            `Re: ${replySubject}`;

    }


    replySubject =
        cleanHeaderValue(
            replySubject
        );


    const originalContent =
        extractBody(
            message.payload
        );


    const safeOriginalContent =
        originalContent ||
        localEmail.content ||
        "";


    const replyContent = [

        String(content).trim(),

        "",

        "----------------------------------------",

        `Vào ngày ${new Date().toLocaleString(
            "vi-VN"
        )}, ${from || "người gửi"} đã viết:`,

        "",

        safeOriginalContent.trim()

    ].join(
        "\r\n"
    );


    let references =
        referencesHeader
            ? referencesHeader.trim()
            : "";


    if (
        messageIdHeader &&
        !references.includes(
            messageIdHeader
        )
    ) {

        references =
            `${references} ${messageIdHeader}`
                .trim();

    }


    const mimeLines = [

        `To: ${recipient}`,

        `Subject: ${replySubject}`,

        "Content-Type: text/plain; charset=UTF-8",

        "Content-Transfer-Encoding: 8bit"

    ];


    if (messageIdHeader) {

        mimeLines.push(

            `In-Reply-To: ${cleanHeaderValue(
                messageIdHeader
            )}`

        );

    }


    if (references) {

        mimeLines.push(

            `References: ${cleanHeaderValue(
                references
            )}`

        );

    }


    mimeLines.push(

        "",

        replyContent

    );


    const rawMessage =
        Buffer
            .from(
                mimeLines.join(
                    "\r\n"
                ),
                "utf8"
            )
            .toString(
                "base64url"
            );


    const response =
        await gmail.users.messages.send({

            userId:
                "me",

            requestBody: {

                raw:
                    rawMessage,

                threadId:
                    message.threadId

            }

        });


    await createProcessingLog(

        emailId,

        "EMAIL_REPLY",

        `Đã trả lời email Gmail. Message ID: ${response.data.id}`

    );


    return {

        success:
            true,

        messageId:
            response.data.id,

        threadId:
            message.threadId,

        to:
            recipient,

        subject:
            replySubject

    };

}


// =====================================================
// CHUYỂN TIẾP EMAIL
// =====================================================

async function forwardEmail(
    userId,
    emailId,
    to,
    content
) {

    if (
        !to ||
        !String(to).trim()
    ) {

        throw new Error(
            "Vui lòng nhập email người nhận."
        );

    }


    if (
        !content ||
        !String(content).trim()
    ) {

        throw new Error(
            "Nội dung chuyển tiếp không được để trống."
        );

    }


    const localEmail =
        await getLocalEmailForAction(

            userId,

            emailId

        );


    const {
        gmail,
        message
    } =
        await getOriginalGmailMessage(

            userId,

            localEmail.gmail_message_id

        );


    const headers =
        message.payload?.headers ||
        [];


    const originalFrom =
        getHeader(
            headers,
            "From"
        );


    const originalTo =
        getHeader(
            headers,
            "To"
        );


    const originalDate =
        getHeader(
            headers,
            "Date"
        );


    const originalSubject =
        getHeader(
            headers,
            "Subject"
        ) ||
        localEmail.subject ||
        "(Không có tiêu đề)";


    let forwardSubject =
        originalSubject;


    if (
        !/^Fwd:/i.test(
            forwardSubject
        )
    ) {

        forwardSubject =
            `Fwd: ${forwardSubject}`;

    }


    forwardSubject =
        cleanHeaderValue(
            forwardSubject
        );


    const originalContent =
        extractBody(
            message.payload
        );


    const safeOriginalContent =
        originalContent ||
        localEmail.content ||
        "";


    const forwardContent = [

        String(content).trim(),

        "",

        "---------- Email được chuyển tiếp ----------",

        `Từ: ${originalFrom || "-"}`,

        `Ngày: ${originalDate || "-"}`,

        `Đến: ${originalTo || "-"}`,

        `Chủ đề: ${originalSubject}`,

        "",

        safeOriginalContent.trim(),

        "---------- Hết email ----------"

    ].join(
        "\r\n"
    );


    const recipients =
        String(to)

            .split(",")

            .map(
                item =>
                    cleanHeaderValue(
                        item
                    )
            )

            .filter(
                Boolean
            );


    if (
        !recipients.length
    ) {

        throw new Error(
            "Email người nhận không hợp lệ."
        );

    }


    const mimeLines = [

        `To: ${recipients.join(
            ", "
        )}`,

        `Subject: ${forwardSubject}`,

        "Content-Type: text/plain; charset=UTF-8",

        "Content-Transfer-Encoding: 8bit",

        "",

        forwardContent

    ];


    const rawMessage =
        Buffer
            .from(
                mimeLines.join(
                    "\r\n"
                ),
                "utf8"
            )
            .toString(
                "base64url"
            );


    const response =
        await gmail.users.messages.send({

            userId:
                "me",

            requestBody: {

                raw:
                    rawMessage

            }

        });


    await createProcessingLog(

        emailId,

        "EMAIL_FORWARD",

        `Đã chuyển tiếp email Gmail. Message ID: ${response.data.id}`

    );


    return {

        success:
            true,

        messageId:
            response.data.id,

        to:
            recipients,

        subject:
            forwardSubject

    };

}


// =====================================================
// KIỂM TRA KẾT NỐI GMAIL
// =====================================================

async function getConnectionStatus(
    userId
) {

    const account =
        await gmailModel
            .findGmailAccountByUserId(
                userId
            );


    if (!account) {

        return {

            connected:
                false,

            email:
                null

        };

    }


    return {

        connected:
            true,

        email:
            account.gmail_email

    };

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getAuthorizationUrl,

    handleCallback,

    syncEmails,

    sendEmail,

    replyToEmail,

    forwardEmail,

    getConnectionStatus,

    importGmailEmail

};