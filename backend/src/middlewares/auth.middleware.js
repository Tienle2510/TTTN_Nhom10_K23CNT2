const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    try {
        const authorization =
            req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                success: false,
                message: "Thiếu Authorization"
            });
        }

        if (!authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message:
                    "Authorization phải có dạng: Bearer <token>"
            });
        }

        const token =
            authorization.substring(7);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token không tồn tại"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn"
        });
    }
}

module.exports = authMiddleware;