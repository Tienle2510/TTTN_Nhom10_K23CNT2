import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import api from "../services/api";

import "./EmailDetail.css";

const categories = [
    "Học tập",
    "Công việc",
    "Quảng cáo",
    "Tài chính",
    "Spam",
    "Thông báo",
    "Khác"
];

function EmailDetail() {

    const { id } = useParams();

    const navigate = useNavigate();

    // =================================================
    // EMAIL
    // =================================================

    const [email, setEmail] =
        useState(null);

    const [logs, setLogs] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [important, setImportant] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [isEditing, setIsEditing] =
        useState(false);

    // =================================================
    // REPLY
    // =================================================

    const [replying, setReplying] =
        useState(false);

    const [replyContent, setReplyContent] =
        useState("");

    const [sendingReply, setSendingReply] =
        useState(false);

    // =================================================
    // FORWARD
    // =================================================

    const [forwarding, setForwarding] =
        useState(false);

    const [forwardTo, setForwardTo] =
        useState("");

    const [forwardContent, setForwardContent] =
        useState("");

    const [sendingForward, setSendingForward] =
        useState(false);

    // =================================================
    // FORM EDIT
    // =================================================

    const [form, setForm] =
        useState({
            sender: "",
            subject: "",
            content: ""
        });

    // =================================================
    // QUAY LẠI
    // =================================================

    function goBack() {
        navigate("/emails");
    }

    // =================================================
    // LOAD EMAIL
    // =================================================

    async function loadEmail() {

        try {

            setLoading(true);
            setError("");

            const response =
                await api.get(
                    `/emails/${id}`
                );

            const data =
                response.data?.data ||
                response.data?.email ||
                response.data;

            setEmail(data);

            setImportant(
                Boolean(
                    data?.is_important
                )
            );

            setForm({
                sender:
                    data?.sender || "",

                subject:
                    data?.subject || "",

                content:
                    data?.content || ""
            });

        } catch (err) {

            console.error(
                "LOAD EMAIL ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Không thể tải email."
            );

        } finally {

            setLoading(false);

        }
    }

    // =================================================
    // LOAD LOG
    // =================================================

    async function loadLogs() {

        try {

            const response =
                await api.get(
                    `/emails/${id}/logs`
                );

            const data =
                response.data?.data ||
                response.data?.logs ||
                response.data;

            setLogs(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.warn(
                "LOAD LOGS ERROR:",
                err.message
            );

            setLogs([]);

        }
    }

    // =================================================
    // LOAD
    // =================================================

    useEffect(() => {

        loadEmail();
        loadLogs();

    }, [id]);

    // =================================================
    // IMPORTANT
    // =================================================

    async function toggleImportant() {

        try {

            const nextValue =
                !important;

            const response =
                await api.patch(
                    `/emails/${id}/important`,
                    {
                        isImportant:
                            nextValue
                    }
                );

            const data =
                response.data?.data ||
                response.data;

            setImportant(
                Boolean(
                    data?.isImportant ??
                    data?.is_important ??
                    nextValue
                )
            );

            setSuccess(
                nextValue
                    ? "Đã đánh dấu quan trọng."
                    : "Đã bỏ đánh dấu quan trọng."
            );

            setError("");

        } catch (err) {

            console.error(
                "IMPORTANT ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Không thể cập nhật trạng thái quan trọng."
            );

        }
    }

    // =================================================
    // DELETE
    // =================================================

    async function deleteEmail() {

        const confirmed =
            window.confirm(
                "Bạn có chắc muốn xóa email này không?"
            );

        if (!confirmed) {
            return;
        }

        try {

            setDeleting(true);
            setError("");

            await api.delete(
                `/emails/${id}`
            );

            navigate("/emails");

        } catch (err) {

            console.error(
                "DELETE EMAIL ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Không thể xóa email."
            );

        } finally {

            setDeleting(false);

        }
    }

    // =================================================
    // EDIT
    // =================================================

    function startEditing() {

        setIsEditing(true);
        setError("");
        setSuccess("");

    }

    function cancelEditing() {

        setIsEditing(false);

        setForm({
            sender:
                email?.sender || "",

            subject:
                email?.subject || "",

            content:
                email?.content || ""
        });

    }

    function handleChange(event) {

        const {
            name,
            value
        } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    async function updateEmail() {

        try {

            setSaving(true);
            setError("");
            setSuccess("");

            await api.put(
                `/emails/${id}`,
                {
                    sender:
                        form.sender,

                    subject:
                        form.subject,

                    content:
                        form.content,

                    status:
                        "processed"
                }
            );

            setSuccess(
                "Cập nhật email thành công."
            );

            setIsEditing(false);

            await loadEmail();
            await loadLogs();

        } catch (err) {

            console.error(
                "UPDATE EMAIL ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Không thể cập nhật email."
            );

        } finally {

            setSaving(false);

        }
    }

    // =================================================
    // REPLY - MỞ
    // =================================================

    function openReply() {

        setReplying(true);
        setForwarding(false);

        setError("");
        setSuccess("");

        setReplyContent("");

    }

    // =================================================
    // REPLY - ĐÓNG
    // =================================================

    function closeReply() {

        if (sendingReply) {
            return;
        }

        setReplying(false);
        setReplyContent("");

    }

    // =================================================
    // GỬI REPLY
    // =================================================

    async function sendReply() {

        if (!replyContent.trim()) {

            setError(
                "Vui lòng nhập nội dung trả lời."
            );

            return;
        }

        try {

            setSendingReply(true);

            setError("");
            setSuccess("");

            console.log(
                "Đang gửi Reply:",
                {
                    emailId: id,
                    content:
                        replyContent.trim()
                }
            );

            const response =
                await api.post(
                    `/gmail/${id}/reply`,
                    {
                        content:
                            replyContent.trim()
                    }
                );

            console.log(
                "REPLY SUCCESS:",
                response.data
            );

            setSuccess(
                response.data?.message ||
                "Đã trả lời email thành công."
            );

            setReplyContent("");
            setReplying(false);

            await loadLogs();

        } catch (err) {

            console.error(
                "SEND REPLY ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Không thể gửi trả lời email."
            );

        } finally {

            setSendingReply(false);

        }
    }

    // =================================================
    // FORWARD - MỞ
    // =================================================

    function openForward() {

        setForwarding(true);
        setReplying(false);

        setError("");
        setSuccess("");

        setForwardTo("");
        setForwardContent("");

    }

    // =================================================
    // FORWARD - ĐÓNG
    // =================================================

    function closeForward() {

        if (sendingForward) {
            return;
        }

        setForwarding(false);

        setForwardTo("");
        setForwardContent("");

    }

    // =================================================
    // GỬI FORWARD
    // =================================================

    async function sendForward() {

        if (!forwardTo.trim()) {

            setError(
                "Vui lòng nhập email người nhận."
            );

            return;
        }

        if (!forwardContent.trim()) {

            setError(
                "Vui lòng nhập nội dung chuyển tiếp."
            );

            return;
        }

        try {

            setSendingForward(true);

            setError("");
            setSuccess("");

            console.log(
                "Đang gửi Forward:",
                {
                    emailId: id,
                    to:
                        forwardTo.trim(),
                    content:
                        forwardContent.trim()
                }
            );

            const response =
                await api.post(
                    `/gmail/${id}/forward`,
                    {
                        to:
                            forwardTo.trim(),

                        content:
                            forwardContent.trim()
                    }
                );

            console.log(
                "FORWARD SUCCESS:",
                response.data
            );

            setSuccess(
                response.data?.message ||
                "Đã chuyển tiếp email thành công."
            );

            setForwarding(false);

            setForwardTo("");
            setForwardContent("");

            await loadLogs();

        } catch (err) {

            console.error(
                "SEND FORWARD ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Không thể chuyển tiếp email."
            );

        } finally {

            setSendingForward(false);

        }
    }

    // =================================================
    // CATEGORY ICON
    // =================================================

    function getCategoryIcon(category) {

        switch (category) {

            case "Học tập":
                return "🎓";

            case "Công việc":
                return "💼";

            case "Quảng cáo":
                return "🏷️";

            case "Tài chính":
                return "💰";

            case "Spam":
                return "🚫";

            case "Thông báo":
                return "🔔";

            default:
                return "📧";
        }
    }

    // =================================================
    // CATEGORY CLASS
    // =================================================

    function getCategoryClass(category) {

        switch (category) {

            case "Học tập":
                return "category-hoc-tap";

            case "Công việc":
                return "category-cong-viec";

            case "Quảng cáo":
                return "category-quang-cao";

            case "Tài chính":
                return "category-tai-chinh";

            case "Spam":
                return "category-spam";

            case "Thông báo":
                return "category-thong-bao";

            default:
                return "category-khac";
        }
    }

    // =================================================
    // CONFIDENCE
    // =================================================

    function getConfidence(value) {

        const number =
            Number(value);

        if (Number.isNaN(number)) {
            return 0;
        }

        if (number <= 1) {

            return Math.round(
                number * 100
            );
        }

        return Math.round(number);
    }

    // =================================================
    // CONFIDENCE LABEL
    // =================================================

    function getConfidenceLabel(confidence) {

        if (confidence >= 90) {
            return "Rất cao";
        }

        if (confidence >= 75) {
            return "Cao";
        }

        if (confidence >= 50) {
            return "Trung bình";
        }

        return "Thấp";
    }

    // =================================================
    // FORMAT DATE
    // =================================================

    function formatDate(date) {

        if (!date) {
            return "";
        }

        try {

            return new Date(
                date
            ).toLocaleString(
                "vi-VN",
                {
                    dateStyle:
                        "medium",

                    timeStyle:
                        "short"
                }
            );

        } catch {

            return String(date);

        }
    }

    // =================================================
    // SENDER NAME
    // =================================================

    function getSenderName(sender) {

        if (!sender) {
            return "Không rõ người gửi";
        }

        const match =
            String(sender).match(
                /^"?([^"<]+)"?\s*<[^>]+>$/
            );

        if (match) {

            return match[1].trim();

        }

        const emailMatch =
            String(sender).match(
                /<([^>]+)>/
            );

        if (emailMatch) {

            return emailMatch[1];

        }

        return String(sender);
    }

    // =================================================
    // SENDER EMAIL
    // =================================================

    function getSenderEmail(sender) {

        if (!sender) {
            return "";
        }

        const match =
            String(sender).match(
                /<([^>]+)>/
            );

        if (match) {

            return match[1].trim();

        }

        if (
            String(sender).includes("@")
        ) {

            return String(sender).trim();

        }

        return "";
    }

    // =================================================
    // SANITIZE HTML
    // =================================================

    function sanitizeEmailHtml(html) {

        if (!html) {
            return "";
        }

        return String(html)

            .replace(
                /<script\b[^>]*>[\s\S]*?<\/script>/gi,
                ""
            )

            .replace(
                /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
                ""
            )

            .replace(
                /\bon\w+\s*=\s*(['"]).*?\1/gi,
                ""
            )

            .replace(
                /javascript:/gi,
                ""
            );
    }

    // =================================================
    // LOADING
    // =================================================

    if (loading) {

        return (
            <div className="email-detail-page">

                <div className="detail-message">

                    Đang tải email...

                </div>

            </div>
        );
    }

    // =================================================
    // NOT FOUND
    // =================================================

    if (!email) {

        return (
            <div className="email-detail-page">

                <div className="detail-error">

                    {error ||
                        "Không tìm thấy email."}

                </div>

                <button
                    className="back-button"
                    onClick={goBack}
                >
                    ← Quay lại
                </button>

            </div>
        );
    }

    // =================================================
    // DATA
    // =================================================

    const category =
        email.category_name ||
        email.category ||
        "Khác";

    const confidence =
        getConfidence(
            email.confidence
        );

    const senderName =
        getSenderName(
            email.sender
        );

    const senderEmail =
        getSenderEmail(
            email.sender
        );

    const initials =
        senderName
            .split(/\s+/)
            .filter(Boolean)
            .slice(-2)
            .map(
                word =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("") ||
        "AI";

    // =================================================
    // RENDER
    // =================================================

    return (

        <div className="email-detail-page">

            {/* =================================================
                TOPBAR
            ================================================= */}

            <div className="email-detail-topbar">

                <div className="detail-top-left">

                    <button
                        className="back-button"
                        onClick={goBack}
                        title="Quay lại"
                    >
                        ←
                    </button>

                    <span>
                        Chi tiết email
                    </span>

                </div>

                <div className="detail-top-actions">

                    <button
                        className={
                            `top-icon-button ${
                                important
                                    ? "important-active"
                                    : ""
                            }`
                        }
                        onClick={
                            toggleImportant
                        }
                        title="Đánh dấu quan trọng"
                    >
                        {important
                            ? "★"
                            : "☆"}
                    </button>

                    <button
                        className="edit-button"
                        onClick={
                            startEditing
                        }
                    >
                        ✎ Chỉnh sửa
                    </button>

                    <button
                        className="delete-button"
                        onClick={
                            deleteEmail
                        }
                        disabled={deleting}
                    >
                        {deleting
                            ? "Đang xóa..."
                            : "🗑 Xóa"}
                    </button>

                </div>

            </div>

            {/* =================================================
                MESSAGE
            ================================================= */}

            {error && (

                <div className="detail-error">

                    {error}

                </div>

            )}

            {success && (

                <div className="detail-success">

                    {success}

                </div>

            )}

            {/* =================================================
                MAIN
            ================================================= */}

            <div className="email-detail-layout">

                <main className="email-detail-main">

                    {/* =================================================
                        EMAIL CARD
                    ================================================= */}

                    <section className="detail-card">

                        <div className="detail-card-header">

                            <div className="detail-card-label">

                                📧 Email

                            </div>

                            <div className="detail-header-badges">

                                <span
                                    className={
                                        `category-badge ${
                                            getCategoryClass(
                                                category
                                            )
                                        }`
                                    }
                                >

                                    {getCategoryIcon(
                                        category
                                    )}

                                    {category}

                                </span>

                                <span
                                    className={
                                        `status-badge status-${
                                            email.status ||
                                            "processed"
                                        }`
                                    }
                                >

                                    {email.status ===
                                    "new"
                                        ? "Mới"
                                        : "Đã xử lý"}

                                </span>

                            </div>

                        </div>

                        {/* =================================================
                            EDIT / EMAIL
                        ================================================= */}

                        {isEditing ? (

                            <div className="email-edit-form">

                                <div className="edit-field">

                                    <label>
                                        Người gửi
                                    </label>

                                    <input
                                        name="sender"
                                        value={
                                            form.sender
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                                <div className="edit-field">

                                    <label>
                                        Tiêu đề
                                    </label>

                                    <input
                                        name="subject"
                                        value={
                                            form.subject
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                </div>

                                <div className="edit-field">

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
                                        rows="12"
                                    />

                                </div>

                                <div className="edit-actions">

                                    <button
                                        className="cancel-button"
                                        onClick={
                                            cancelEditing
                                        }
                                    >
                                        Hủy
                                    </button>

                                    <button
                                        className="save-button"
                                        onClick={
                                            updateEmail
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        {saving
                                            ? "Đang lưu..."
                                            : "Lưu thay đổi"}
                                    </button>

                                </div>

                            </div>

                        ) : (

                            <>

                                <h1 className="email-detail-subject">

                                    {email.subject ||
                                        "(Không có tiêu đề)"}

                                </h1>

                                {/* =================================================
                                    SENDER
                                ================================================= */}

                                <div className="email-meta">

                                    <div className="sender-avatar">

                                        {initials}

                                    </div>

                                    <div className="sender-info">

                                        <strong>

                                            {senderName}

                                        </strong>

                                        {senderEmail && (

                                            <span>

                                                &lt;
                                                {senderEmail}
                                                &gt;

                                            </span>

                                        )}

                                        <small>
                                            Đến tôi
                                        </small>

                                    </div>

                                    <div className="email-date">

                                        {formatDate(
                                            email.created_at
                                        )}

                                    </div>

                                </div>

                                {/* =================================================
                                    CONTENT
                                ================================================= */}

                                <div className="email-content-wrapper">

                                    {email.content?.includes("<") ? (

                                        <div
                                            className="email-content html-email-content"
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    sanitizeEmailHtml(
                                                        email.content
                                                    )
                                            }}
                                        />

                                    ) : (

                                        <div className="email-content">

                                            {email.content ||
                                                "Không có nội dung."}

                                        </div>

                                    )}

                                </div>

                                {/* =================================================
                                    REPLY / FORWARD BUTTONS
                                ================================================= */}

                                <div className="reply-forward-actions">

                                    <button
                                        className="reply-forward-button primary"
                                        onClick={
                                            openReply
                                        }
                                        disabled={
                                            sendingReply ||
                                            sendingForward
                                        }
                                    >

                                        ↩

                                        <span>
                                            Trả lời
                                        </span>

                                    </button>

                                    <button
                                        className="reply-forward-button"
                                        onClick={
                                            openForward
                                        }
                                        disabled={
                                            sendingReply ||
                                            sendingForward
                                        }
                                    >

                                        ↪

                                        <span>
                                            Chuyển tiếp
                                        </span>

                                    </button>

                                </div>

                                {/* =================================================
                                    REPLY FORM
                                ================================================= */}

                                {replying && (

                                    <div className="reply-forward-box">

                                        <div className="reply-forward-title">

                                            ↩ Trả lời email

                                        </div>

                                        <div className="reply-forward-field">

                                            <label>
                                                Người nhận
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    senderEmail ||
                                                    email.sender ||
                                                    ""
                                                }
                                                disabled
                                            />

                                        </div>

                                        <div className="reply-forward-field">

                                            <label>
                                                Nội dung trả lời
                                            </label>

                                            <textarea
                                                value={
                                                    replyContent
                                                }
                                                onChange={
                                                    event =>
                                                        setReplyContent(
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="Nhập nội dung trả lời..."
                                                rows="7"
                                                autoFocus
                                                disabled={
                                                    sendingReply
                                                }
                                            />

                                        </div>

                                        <div className="reply-forward-actions-bottom">

                                            <button
                                                className="reply-forward-cancel"
                                                onClick={
                                                    closeReply
                                                }
                                                disabled={
                                                    sendingReply
                                                }
                                            >
                                                Hủy
                                            </button>

                                            <button
                                                className="reply-forward-send"
                                                onClick={
                                                    sendReply
                                                }
                                                disabled={
                                                    sendingReply
                                                }
                                            >

                                                {sendingReply
                                                    ? "Đang gửi..."
                                                    : "✈ Gửi trả lời"}

                                            </button>

                                        </div>

                                    </div>

                                )}

                                {/* =================================================
                                    FORWARD FORM
                                ================================================= */}

                                {forwarding && (

                                    <div className="reply-forward-box">

                                        <div className="reply-forward-title">

                                            ↪ Chuyển tiếp email

                                        </div>

                                        <div className="reply-forward-field">

                                            <label>
                                                Người nhận
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    forwardTo
                                                }
                                                onChange={
                                                    event =>
                                                        setForwardTo(
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="email@example.com"
                                                autoFocus
                                                disabled={
                                                    sendingForward
                                                }
                                            />

                                            <small>

                                                Có thể nhập nhiều email,
                                                ngăn cách bằng dấu phẩy.

                                            </small>

                                        </div>

                                        <div className="reply-forward-field">

                                            <label>
                                                Nội dung
                                            </label>

                                            <textarea
                                                value={
                                                    forwardContent
                                                }
                                                onChange={
                                                    event =>
                                                        setForwardContent(
                                                            event.target.value
                                                        )
                                                }
                                                placeholder="Nhập lời nhắn trước khi chuyển tiếp..."
                                                rows="7"
                                                disabled={
                                                    sendingForward
                                                }
                                            />

                                        </div>

                                        <div className="reply-forward-actions-bottom">

                                            <button
                                                className="reply-forward-cancel"
                                                onClick={
                                                    closeForward
                                                }
                                                disabled={
                                                    sendingForward
                                                }
                                            >
                                                Hủy
                                            </button>

                                            <button
                                                className="reply-forward-send"
                                                onClick={
                                                    sendForward
                                                }
                                                disabled={
                                                    sendingForward
                                                }
                                            >

                                                {sendingForward
                                                    ? "Đang gửi..."
                                                    : "✈ Chuyển tiếp"}

                                            </button>

                                        </div>

                                    </div>

                                )}

                            </>

                        )}

                    </section>

                    {/* =================================================
                        AI CARD
                    ================================================= */}

                    <section className="detail-card ai-score-card">

                        <div className="detail-card-header">

                            <div className="detail-card-label">

                                🤖 Phân tích AI

                            </div>

                            <span className="ai-engine-badge">

                                Java AI

                            </span>

                        </div>

                        <div className="ai-result-main">

                            <div className="ai-category-result">

                                <div className="category-result-icon">

                                    {getCategoryIcon(
                                        category
                                    )}

                                </div>

                                <div>

                                    <span>
                                        Phân loại
                                    </span>

                                    <strong>
                                        {category}
                                    </strong>

                                </div>

                            </div>

                            <div className="confidence-result">

                                <div className="confidence-header">

                                    <span>
                                        Độ tin cậy
                                    </span>

                                    <strong>
                                        {confidence}%
                                    </strong>

                                </div>

                                <div className="confidence-track">

                                    <div
                                        className="confidence-fill"
                                        style={{
                                            width:
                                                `${confidence}%`
                                        }}
                                    />

                                </div>

                                <small>

                                    {getConfidenceLabel(
                                        confidence
                                    )}

                                </small>

                            </div>

                        </div>

                        {email.summary && (

                            <div className="ai-summary">

                                <strong>
                                    Tóm tắt
                                </strong>

                                <p>
                                    {email.summary}
                                </p>

                            </div>

                        )}

                    </section>

                    {/* =================================================
                        PROCESSING LOG
                    ================================================= */}

                    <section className="detail-card">

                        <div className="detail-card-header">

                            <div className="detail-card-label">

                                📝 Nhật ký xử lý

                            </div>

                        </div>

                        {logs.length === 0 ? (

                            <div className="no-logs">

                                Chưa có nhật ký xử lý.

                            </div>

                        ) : (

                            <div className="log-list">

                                {logs.map(
                                    (
                                        log,
                                        index
                                    ) => (

                                        <div
                                            className="log-item"
                                            key={
                                                log.id ||
                                                index
                                            }
                                        >

                                            <div className="log-dot" />

                                            <div className="log-content">

                                                <strong>

                                                    {log.action ||
                                                        "PROCESS"}

                                                </strong>

                                                <p>

                                                    {log.description ||
                                                        ""}

                                                </p>

                                                {log.created_at && (

                                                    <small>

                                                        {formatDate(
                                                            log.created_at
                                                        )}

                                                    </small>

                                                )}

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                </main>

                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside className="email-detail-sidebar">

                    {/* AI */}

                    <div className="sidebar-detail-card">

                        <div className="sidebar-card-title">

                            🤖 AI Classification

                        </div>

                        <div
                            className={
                                `sidebar-ai-category ${
                                    getCategoryClass(
                                        category
                                    )
                                }`
                            }
                        >

                            <span>

                                {getCategoryIcon(
                                    category
                                )}

                            </span>

                            <strong>

                                {category}

                            </strong>

                        </div>

                        <div className="sidebar-confidence">

                            <div>

                                <span>
                                    Confidence
                                </span>

                                <strong>
                                    {confidence}%
                                </strong>

                            </div>

                            <div className="mini-confidence-bar">

                                <span
                                    style={{
                                        width:
                                            `${confidence}%`
                                    }}
                                />

                            </div>

                        </div>

                        <div className="ai-status-box">

                            <span className="ai-status-dot" />

                            AI đã xử lý

                        </div>

                    </div>

                    {/* INFO */}

                    <div className="sidebar-detail-card">

                        <div className="sidebar-card-title">

                            📋 Thông tin email

                        </div>

                        <div className="info-list">

                            <div className="info-item">

                                <span>
                                    Người gửi
                                </span>

                                <strong>

                                    {senderEmail ||
                                        senderName}

                                </strong>

                            </div>

                            <div className="info-item">

                                <span>
                                    Trạng thái
                                </span>

                                <strong>

                                    {email.status ||
                                        "processed"}

                                </strong>

                            </div>

                            <div className="info-item">

                                <span>
                                    ID
                                </span>

                                <strong>

                                    #{email.id}

                                </strong>

                            </div>

                        </div>

                    </div>

                    {/* QUICK ACTIONS */}

                    <div className="sidebar-detail-card">

                        <div className="sidebar-card-title">

                            ⚡ Thao tác nhanh

                        </div>

                        <div className="quick-actions">

                            <button
                                onClick={
                                    openReply
                                }
                            >
                                ↩ Trả lời
                            </button>

                            <button
                                onClick={
                                    openForward
                                }
                            >
                                ↪ Chuyển tiếp
                            </button>

                            <button
                                onClick={
                                    toggleImportant
                                }
                            >

                                {important
                                    ? "★ Bỏ quan trọng"
                                    : "☆ Đánh dấu quan trọng"}

                            </button>

                            <button
                                onClick={
                                    startEditing
                                }
                            >
                                ✎ Chỉnh sửa
                            </button>

                            <button
                                onClick={
                                    goBack
                                }
                            >
                                ← Quay lại danh sách
                            </button>

                        </div>

                    </div>

                </aside>

            </div>

        </div>
    );
}

export default EmailDetail;