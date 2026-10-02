const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "email_ai",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();

        console.log("=================================");
        console.log("MySQL kết nối thành công!");
        console.log(`Database: ${process.env.DB_NAME}`);
        console.log("=================================");

        connection.release();

    } catch (error) {
        console.error("=================================");
        console.error("MySQL kết nối thất bại!");
        console.error("Lỗi:", error.message);
        console.error("=================================");
    }
}

module.exports = {
    pool,
    testConnection
};