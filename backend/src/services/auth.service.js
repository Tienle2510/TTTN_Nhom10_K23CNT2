const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userModel = require("../models/user.model");

async function register(name, email, password) {
    const existingUser =
        await userModel.findByEmail(email);

    if (existingUser) {
        throw new Error("Email đã được sử dụng");
    }

    const hashedPassword =
        await bcrypt.hash(password, 10);

    const userId =
        await userModel.createUser(
            name,
            email,
            hashedPassword
        );

    return {
        id: userId,
        name,
        email,
        role: "user",
        status: "active"
    };
}

async function login(email, password) {
    const user =
        await userModel.findByEmail(email);

    if (!user) {
        throw new Error(
            "Email hoặc mật khẩu không đúng"
        );
    }

    if (user.status === "blocked") {
        throw new Error(
            "Tài khoản đã bị khóa"
        );
    }

    const passwordMatch =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!passwordMatch) {
        throw new Error(
            "Email hoặc mật khẩu không đúng"
        );
    }

    const secretToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    );

    const refreshToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            type: "refresh"
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: "7d"
        }
    );

    const tokenHash =
        crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

    const expiresAt = new Date(
        Date.now() +
        7 * 24 * 60 * 60 * 1000
    );

    await userModel.saveRefreshToken(
        user.id,
        tokenHash,
        expiresAt
    );

    return {
        secretToken,
        refreshToken,

        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        }
    };
}

async function refreshAccessToken(refreshToken) {
    if (!refreshToken) {
        throw new Error(
            "Refresh token không tồn tại"
        );
    }

    let decoded;

    try {
        decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );
    } catch (error) {
        throw new Error(
            "Refresh token không hợp lệ hoặc đã hết hạn"
        );
    }

    if (decoded.type !== "refresh") {
        throw new Error(
            "Token không phải refresh token"
        );
    }

    const tokenHash =
        crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

    const savedToken =
        await userModel.findRefreshToken(
            tokenHash
        );

    if (!savedToken) {
        throw new Error(
            "Refresh token không tồn tại hoặc đã hết hạn"
        );
    }

    const user =
        await userModel.findById(decoded.id);

    if (!user) {
        throw new Error(
            "Người dùng không tồn tại"
        );
    }

    if (user.status === "blocked") {
        throw new Error(
            "Tài khoản đã bị khóa"
        );
    }

    const secretToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    );

    return {
        secretToken,

        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        }
    };
}

async function logout(refreshToken) {
    if (!refreshToken) {
        return;
    }

    const tokenHash =
        crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

    await userModel.deleteRefreshToken(
        tokenHash
    );
}

module.exports = {
    register,
    login,
    refreshAccessToken,
    logout
};