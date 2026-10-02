const emailModel =
    require("../models/email.model");

const classificationModel =
    require("../models/classification.model");

const aiService =
    require("./ai.service");

const {
    pool
} = require("../config/database");


/* =========================================================
   TẠO EMAIL + AI PHÂN LOẠI + AI TÓM TẮT
========================================================= */

async function createEmail(
    userId,
    sender,
    subject,
    content
) {

    const emailId =
        await emailModel.createEmail(
            userId,
            sender,
            subject,
            content
        );


    try {

        /*
           AI xử lý:

           /analyze
           +
           /summarize
        */

        const aiResult =
            await aiService.processEmail(
                sender,
                subject,
                content
            );


        /* -----------------------------------------
           TÌM CATEGORY
        ----------------------------------------- */

        const category =
            await classificationModel
                .findCategoryByName(
                    aiResult.category
                );


        if (!category) {

            throw new Error(
                `Không tìm thấy category: ${aiResult.category}`
            );
        }


        /* -----------------------------------------
           XÓA CLASSIFICATION CŨ
        ----------------------------------------- */

        await classificationModel
            .deleteClassificationsByEmailId(
                emailId
            );


        /* -----------------------------------------
           LƯU CLASSIFICATION
        ----------------------------------------- */

        await classificationModel
            .createClassification(
                emailId,
                category.id,
                aiResult.confidence
            );


        /* -----------------------------------------
           UPDATE STATUS
        ----------------------------------------- */

        await emailModel.updateStatus(
            emailId,
            "processed"
        );


        /* -----------------------------------------
           LƯU TOÀN BỘ AI RESULT
        ----------------------------------------- */

        await saveAILog(
            emailId,
            aiResult
        );


        /* -----------------------------------------
           LẤY EMAIL SAU KHI XỬ LÝ
        ----------------------------------------- */

        const email =
            await emailModel.findById(
                emailId,
                userId
            );


        return {

            ...email,

            ai_analysis:
                aiResult
        };

    } catch (error) {

        console.error(
            "AI PROCESSING ERROR:",
            error.message
        );


        throw new Error(
            `AI không thể xử lý email: ${error.message}`
        );
    }
}


/* =========================================================
   PHÂN TÍCH EMAIL ĐÃ CÓ
========================================================= */

async function analyzeExistingEmail(
    emailId,
    userId
) {

    const email =
        await emailModel.findById(
            emailId,
            userId
        );


    if (!email) {

        throw new Error(
            "Email không tồn tại"
        );
    }


    /*
       Gọi cả phân loại + tóm tắt
    */

    const aiResult =
        await aiService.processEmail(
            email.sender,
            email.subject,
            email.content
        );


    /* -----------------------------------------
       CATEGORY
    ----------------------------------------- */

    const category =
        await classificationModel
            .findCategoryByName(
                aiResult.category
            );


    if (!category) {

        throw new Error(
            `Không tìm thấy category: ${aiResult.category}`
        );
    }


    /* -----------------------------------------
       XÓA CLASSIFICATION CŨ
    ----------------------------------------- */

    await classificationModel
        .deleteClassificationsByEmailId(
            emailId
        );


    /* -----------------------------------------
       LƯU CLASSIFICATION MỚI
    ----------------------------------------- */

    await classificationModel
        .createClassification(
            emailId,
            category.id,
            aiResult.confidence
        );


    /* -----------------------------------------
       UPDATE STATUS
    ----------------------------------------- */

    await emailModel.updateStatus(
        emailId,
        "processed"
    );


    /* -----------------------------------------
       LƯU AI LOG
    ----------------------------------------- */

    await saveAILog(
        emailId,
        aiResult
    );


    /* -----------------------------------------
       LẤY EMAIL
    ----------------------------------------- */

    const updated =
        await emailModel.findById(
            emailId,
            userId
        );


    return {

        email:
            updated,

        ai_analysis:
            aiResult
    };
}


/* =========================================================
   PHÂN TÍCH TẤT CẢ EMAIL
========================================================= */

async function analyzeAllEmails(
    userId
) {

    const emails =
        await emailModel.findByUserId(
            userId
        );


    let processed = 0;

    let failed = 0;

    const results = [];


    for (
        const email of emails
    ) {

        try {

            const result =
                await analyzeExistingEmail(
                    email.id,
                    userId
                );


            processed++;


            results.push({

                id:
                    email.id,

                success:
                    true,

                category:
                    result.ai_analysis.category,

                confidence:
                    result.ai_analysis.confidence,

                summary:
                    result.ai_analysis.summary,

                keyPoints:
                    result.ai_analysis.keyPoints,

                keywords:
                    result.ai_analysis.keywords
            });

        } catch (error) {

            failed++;


            results.push({

                id:
                    email.id,

                success:
                    false,

                error:
                    error.message
            });
        }
    }


    return {

        total:
            emails.length,

        processed,

        failed,

        results
    };
}


/* =========================================================
   LẤY AI ANALYSIS
========================================================= */

async function getAIAnalysis(
    emailId,
    userId
) {

    const email =
        await emailModel.findById(
            emailId,
            userId
        );


    if (!email) {

        throw new Error(
            "Email không tồn tại"
        );
    }


    const [rows] =
        await pool.execute(
            `
            SELECT
                description,
                created_at
            FROM processing_logs
            WHERE email_id = ?
            AND action = 'AI_ANALYSIS'
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [emailId]
        );


    let analysis = null;


    if (
        rows.length &&
        rows[0].description
    ) {

        try {

            analysis =
                JSON.parse(
                    rows[0].description
                );

        } catch (error) {

            analysis = null;
        }
    }


    return {

        email,

        analysis
    };
}


/* =========================================================
   LƯU AI LOG
========================================================= */

async function saveAILog(
    emailId,
    aiResult
) {

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

            "AI_ANALYSIS",

            JSON.stringify(
                aiResult
            )
        ]
    );
}


/* =========================================================
   LẤY EMAIL
========================================================= */

async function getEmails(
    userId
) {

    return await emailModel.findByUserId(
        userId
    );
}


/* =========================================================
   LẤY EMAIL THEO ID
========================================================= */

async function getEmailById(
    emailId,
    userId
) {

    return await emailModel.findById(
        emailId,
        userId
    );
}


/* =========================================================
   LẤY EMAIL THEO CATEGORY
========================================================= */

async function getEmailsByCategory(
    userId,
    category
) {

    return await emailModel.findByCategory(
        userId,
        category
    );
}


/* =========================================================
   UPDATE EMAIL
========================================================= */

async function updateEmail(
    emailId,
    userId,
    sender,
    subject,
    content,
    status
) {

    return await emailModel.updateEmail(
        emailId,
        userId,
        sender,
        subject,
        content,
        status
    );
}


/* =========================================================
   DELETE EMAIL
========================================================= */

async function deleteEmail(
    emailId,
    userId
) {

    const affectedRows =
        await emailModel.deleteEmail(
            emailId,
            userId
        );


    if (
        affectedRows === 0
    ) {

        throw new Error(
            "Email không tồn tại"
        );
    }


    return true;
}


/* =========================================================
   STATISTICS
========================================================= */

async function getStatistics(
    userId
) {

    return await emailModel.getStatistics(
        userId
    );
}


/* =========================================================
   UPDATE IMPORTANT
========================================================= */

async function updateImportant(
    emailId,
    userId,
    isImportant
) {

    return await emailModel.updateImportant(
        emailId,
        userId,
        isImportant
    );
}


/* =========================================================
   IMPORTANT EMAILS
========================================================= */

async function getImportantEmails(
    userId
) {

    return await emailModel.findImportantEmails(
        userId
    );
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    createEmail,

    analyzeExistingEmail,

    analyzeAllEmails,

    getAIAnalysis,

    getEmails,

    getEmailById,

    getEmailsByCategory,

    updateEmail,

    deleteEmail,

    getStatistics,

    updateImportant,

    getImportantEmails
};