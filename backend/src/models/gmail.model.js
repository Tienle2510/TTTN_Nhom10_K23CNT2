const { pool } = require("../config/database");


// =====================================================
// LƯU TÀI KHOẢN GMAIL
// =====================================================
async function saveGmailAccount(
    userId,
    gmailEmail,
    accessToken,
    refreshToken,
    expiryDate
) {

    const [result] = await pool.execute(
        `
        INSERT INTO gmail_accounts
        (
            user_id,
            gmail_email,
            access_token,
            refresh_token,
            expiry_date
        )
        VALUES (?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE
            gmail_email = VALUES(gmail_email),
            access_token = VALUES(access_token),
            refresh_token = VALUES(refresh_token),
            expiry_date = VALUES(expiry_date)
        `,
        [
            userId,
            gmailEmail,
            accessToken,
            refreshToken,
            expiryDate
        ]
    );

    return result;
}


// =====================================================
// LẤY TÀI KHOẢN GMAIL THEO USER
// =====================================================
async function findGmailAccountByUserId(userId) {

    const [rows] = await pool.execute(
        `
        SELECT
            id,
            user_id,
            gmail_email,
            access_token,
            refresh_token,
            expiry_date,
            created_at,
            updated_at
        FROM gmail_accounts
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    return rows[0] || null;
}


// =====================================================
// XÓA KẾT NỐI GMAIL
// =====================================================
async function deleteGmailAccount(userId) {

    const [result] = await pool.execute(
        `
        DELETE FROM gmail_accounts
        WHERE user_id = ?
        `,
        [userId]
    );

    return result.affectedRows;
}


// =====================================================
// KIỂM TRA EMAIL GMAIL ĐÃ IMPORT CHƯA
// =====================================================
async function findEmailByGmailMessageId(
    gmailMessageId
) {

    const [rows] = await pool.execute(
        `
        SELECT *
        FROM emails
        WHERE gmail_message_id = ?
        LIMIT 1
        `,
        [gmailMessageId]
    );

    return rows[0] || null;
}


// =====================================================
// EXPORT
// =====================================================
module.exports = {
    saveGmailAccount,
    findGmailAccountByUserId,
    deleteGmailAccount,
    findEmailByGmailMessageId
};