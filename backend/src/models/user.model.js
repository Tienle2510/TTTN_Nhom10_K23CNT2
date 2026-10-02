const { pool } = require("../config/database");

async function findByEmail(email) {
    const [rows] = await pool.execute(
        `
        SELECT
            id,
            name,
            email,
            password,
            role,
            status,
            created_at
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [email]
    );

    return rows[0] || null;
}

async function findById(id) {
    const [rows] = await pool.execute(
        `
        SELECT
            id,
            name,
            email,
            role,
            status,
            created_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
}

async function createUser(name, email, password) {
    const [result] = await pool.execute(
        `
        INSERT INTO users
        (
            name,
            email,
            password,
            role,
            status
        )
        VALUES (?, ?, ?, 'user', 'active')
        `,
        [name, email, password]
    );

    return result.insertId;
}

async function saveRefreshToken(
    userId,
    tokenHash,
    expiresAt
) {
    const [result] = await pool.execute(
        `
        INSERT INTO refresh_tokens
        (
            user_id,
            token_hash,
            expires_at
        )
        VALUES (?, ?, ?)
        `,
        [
            userId,
            tokenHash,
            expiresAt
        ]
    );

    return result.insertId;
}

async function findRefreshToken(tokenHash) {
    const [rows] = await pool.execute(
        `
        SELECT *
        FROM refresh_tokens
        WHERE token_hash = ?
        AND expires_at > NOW()
        LIMIT 1
        `,
        [tokenHash]
    );

    return rows[0] || null;
}

async function deleteRefreshToken(tokenHash) {
    await pool.execute(
        `
        DELETE FROM refresh_tokens
        WHERE token_hash = ?
        `,
        [tokenHash]
    );
}

module.exports = {
    findByEmail,
    findById,
    createUser,
    saveRefreshToken,
    findRefreshToken,
    deleteRefreshToken
};