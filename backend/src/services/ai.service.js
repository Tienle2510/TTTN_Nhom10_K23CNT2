const http = require("http");


/* =========================================================
   JAVA AI CONFIG
========================================================= */

const AI_HOST =
    process.env.AI_HOST ||
    "localhost";

const AI_PORT =
    Number(process.env.AI_PORT) ||
    8080;


/* =========================================================
   REQUEST JAVA AI
========================================================= */

function requestAI(
    path,
    method,
    body = null,
    timeout = 10000
) {

    return new Promise(
        (resolve, reject) => {

            const data =
                body
                    ? JSON.stringify(body)
                    : null;


            const options = {
                hostname: AI_HOST,
                port: AI_PORT,
                path,
                method,
                headers: {}
            };


            if (data) {

                options.headers[
                    "Content-Type"
                ] =
                    "application/json; charset=UTF-8";


                options.headers[
                    "Content-Length"
                ] =
                    Buffer.byteLength(data);
            }


            const request =
                http.request(
                    options,
                    response => {

                        let responseBody = "";


                        response.setEncoding(
                            "utf8"
                        );


                        response.on(
                            "data",
                            chunk => {

                                responseBody +=
                                    chunk;
                            }
                        );


                        response.on(
                            "end",
                            () => {

                                if (
                                    !responseBody.trim()
                                ) {

                                    reject(
                                        new Error(
                                            "Java AI không trả về dữ liệu"
                                        )
                                    );

                                    return;
                                }


                                let result;


                                try {

                                    result =
                                        JSON.parse(
                                            responseBody
                                        );

                                } catch (error) {

                                    reject(
                                        new Error(
                                            "Java AI trả về dữ liệu JSON không hợp lệ"
                                        )
                                    );

                                    return;
                                }


                                if (
                                    response.statusCode < 200 ||
                                    response.statusCode >= 300
                                ) {

                                    reject(
                                        new Error(
                                            result?.message ||
                                            `Java AI HTTP ${response.statusCode}`
                                        )
                                    );

                                    return;
                                }


                                resolve(result);
                            }
                        );
                    }
                );


            request.on(
                "error",
                error => {

                    reject(
                        new Error(
                            `Không thể kết nối Java AI: ${error.message}`
                        )
                    );
                }
            );


            request.setTimeout(
                timeout,
                () => {

                    request.destroy();

                    reject(
                        new Error(
                            "Java AI phản hồi quá lâu"
                        )
                    );
                }
            );


            if (data) {

                request.write(data);
            }


            request.end();
        }
    );
}


/* =========================================================
   CLEAN EMAIL DATA
========================================================= */

function cleanEmailData(
    sender,
    subject,
    content
) {

    const emailData = {

        sender:
            String(sender || "").trim(),

        subject:
            String(subject || "").trim(),

        content:
            String(content || "").trim()
    };


    if (
        !emailData.sender &&
        !emailData.subject &&
        !emailData.content
    ) {

        throw new Error(
            "Nội dung email không được để trống"
        );
    }


    return emailData;
}


/* =========================================================
   ANALYZE EMAIL
   JAVA: /analyze
========================================================= */

async function analyzeEmail(
    sender,
    subject,
    content
) {

    const emailData =
        cleanEmailData(
            sender,
            subject,
            content
        );


    const result =
        await requestAI(
            "/analyze",
            "POST",
            emailData,
            15000
        );


    return normalizeAIResult(
        result
    );
}


/* =========================================================
   SUMMARIZE EMAIL
   JAVA: /summarize
========================================================= */

async function summarizeEmail(
    sender,
    subject,
    content
) {

    const emailData =
        cleanEmailData(
            sender,
            subject,
            content
        );


    const result =
        await requestAI(
            "/summarize",
            "POST",
            emailData,
            15000
        );


    return normalizeSummaryResult(
        result
    );
}


/* =========================================================
   PHÂN LOẠI + TÓM TẮT
========================================================= */

async function processEmail(
    sender,
    subject,
    content
) {

    const emailData =
        cleanEmailData(
            sender,
            subject,
            content
        );


    /*
       Gọi 2 chức năng AI.

       /analyze   → phân loại
       /summarize → tóm tắt
    */

    const [
        analysis,
        summary
    ] =
        await Promise.all([
            analyzeEmail(
                emailData.sender,
                emailData.subject,
                emailData.content
            ),

            summarizeEmail(
                emailData.sender,
                emailData.subject,
                emailData.content
            )
        ]);


    /*
       Gộp thành một kết quả AI
    */

    return {

        success:
            analysis.success &&
            summary.success,

        category:
            analysis.category,

        confidence:
            analysis.confidence,

        priority:
            analysis.priority,

        phishingRisk:
            analysis.phishingRisk,

        summary:
            summary.summary ||
            analysis.summary,

        keyPoints:
            summary.keyPoints,

        keywords:
            summary.keywords,

        reasons:
            analysis.reasons,

        scores:
            analysis.scores
    };
}


/* =========================================================
   CLASSIFY EMAIL
========================================================= */

async function classifyEmail(
    sender,
    subject,
    content
) {

    const result =
        await analyzeEmail(
            sender,
            subject,
            content
        );


    return {

        success:
            result.success,

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

        reasons:
            result.reasons,

        scores:
            result.scores
    };
}


/* =========================================================
   NORMALIZE ANALYSIS RESULT
========================================================= */

function normalizeAIResult(
    result
) {

    if (
        !result ||
        typeof result !== "object"
    ) {

        throw new Error(
            "Kết quả Java AI không hợp lệ"
        );
    }


    /* -----------------------------------------
       CONFIDENCE
    ----------------------------------------- */

    let confidence =
        Number(result.confidence);


    if (
        Number.isNaN(confidence)
    ) {

        confidence = 0.5;
    }


    if (confidence > 1) {

        confidence =
            confidence / 100;
    }


    confidence =
        Math.max(
            0,
            Math.min(
                1,
                confidence
            )
        );


    /* -----------------------------------------
       SUMMARY
    ----------------------------------------- */

    let summary =
        typeof result.summary === "string"
            ? result.summary.trim()
            : "";


    /* -----------------------------------------
       REASONS
    ----------------------------------------- */

    let reasons =
        Array.isArray(result.reasons)
            ? result.reasons
            : [];


    reasons =
        reasons
            .filter(
                item =>
                    typeof item === "string"
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    /* -----------------------------------------
       SCORES
    ----------------------------------------- */

    let scores =
        result.scores;


    if (
        !scores ||
        typeof scores !== "object" ||
        Array.isArray(scores)
    ) {

        scores = {};
    }


    /* -----------------------------------------
       PRIORITY
    ----------------------------------------- */

    const priorityValues = [
        "low",
        "medium",
        "high",
        "urgent"
    ];


    let priority =
        String(
            result.priority || "low"
        ).toLowerCase();


    if (
        !priorityValues.includes(priority)
    ) {

        priority = "low";
    }


    /* -----------------------------------------
       PHISHING RISK
    ----------------------------------------- */

    const phishingValues = [
        "safe",
        "low",
        "medium",
        "high",
        "danger",
        "dangerous",
        "suspicious"
    ];


    let phishingRisk =
        String(
            result.phishingRisk || "safe"
        ).toLowerCase();


    if (
        !phishingValues.includes(
            phishingRisk
        )
    ) {

        phishingRisk = "safe";
    }


    return {

        success:
            result.success !== false,

        category:
            result.category || "Khác",

        confidence,

        priority,

        phishingRisk,

        summary,

        reasons,

        scores
    };
}


/* =========================================================
   NORMALIZE SUMMARY RESULT
========================================================= */

function normalizeSummaryResult(
    result
) {

    if (
        !result ||
        typeof result !== "object"
    ) {

        throw new Error(
            "Kết quả tóm tắt Java AI không hợp lệ"
        );
    }


    /* -----------------------------------------
       SUMMARY
    ----------------------------------------- */

    const summary =
        typeof result.summary === "string"
            ? result.summary.trim()
            : "";


    /* -----------------------------------------
       KEY POINTS
    ----------------------------------------- */

    let keyPoints =
        Array.isArray(result.keyPoints)
            ? result.keyPoints
            : [];


    keyPoints =
        keyPoints
            .filter(
                item =>
                    typeof item === "string"
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    /* -----------------------------------------
       KEYWORDS
    ----------------------------------------- */

    let keywords =
        Array.isArray(result.keywords)
            ? result.keywords
            : [];


    keywords =
        keywords
            .filter(
                item =>
                    typeof item === "string"
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    return {

        success:
            result.success !== false,

        summary,

        keyPoints,

        keywords
    };
}


/* =========================================================
   EXTRACT MAIN CONTENT
========================================================= */

async function extractMainContent(
    sender,
    subject,
    content
) {

    const result =
        await summarizeEmail(
            sender,
            subject,
            content
        );


    return {

        success:
            result.success,

        summary:
            result.summary,

        mainPoints:
            result.keyPoints,

        keywords:
            result.keywords
    };
}


/* =========================================================
   HEALTH CHECK
========================================================= */

async function checkAIHealth() {

    try {

        const result =
            await requestAI(
                "/health",
                "GET",
                null,
                3000
            );


        return {

            status:
                result?.success
                    ? "online"
                    : "offline",

            message:
                result?.message ||
                "Java AI đang hoạt động"
        };

    } catch (error) {

        return {

            status: "offline",

            message:
                error.message
        };
    }
}


/* =========================================================
   TEST CONNECTION
========================================================= */

async function testAIConnection() {

    try {

        const result =
            await checkAIHealth();


        return (
            result.status ===
            "online"
        );

    } catch (error) {

        return false;
    }
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    requestAI,

    analyzeEmail,

    summarizeEmail,

    processEmail,

    classifyEmail,

    extractMainContent,

    normalizeAIResult,

    normalizeSummaryResult,

    checkAIHealth,

    testAIConnection
};