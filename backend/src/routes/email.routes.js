const express = require("express");

const router =
    express.Router();


const emailController =
    require("../controllers/email.controller");


const authMiddleware =
    require("../middlewares/auth.middleware");


/*
|--------------------------------------------------------------------------
| TẤT CẢ EMAIL API ĐỀU CẦN LOGIN
|--------------------------------------------------------------------------
*/

router.use(
    authMiddleware
);


/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
|
| GET /api/emails/stats
|
| Phải đặt trước /:id
| để "stats" không bị hiểu là ID.
|
*/

router.get(
    "/stats",
    emailController.getStatistics
);


/*
|--------------------------------------------------------------------------
| EMAIL QUAN TRỌNG
|--------------------------------------------------------------------------
|
| GET /api/emails/important
|
| Phải đặt trước /:id
| để "important" không bị hiểu là ID.
|
*/

router.get(
    "/important",
    emailController.getImportantEmails
);


/*
|--------------------------------------------------------------------------
| PHÂN TÍCH TOÀN BỘ EMAIL BẰNG AI
|--------------------------------------------------------------------------
|
| POST /api/emails/analyze-all
|
| AI sẽ:
| - Phân loại email
| - Tính confidence
| - Xác định priority
| - Kiểm tra phishingRisk
| - Tóm tắt nội dung
| - Trích xuất keyPoints
| - Trích xuất keywords
|
| Phải đặt trước /:id
| để "analyze-all" không bị hiểu là ID.
|
*/

router.post(
    "/analyze-all",
    emailController.analyzeAllEmails
);


/*
|--------------------------------------------------------------------------
| CREATE EMAIL
|--------------------------------------------------------------------------
|
| POST /api/emails
|
| Khi tạo email:
| - Lưu email vào MySQL
| - Gọi Java AI
| - Phân loại email
| - Tóm tắt email
| - Lưu kết quả AI vào processing_logs
|
*/

router.post(
    "/",
    emailController.createEmail
);


/*
|--------------------------------------------------------------------------
| GET TẤT CẢ EMAIL
|--------------------------------------------------------------------------
|
| GET /api/emails
|
*/

router.get(
    "/",
    emailController.getEmails
);


/*
|--------------------------------------------------------------------------
| PHÂN TÍCH LẠI 1 EMAIL BẰNG AI
|--------------------------------------------------------------------------
|
| POST /api/emails/:id/analyze
|
| Ví dụ:
|
| POST /api/emails/2/analyze
|
*/

router.post(
    "/:id/analyze",
    emailController.analyzeExistingEmail
);


/*
|--------------------------------------------------------------------------
| LẤY KẾT QUẢ PHÂN TÍCH AI
|--------------------------------------------------------------------------
|
| GET /api/emails/:id/ai-analysis
|
| Ví dụ:
|
| GET /api/emails/2/ai-analysis
|
*/

router.get(
    "/:id/ai-analysis",
    emailController.getAIAnalysis
);


/*
|--------------------------------------------------------------------------
| ĐÁNH DẤU / BỎ ĐÁNH DẤU EMAIL QUAN TRỌNG
|--------------------------------------------------------------------------
|
| PATCH /api/emails/:id/important
|
| Body:
|
| {
|     "isImportant": true
| }
|
| hoặc:
|
| {
|     "isImportant": false
| }
|
*/

router.patch(
    "/:id/important",
    emailController.updateImportant
);


/*
|--------------------------------------------------------------------------
| GET EMAIL BY ID
|--------------------------------------------------------------------------
|
| GET /api/emails/:id
|
*/

router.get(
    "/:id",
    emailController.getEmailById
);


/*
|--------------------------------------------------------------------------
| DELETE EMAIL
|--------------------------------------------------------------------------
|
| DELETE /api/emails/:id
|
*/

router.delete(
    "/:id",
    emailController.deleteEmail
);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;