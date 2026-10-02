import { useEffect, useState } from "react";
import {
    useNavigate,
    useSearchParams
} from "react-router-dom";

import api from "../services/api";
import "./CreateEmail.css";

function CreateEmail() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    const replyTo =
        searchParams.get("replyTo") || "";

    const replySubject =
        searchParams.get("replySubject") ||
        searchParams.get("subject") ||
        "";

    const forwardSubject =
        searchParams.get("forwardSubject") || "";

    const forwardContent =
        searchParams.get("forwardContent") || "";

    const mode =
        replyTo
            ? "reply"
            : forwardSubject
                ? "forward"
                : "compose";

    const [form, setForm] = useState({
        to: "",
        subject: "",
        content: ""
    });

    const [sending, setSending] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    /* =====================================================
       KHỞI TẠO FORM
    ===================================================== */

    useEffect(() => {
        if (mode === "reply") {
            setForm({
                to: replyTo,
                subject: replySubject,
                content: ""
            });

            return;
        }

        if (mode === "forward") {
            setForm({
                to: "",
                subject: forwardSubject,
                content:
                    "\n\n" +
                    "---------- Email được chuyển tiếp ----------\n\n" +
                    decodeURIComponentSafe(forwardContent)
            });

            return;
        }

        setForm({
            to: "",
            subject: "",
            content: ""
        });

    }, [
        mode,
        replyTo,
        replySubject,
        forwardSubject,
        forwardContent
    ]);


    /* =====================================================
       XỬ LÝ INPUT
    ===================================================== */

    const handleChange = (event) => {
        const {
            name,
            value
        } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));

        setError("");
        setMessage("");
    };


    /* =====================================================
       GỬI EMAIL
    ===================================================== */

    const handleSend = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const to =
            form.to.trim();

        const subject =
            form.subject.trim();

        const content =
            form.content.trim();

        if (!to) {
            setError(
                "Vui lòng nhập email người nhận."
            );

            return;
        }

        if (!isValidEmail(to)) {
            setError(
                "Địa chỉ email người nhận không hợp lệ."
            );

            return;
        }

        if (!content) {
            setError(
                "Nội dung email không được để trống."
            );

            return;
        }

        setSending(true);

        try {
            const response =
                await api.post(
                    "/gmail/send",
                    {
                        to,
                        subject,
                        content
                    }
                );

            if (
                response.data &&
                response.data.success
            ) {
                setMessage(
                    "Đã gửi email thành công đến " +
                    to
                );

                setForm({
                    to: "",
                    subject: "",
                    content: ""
                });

                setTimeout(() => {
                    navigate("/emails");
                }, 1200);

            } else {
                setError(
                    response.data?.message ||
                    "Không thể gửi email."
                );
            }

        } catch (error) {
            console.error(
                "SEND GMAIL ERROR:",
                error
            );

            setError(
                error.response?.data?.message ||
                error.message ||
                "Không thể gửi email."
            );

        } finally {
            setSending(false);
        }
    };


    /* =====================================================
       TIÊU ĐỀ GIAO DIỆN
    ===================================================== */

    const getTitle = () => {
        if (mode === "reply") {
            return "Trả lời email";
        }

        if (mode === "forward") {
            return "Chuyển tiếp email";
        }

        return "Soạn thư";
    };

    const getSubtitle = () => {
        if (mode === "reply") {
            return "Trả lời email qua Gmail";
        }

        if (mode === "forward") {
            return "Chuyển tiếp email qua Gmail";
        }

        return "Gửi email qua Gmail";
    };

    const getButtonText = () => {
        if (sending) {
            return "Đang gửi...";
        }

        if (mode === "reply") {
            return "↩️ Gửi trả lời";
        }

        if (mode === "forward") {
            return "↗️ Gửi chuyển tiếp";
        }

        return "✈️ Gửi thư";
    };


    return (
        <div className="compose-page">

            {/* =================================================
               TOP BAR
            ================================================= */}

            <header className="compose-topbar">

                <div className="compose-top-left">

                    <button
                        type="button"
                        className="compose-back"
                        onClick={() =>
                            navigate("/emails")
                        }
                        title="Quay lại hộp thư"
                    >
                        ←
                    </button>


                    <div className="compose-title">

                        <span className="compose-title-icon">
                            {mode === "reply"
                                ? "↩️"
                                : mode === "forward"
                                    ? "↗️"
                                    : "✉️"}
                        </span>


                        <div>

                            <strong>
                                {getTitle()}
                            </strong>

                            <small>
                                {getSubtitle()}
                            </small>

                        </div>

                    </div>

                </div>


                <button
                    type="button"
                    className="compose-inbox-button"
                    onClick={() =>
                        navigate("/emails")
                    }
                >
                    📥 Hộp thư
                </button>

            </header>


            {/* =================================================
               MAIN
            ================================================= */}

            <main className="compose-main">

                <div className="compose-card">


                    {/* =================================================
                       HEADER
                    ================================================= */}

                    <div className="compose-card-header">

                        <div>

                            <span>
                                {mode === "reply"
                                    ? "TRẢ LỜI"
                                    : mode === "forward"
                                        ? "CHUYỂN TIẾP"
                                        : "EMAIL MỚI"}
                            </span>

                            <h1>
                                {getTitle()}
                            </h1>

                        </div>


                        <div className="gmail-status">

                            <span className="gmail-status-dot"></span>

                            Gmail

                        </div>

                    </div>


                    {/* =================================================
                       SUCCESS
                    ================================================= */}

                    {message && (
                        <div className="compose-success">

                            <span>
                                ✓
                            </span>

                            {message}

                        </div>
                    )}


                    {/* =================================================
                       ERROR
                    ================================================= */}

                    {error && (
                        <div className="compose-error">

                            <span>
                                !
                            </span>

                            {error}

                        </div>
                    )}


                    {/* =================================================
                       FORM
                    ================================================= */}

                    <form
                        className="compose-form"
                        onSubmit={handleSend}
                    >


                        {/* NGƯỜI NHẬN */}

                        <div className="compose-field">

                            <label>
                                Người nhận
                            </label>


                            <div className="compose-input-wrapper">

                                <span>
                                    👤
                                </span>


                                <input
                                    type="email"
                                    name="to"
                                    value={form.to}
                                    onChange={handleChange}
                                    placeholder="example@gmail.com"
                                    disabled={
                                        sending
                                    }
                                />

                            </div>

                        </div>


                        {/* TIÊU ĐỀ */}

                        <div className="compose-field">

                            <label>
                                Tiêu đề
                            </label>


                            <div className="compose-input-wrapper">

                                <span>
                                    📝
                                </span>


                                <input
                                    type="text"
                                    name="subject"
                                    value={
                                        form.subject
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Nhập tiêu đề email"
                                    disabled={
                                        sending
                                    }
                                />

                            </div>

                        </div>


                        {/* NỘI DUNG */}

                        <div className="compose-field compose-content-field">

                            <label>
                                Nội dung
                            </label>


                            <textarea
                                name="content"
                                value={
                                    form.content
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder={
                                    mode === "reply"
                                        ? "Viết nội dung trả lời..."
                                        : mode === "forward"
                                            ? "Thêm nội dung trước khi chuyển tiếp..."
                                            : "Viết nội dung email..."
                                }
                                disabled={
                                    sending
                                }
                            />

                        </div>


                        {/* =================================================
                           FOOTER
                        ================================================= */}

                        <div className="compose-footer">


                            <div className="compose-info">

                                <span>
                                    🤖
                                </span>


                                <div>

                                    <strong>
                                        Gmail API
                                    </strong>

                                    <small>
                                        Email sẽ được gửi từ tài khoản Gmail đã kết nối.
                                    </small>

                                </div>

                            </div>


                            <div className="compose-actions">

                                <button
                                    type="button"
                                    className="compose-cancel"
                                    onClick={() =>
                                        navigate(
                                            "/emails"
                                        )
                                    }
                                    disabled={
                                        sending
                                    }
                                >
                                    Hủy
                                </button>


                                <button
                                    type="submit"
                                    className="compose-send"
                                    disabled={
                                        sending
                                    }
                                >

                                    {sending && (
                                        <span className="send-spinner"></span>
                                    )}

                                    {getButtonText()}

                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </main>

        </div>
    );
}


/* =========================================================
   HELPER
========================================================= */

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}


function decodeURIComponentSafe(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}


export default CreateEmail;