const gmailService =
    require("../services/gmail.service");


// =====================================================
// KẾT NỐI GMAIL
// =====================================================

async function connectGmail(
    req,
    res
) {

    try {

        const userId =
            req.user.id;


        const authorizationUrl =
            gmailService.getAuthorizationUrl(
                userId
            );


        res.json({

            success: true,

            authorizationUrl

        });

    } catch (error) {

        console.error(
            "CONNECT GMAIL ERROR:",
            error.message
        );


        res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

}


// =====================================================
// GOOGLE CALLBACK
// =====================================================

async function callback(
    req,
    res
) {

    try {

        const {
            code,
            state,
            error
        } = req.query;


        if (error) {

            return res.redirect(
                "http://localhost:5173/emails?gmail=denied"
            );

        }


        if (!code || !state) {

            return res
                .status(400)
                .send(
                    "Thiếu code hoặc state từ Google."
                );

        }


        await gmailService.handleCallback(
            code,
            state
        );


        return res.redirect(
            "http://localhost:5173/emails?gmail=connected"
        );

    } catch (error) {

        console.error(
            "GOOGLE CALLBACK ERROR:",
            error.message
        );


        return res.redirect(
            "http://localhost:5173/emails?gmail=error"
        );

    }

}


// =====================================================
// ĐỒNG BỘ GMAIL
// =====================================================

async function syncGmail(
    req,
    res
) {

    try {

        const userId =
            req.user.id;


        const result =
            await gmailService.syncEmails(
                userId
            );


        res.json({

            success: true,

            message:
                "Đồng bộ Gmail thành công.",

            data:
                result

        });

    } catch (error) {

        console.error(
            "SYNC GMAIL ERROR:",
            error.message
        );


        res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

}


// =====================================================
// GỬI EMAIL
// =====================================================

async function sendGmail(
    req,
    res
) {

    try {

        const userId =
            req.user.id;


        const {
            to,
            subject,
            content
        } = req.body;


        if (!to) {

            return res.status(400).json({

                success: false,

                message:
                    "Vui lòng nhập email người nhận."

            });

        }


        if (!subject) {

            return res.status(400).json({

                success: false,

                message:
                    "Vui lòng nhập tiêu đề."

            });

        }


        if (!content) {

            return res.status(400).json({

                success: false,

                message:
                    "Vui lòng nhập nội dung."

            });

        }


        const result =
            await gmailService.sendEmail(

                userId,

                to.trim(),

                subject.trim(),

                content.trim()

            );


        res.json({

            success: true,

            message:
                "Gửi email thành công.",

            data:
                result

        });

    } catch (error) {

        console.error(
            "SEND GMAIL ERROR:",
            error.message
        );


        res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

}


// =====================================================
// TRẢ LỜI EMAIL
// =====================================================

async function replyGmail(
    req,
    res
) {

    try {

        const userId =
            req.user.id;


        const emailId =
            Number(
                req.params.id
            );


        const {
            content
        } = req.body;


        if (
            !emailId ||
            Number.isNaN(emailId)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email ID không hợp lệ."

            });

        }


        if (
            !content ||
            !content.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Vui lòng nhập nội dung trả lời."

            });

        }


        const result =
            await gmailService.replyToEmail(

                userId,

                emailId,

                content.trim()

            );


        return res.json({

            success: true,

            message:
                "Đã trả lời email thành công.",

            data:
                result

        });

    } catch (error) {

        console.error(
            "REPLY GMAIL ERROR:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

}


// =====================================================
// CHUYỂN TIẾP EMAIL
// =====================================================

async function forwardGmail(
    req,
    res
) {

    try {

        const userId =
            req.user.id;


        const emailId =
            Number(
                req.params.id
            );


        const {
            to,
            content
        } = req.body;


        if (
            !emailId ||
            Number.isNaN(emailId)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email ID không hợp lệ."

            });

        }


        if (
            !to ||
            !to.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Vui lòng nhập email người nhận."

            });

        }


        if (
            !content ||
            !content.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Vui lòng nhập nội dung chuyển tiếp."

            });

        }


        const result =
            await gmailService.forwardEmail(

                userId,

                emailId,

                to.trim(),

                content.trim()

            );


        return res.json({

            success: true,

            message:
                "Đã chuyển tiếp email thành công.",

            data:
                result

        });

    } catch (error) {

        console.error(
            "FORWARD GMAIL ERROR:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

}


// =====================================================
// KIỂM TRA TRẠNG THÁI GMAIL
// =====================================================

async function status(
    req,
    res
) {

    try {

        const userId =
            req.user.id;


        const result =
            await gmailService
                .getConnectionStatus(
                    userId
                );


        res.json({

            success: true,

            data:
                result

        });

    } catch (error) {

        console.error(
            "GMAIL STATUS ERROR:",
            error.message
        );


        res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    connectGmail,

    callback,

    syncGmail,

    sendGmail,

    replyGmail,

    forwardGmail,

    status

};