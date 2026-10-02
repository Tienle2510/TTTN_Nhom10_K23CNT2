const { pool } = require("../config/database");


// =====================================================
// TẠO EMAIL
// =====================================================

async function createEmail(
    userId,
    sender,
    subject,
    content
) {
    const [result] = await pool.execute(
        `
        INSERT INTO emails
        (
            user_id,
            sender,
            subject,
            content
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            userId,
            sender,
            subject,
            content
        ]
    );

    return result.insertId;
}


// =====================================================
// LẤY DANH SÁCH EMAIL
// =====================================================

async function findByUserId(userId) {

    const [rows] = await pool.execute(
        `
        SELECT
            e.id,
            e.user_id,
            e.sender,
            e.subject,
            e.content,
            e.status,
            e.is_important,
            e.gmail_message_id,
            e.created_at,

            c.name AS category_name,

            ec.confidence

        FROM emails e

        LEFT JOIN email_classifications ec
            ON e.id = ec.email_id

        LEFT JOIN categories c
            ON ec.category_id = c.id

        WHERE e.user_id = ?

        ORDER BY
            e.created_at DESC
        `,
        [userId]
    );

    return rows;
}


// =====================================================
// LẤY EMAIL THEO ID
// =====================================================

async function findById(
    emailId,
    userId
) {

    const [rows] = await pool.execute(
        `
        SELECT
            e.id,
            e.user_id,
            e.sender,
            e.subject,
            e.content,
            e.status,
            e.is_important,
            e.gmail_message_id,
            e.created_at,

            c.name AS category_name,

            ec.confidence,

            ec.classified_at

        FROM emails e

        LEFT JOIN email_classifications ec
            ON e.id = ec.email_id

        LEFT JOIN categories c
            ON ec.category_id = c.id

        WHERE
            e.id = ?
            AND e.user_id = ?

        LIMIT 1
        `,
        [
            emailId,
            userId
        ]
    );

    return rows[0] || null;
}


// =====================================================
// LẤY EMAIL THEO CATEGORY
// =====================================================

async function findByCategory(
    userId,
    category
) {

    const [rows] = await pool.execute(
        `
        SELECT
            e.id,
            e.user_id,
            e.sender,
            e.subject,
            e.content,
            e.status,
            e.is_important,
            e.gmail_message_id,
            e.created_at,

            c.name AS category_name,

            ec.confidence

        FROM emails e

        LEFT JOIN email_classifications ec
            ON e.id = ec.email_id

        LEFT JOIN categories c
            ON ec.category_id = c.id

        WHERE
            e.user_id = ?
            AND c.name = ?

        ORDER BY
            e.created_at DESC
        `,
        [
            userId,
            category
        ]
    );

    return rows;
}


// =====================================================
// CẬP NHẬT EMAIL
// =====================================================

async function updateEmail(
    emailId,
    userId,
    sender,
    subject,
    content,
    status
) {

    const [result] = await pool.execute(
        `
        UPDATE emails

        SET
            sender = ?,
            subject = ?,
            content = ?,
            status = ?

        WHERE
            id = ?
            AND user_id = ?
        `,
        [
            sender,
            subject,
            content,
            status,
            emailId,
            userId
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return await findById(
        emailId,
        userId
    );
}


// =====================================================
// CẬP NHẬT STATUS
// =====================================================

async function updateStatus(
    emailId,
    status
) {

    const [result] = await pool.execute(
        `
        UPDATE emails
        SET status = ?
        WHERE id = ?
        `,
        [
            status,
            emailId
        ]
    );

    return result.affectedRows;
}


// =====================================================
// XÓA EMAIL
// =====================================================

async function deleteEmail(
    emailId,
    userId
) {

    const [result] = await pool.execute(
        `
        DELETE FROM emails

        WHERE
            id = ?
            AND user_id = ?
        `,
        [
            emailId,
            userId
        ]
    );

    return result.affectedRows;
}


// =====================================================
// ĐÁNH DẤU QUAN TRỌNG
// =====================================================

async function updateImportant(
    emailId,
    userId,
    isImportant
) {

    const [result] = await pool.execute(
        `
        UPDATE emails

        SET
            is_important = ?

        WHERE
            id = ?
            AND user_id = ?
        `,
        [
            isImportant ? 1 : 0,
            emailId,
            userId
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return await findById(
        emailId,
        userId
    );
}


// =====================================================
// LẤY EMAIL QUAN TRỌNG
// =====================================================

async function findImportantEmails(
    userId
) {

    const [rows] = await pool.execute(
        `
        SELECT
            e.id,
            e.user_id,
            e.sender,
            e.subject,
            e.content,
            e.status,
            e.is_important,
            e.gmail_message_id,
            e.created_at,

            c.name AS category_name,

            ec.confidence

        FROM emails e

        LEFT JOIN email_classifications ec
            ON e.id = ec.email_id

        LEFT JOIN categories c
            ON ec.category_id = c.id

        WHERE
            e.user_id = ?
            AND e.is_important = 1

        ORDER BY
            e.created_at DESC
        `,
        [userId]
    );

    return rows;
}


// =====================================================
// THỐNG KÊ DASHBOARD
// =====================================================

async function getStatistics(
    userId
) {

    // -----------------------------
    // Tổng email
    // -----------------------------

    const [totalRows] =
        await pool.execute(
            `
            SELECT COUNT(*) AS total

            FROM emails

            WHERE user_id = ?
            `,
            [userId]
        );


    // -----------------------------
    // Email mới
    // -----------------------------

    const [newRows] =
        await pool.execute(
            `
            SELECT COUNT(*) AS total

            FROM emails

            WHERE
                user_id = ?
                AND status = 'new'
            `,
            [userId]
        );


    // -----------------------------
    // Email đã xử lý
    // -----------------------------

    const [processedRows] =
        await pool.execute(
            `
            SELECT COUNT(*) AS total

            FROM emails

            WHERE
                user_id = ?
                AND status = 'processed'
            `,
            [userId]
        );


    // -----------------------------
    // Email quan trọng
    // -----------------------------

    const [importantRows] =
        await pool.execute(
            `
            SELECT COUNT(*) AS total

            FROM emails

            WHERE
                user_id = ?
                AND is_important = 1
            `,
            [userId]
        );


    // -----------------------------
    // Thống kê category
    // -----------------------------

    const [categoryRows] =
        await pool.execute(
            `
            SELECT
                c.name AS category_name,
                COUNT(e.id) AS total

            FROM categories c

            LEFT JOIN email_classifications ec
                ON c.id = ec.category_id

            LEFT JOIN emails e
                ON ec.email_id = e.id
                AND e.user_id = ?

            GROUP BY
                c.id,
                c.name

            ORDER BY
                total DESC
            `,
            [userId]
        );


    // -----------------------------
    // Email gần đây
    // -----------------------------

    const [recentRows] =
        await pool.execute(
            `
            SELECT
                e.id,
                e.sender,
                e.subject,
                e.content,
                e.status,
                e.is_important,
                e.gmail_message_id,
                e.created_at,

                c.name AS category_name,

                ec.confidence

            FROM emails e

            LEFT JOIN email_classifications ec
                ON e.id = ec.email_id

            LEFT JOIN categories c
                ON ec.category_id = c.id

            WHERE e.user_id = ?

            ORDER BY
                e.created_at DESC

            LIMIT 10
            `,
            [userId]
        );


    return {

        total:
            Number(
                totalRows[0]?.total || 0
            ),

        new:
            Number(
                newRows[0]?.total || 0
            ),

        processed:
            Number(
                processedRows[0]?.total || 0
            ),

        important:
            Number(
                importantRows[0]?.total || 0
            ),

        categories:
            categoryRows.map(
                (item) => ({
                    category_name:
                        item.category_name,

                    total:
                        Number(
                            item.total || 0
                        )
                })
            ),

        recentEmails:
            recentRows
    };
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    createEmail,

    findByUserId,

    findById,

    findByCategory,

    updateEmail,

    updateStatus,

    deleteEmail,

    updateImportant,

    findImportantEmails,

    getStatistics

};