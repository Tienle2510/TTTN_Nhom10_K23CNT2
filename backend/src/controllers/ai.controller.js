const aiService = require("../services/ai.service");

async function analyzeEmail(req, res) {
    try {
        const {
            sender,
            subject,
            content
        } = req.body;

        if (!subject && !content) {
            return res.status(400).json({
                success: false,
                message: "Email không có nội dung để phân tích"
            });
        }

        const result =
            await aiService.analyzeEmail(
                sender || "",
                subject || "",
                content || ""
            );

        return res.json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "AI ANALYZE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    analyzeEmail
};