const {
    pool
} = require("../config/database");


async function findCategoryByName(
    categoryName
) {

    const [
        rows
    ] = await pool.execute(
        `
        SELECT
            id,
            name,
            description
        FROM categories
        WHERE name = ?
        LIMIT 1
        `,
        [categoryName]
    );

    return rows[0] || null;
}


async function createClassification(
    emailId,
    categoryId,
    confidence
) {

    const [
        result
    ] = await pool.execute(
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

    return result.insertId;
}


async function updateClassification(
    emailId,
    categoryId,
    confidence
) {

    const [
        result
    ] = await pool.execute(
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

    return result.affectedRows;
}


async function deleteClassificationsByEmailId(
    emailId
) {

    const [
        result
    ] = await pool.execute(
        `
        DELETE FROM email_classifications
        WHERE email_id = ?
        `,
        [emailId]
    );

    return result.affectedRows;
}


module.exports = {

    findCategoryByName,

    createClassification,

    updateClassification,

    deleteClassificationsByEmailId
};