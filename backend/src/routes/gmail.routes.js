const express = require("express");
const router = express.Router();

const authMiddleware =
    require("../middlewares/auth.middleware");

const gmailController =
    require("../controllers/gmail.controller");

// ===============================
// KẾT NỐI GMAIL
// ===============================

router.get(
    "/connect",
    authMiddleware,
    gmailController.connectGmail
);

router.get(
    "/callback",
    gmailController.callback
);

// ===============================
// TRẠNG THÁI GMAIL
// ===============================

router.get(
    "/status",
    authMiddleware,
    gmailController.status
);

// ===============================
// ĐỒNG BỘ GMAIL
// ===============================

router.post(
    "/sync",
    authMiddleware,
    gmailController.syncGmail
);

// ===============================
// GỬI EMAIL MỚI
// ===============================

router.post(
    "/send",
    authMiddleware,
    gmailController.sendGmail
);

// ===============================
// REPLY EMAIL
// POST /api/gmail/:id/reply
// ===============================

router.post(
    "/:id/reply",
    authMiddleware,
    gmailController.replyGmail
);

// ===============================
// FORWARD EMAIL
// POST /api/gmail/:id/forward
// ===============================

router.post(
    "/:id/forward",
    authMiddleware,
    gmailController.forwardGmail
);

module.exports = router;