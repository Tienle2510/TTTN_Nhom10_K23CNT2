const express = require("express");

const router =
    express.Router();

const authMiddleware =
    require("../middlewares/auth.middleware");

const aiController =
    require("../controllers/ai.controller");

router.use(authMiddleware);

router.post(
    "/analyze",
    aiController.analyzeEmail
);

module.exports = router;