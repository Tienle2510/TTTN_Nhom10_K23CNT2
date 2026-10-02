const authService =
    require("../services/auth.service");

async function register(req, res) {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Vui lòng nhập đầy đủ họ tên, email và mật khẩu"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Mật khẩu phải có ít nhất 6 ký tự"
            });
        }

        const user =
            await authService.register(
                name.trim(),
                email.trim().toLowerCase(),
                password
            );

        return res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
            user
        });

    } catch (error) {
        console.error(
            "REGISTER ERROR:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function login(req, res) {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Vui lòng nhập email và mật khẩu"
            });
        }

        const result =
            await authService.login(
                email.trim().toLowerCase(),
                password
            );

        return res.json({
            success: true,
            message:
                "Đăng nhập thành công",
            ...result
        });

    } catch (error) {
        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
}

async function refresh(req, res) {
    try {
        const {
            refreshToken
        } = req.body;

        const result =
            await authService.refreshAccessToken(
                refreshToken
            );

        return res.json({
            success: true,
            message:
                "Làm mới token thành công",
            ...result
        });

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
}

async function logout(req, res) {
    try {
        const {
            refreshToken
        } = req.body;

        await authService.logout(
            refreshToken
        );

        return res.json({
            success: true,
            message:
                "Đăng xuất thành công"
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    register,
    login,
    refresh,
    logout
};