const emailService =
    require("../services/email.service");


// =====================================================
// 1. TẠO EMAIL
// =====================================================

async function createEmail(req, res) {
    try {

        const userId = req.user.id;

        const {
            sender,
            subject,
            content
        } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!sender || !subject || !content) {

            return res.status(400).json({
                success: false,
                message:
                    "sender, subject và content là bắt buộc"
            });
        }

        // Tạo email + AI phân loại + AI tóm tắt
        const email =
            await emailService.createEmail(
                userId,
                sender,
                subject,
                content
            );

        return res.status(201).json({
            success: true,
            message:
                "Tạo email và xử lý AI thành công",
            data: email
        });

    } catch (error) {

        console.error(
            "CREATE EMAIL ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =====================================================
// 2. LẤY DANH SÁCH EMAIL
// =====================================================

async function getEmails(req, res) {
    try {

        const userId = req.user.id;

        const emails =
            await emailService.getEmails(
                userId
            );

        return res.status(200).json({
            success: true,
            data: emails
        });

    } catch (error) {

        console.error(
            "GET EMAILS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =====================================================
// 3. LẤY EMAIL THEO ID
// =====================================================

async function getEmailById(req, res) {
    try {

        const userId = req.user.id;
        const emailId = Number(req.params.id);

        if (!emailId) {

            return res.status(400).json({
                success: false,
                message:
                    "ID email không hợp lệ"
            });
        }

        const email =
            await emailService.getEmailById(
                emailId,
                userId
            );

        if (!email) {

            return res.status(404).json({
                success: false,
                message:
                    "Email không tồn tại"
            });
        }

        return res.status(200).json({
            success: true,
            data: email
        });

    } catch (error) {

        console.error(
            "GET EMAIL BY ID ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =====================================================
// 4. XÓA EMAIL
// =====================================================

async function deleteEmail(req, res) {
    try {

        const userId = req.user.id;
        const emailId = Number(req.params.id);

        if (!emailId) {

            return res.status(400).json({
                success: false,
                message:
                    "ID email không hợp lệ"
            });
        }

        await emailService.deleteEmail(
            emailId,
            userId
        );

        return res.status(200).json({
            success: true,
            message:
                "Xóa email thành công"
        });

    } catch (error) {

        console.error(
            "DELETE EMAIL ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =====================================================
// 5. THỐNG KÊ EMAIL
// =====================================================

async function getStatistics(req, res) {
    try {

        const userId = req.user.id;

        const statistics =
            await emailService.getStatistics(
                userId
            );

        return res.status(200).json({
            success: true,
            data: statistics
        });

    } catch (error) {

        console.error(
            "GET STATISTICS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =====================================================
// 6. CẬP NHẬT EMAIL QUAN TRỌNG
// =====================================================

async function updateImportant(req, res) {
    try {

        const userId = req.user.id;
        const emailId = Number(req.params.id);

        const {
            isImportant
        } = req.body;

        if (!emailId) {

            return res.status(400).json({
                success: false,
                message:
                    "ID email không hợp lệ"
            });
        }

        const result =
            await emailService.updateImportant(
                emailId,
                userId,
                isImportant
            );

        return res.status(200).json({
            success: true,
            message:
                "Cập nhật trạng thái quan trọng thành công",
            data: result
        });

    } catch (error) {

        console.error(
            "UPDATE IMPORTANT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =====================================================
// 7. LẤY EMAIL QUAN TRỌNG
// =====================================================

async function getImportantEmails(req, res) {
    try {

        const userId = req.user.id;

        const emails =
            await emailService.getImportantEmails(
                userId
            );

        return res.status(200).json({
            success: true,
            data: emails
        });

    } catch (error) {

        console.error(
            "GET IMPORTANT EMAILS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =====================================================
// 8. PHÂN TÍCH LẠI 1 EMAIL BẰNG AI
// =====================================================

async function analyzeExistingEmail(req, res) {
    try {

        const userId = req.user.id;
        const emailId = Number(req.params.id);

        if (!emailId) {

            return res.status(400).json({
                success: false,
                message:
                    "ID email không hợp lệ"
            });
        }

        const result =
            await emailService.analyzeExistingEmail(
                emailId,
                userId
            );

        return res.status(200).json({
            success: true,
            message:
                "AI phân tích email thành công",
            data: result
        });

    } catch (error) {

        console.error(
            "ANALYZE EMAIL ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =====================================================
// 9. PHÂN TÍCH TOÀN BỘ EMAIL
// =====================================================

async function analyzeAllEmails(req, res) {
    try {

        const userId = req.user.id;

        const result =
            await emailService.analyzeAllEmails(
                userId
            );

        return res.status(200).json({
            success: true,
            message:
                "Đã phân tích toàn bộ email",
            data: result
        });

    } catch (error) {

        console.error(
            "ANALYZE ALL EMAILS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =====================================================
// 10. LẤY KẾT QUẢ PHÂN TÍCH AI
// =====================================================

async function getAIAnalysis(req, res) {
    try {

        const userId = req.user.id;
        const emailId = Number(req.params.id);

        if (!emailId) {

            return res.status(400).json({
                success: false,
                message:
                    "ID email không hợp lệ"
            });
        }

        const result =
            await emailService.getAIAnalysis(
                emailId,
                userId
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "GET AI ANALYSIS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    createEmail,

    getEmails,

    getEmailById,

    deleteEmail,

    getStatistics,

    updateImportant,

    getImportantEmails,

    analyzeExistingEmail,

    analyzeAllEmails,

    getAIAnalysis
};