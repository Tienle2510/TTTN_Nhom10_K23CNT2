const express = require("express");

const router =
    express.Router();

const authMiddleware =
    require("../middlewares/auth.middleware");

const gmailFolderService =
    require("../services/gmail.folder.service");

/* =========================================================
   LIST GMAIL FOLDER
========================================================= */

router.get(
    "/:folder",
    authMiddleware,
    async (req, res) => {

        try {

            const userId =
                req.user.id;

            const folder =
                req.params.folder;

            const maxResults =
                req.query.maxResults ||
                30;

            const result =
                await gmailFolderService.listFolder(
                    userId,
                    folder,
                    maxResults
                );

            return res.json({

                success: true,

                data: result

            });

        } catch (error) {

            console.error(
                "GMAIL FOLDER ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Không thể lấy thư mục Gmail."

            });
        }
    }
);

/* =========================================================
   GET GMAIL MESSAGE DETAIL
========================================================= */

router.get(
    "/message/:messageId",
    authMiddleware,
    async (req, res) => {

        try {

            const userId =
                req.user.id;

            const messageId =
                req.params.messageId;

            if (!messageId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Gmail message ID không hợp lệ."

                });
            }

            const result =
                await gmailFolderService.getMessageDetail(
                    userId,
                    messageId
                );

            return res.json({

                success: true,

                data: result

            });

        } catch (error) {

            console.error(
                "GMAIL MESSAGE DETAIL ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Không thể lấy chi tiết email Gmail."

            });
        }
    }
);

module.exports = router;