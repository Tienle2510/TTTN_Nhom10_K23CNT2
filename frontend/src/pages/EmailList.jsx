import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";

import "./EmailList.css";


function EmailList() {

    const navigate =
        useNavigate();


    // =====================================================
    // STATE
    // =====================================================

    const [emails, setEmails] =
        useState([]);

    const [sentEmails, setSentEmails] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [loadingSent, setLoadingSent] =
        useState(false);

    const [syncing, setSyncing] =
        useState(false);

    const [search, setSearch] =
        useState("");

    const [selectedCategory, setSelectedCategory] =
        useState("all");

    const [selectedTab, setSelectedTab] =
        useState("all");

    const [gmailConnected, setGmailConnected] =
        useState(false);

    const [gmailEmail, setGmailEmail] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState("");


    // =====================================================
    // LOAD EMAILS
    // =====================================================

    const loadEmails =
        useCallback(
            async () => {

                try {

                    setLoading(true);

                    setErrorMessage("");

                    const response =
                        await api.get(
                            "/emails"
                        );

                    const data =
                        response.data;

                    let emailList = [];

                    if (
                        Array.isArray(data)
                    ) {

                        emailList =
                            data;

                    } else if (
                        Array.isArray(
                            data?.data
                        )
                    ) {

                        emailList =
                            data.data;

                    } else if (
                        Array.isArray(
                            data?.emails
                        )
                    ) {

                        emailList =
                            data.emails;

                    } else if (
                        Array.isArray(
                            data?.data?.emails
                        )
                    ) {

                        emailList =
                            data.data.emails;
                    }

                    setEmails(
                        emailList
                    );

                } catch (error) {

                    console.error(
                        "LOAD EMAILS ERROR:",
                        error
                    );

                    setErrorMessage(
                        error.response?.data?.message ||
                        "Không thể tải danh sách email"
                    );

                    setEmails([]);

                } finally {

                    setLoading(false);

                }

            },
            []
        );


    // =====================================================
    // LOAD SENT EMAILS
    // =====================================================

    const loadSentEmails =
        useCallback(
            async () => {

                try {

                    setLoadingSent(
                        true
                    );

                    setErrorMessage("");

                    const response =
                        await api.get(
                            "/gmail/folder/sent",
                            {
                                params: {
                                    maxResults: 50
                                }
                            }
                        );

                    const data =
                        response.data?.data ||
                        response.data;

                    const emailList =
                        Array.isArray(
                            data?.emails
                        )
                            ? data.emails
                            : [];

                    setSentEmails(
                        emailList
                    );

                } catch (error) {

                    console.error(
                        "LOAD SENT EMAILS ERROR:",
                        error
                    );

                    setSentEmails([]);

                    showError(
                        error.response?.data?.message ||
                        "Không thể tải thư đã gửi"
                    );

                } finally {

                    setLoadingSent(
                        false
                    );

                }

            },
            []
        );


    // =====================================================
    // CHECK GMAIL
    // =====================================================

    const checkGmailStatus =
        useCallback(
            async () => {

                try {

                    const response =
                        await api.get(
                            "/gmail/status"
                        );

                    const data =
                        response.data?.data ||
                        response.data;

                    setGmailConnected(
                        Boolean(
                            data?.connected
                        )
                    );

                    setGmailEmail(
                        data?.email ||
                        data?.gmailEmail ||
                        ""
                    );

                } catch (error) {

                    console.error(
                        "GMAIL STATUS ERROR:",
                        error
                    );

                    setGmailConnected(
                        false
                    );

                    setGmailEmail("");

                }

            },
            []
        );


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(
        () => {

            loadEmails();

            checkGmailStatus();

        },
        [
            loadEmails,
            checkGmailStatus
        ]
    );


    // =====================================================
    // MESSAGE
    // =====================================================

    const showMessage =
        useCallback(
            (text) => {

                setMessage(
                    text
                );

                setErrorMessage("");

                setTimeout(
                    () => {
                        setMessage("");
                    },
                    3000
                );

            },
            []
        );


    // =====================================================
    // ERROR
    // =====================================================

    const showError =
        useCallback(
            (text) => {

                setErrorMessage(
                    text
                );

                setMessage("");

                setTimeout(
                    () => {
                        setErrorMessage("");
                    },
                    4000
                );

            },
            []
        );


    // =====================================================
    // CONNECT GMAIL
    // =====================================================

    const connectGmail =
        async () => {

            try {

                const response =
                    await api.get(
                        "/gmail/connect"
                    );

                const data =
                    response.data?.data ||
                    response.data;

                const url =
                    data?.url ||
                    data?.authorizationUrl ||
                    data?.authUrl;

                if (!url) {

                    throw new Error(
                        "Không nhận được đường dẫn kết nối Gmail"
                    );

                }

                window.location.href =
                    url;

            } catch (error) {

                console.error(
                    "CONNECT GMAIL ERROR:",
                    error
                );

                showError(
                    error.response?.data?.message ||
                    error.message ||
                    "Không thể kết nối Gmail"
                );

            }

        };


    // =====================================================
    // SYNC GMAIL
    // =====================================================

    const syncGmail =
        async () => {

            try {

                setSyncing(
                    true
                );

                setErrorMessage("");

                setMessage(
                    "Đang đồng bộ email từ Gmail..."
                );

                const response =
                    await api.post(
                        "/gmail/sync"
                    );

                const data =
                    response.data?.data ||
                    response.data;

                await loadEmails();

                await checkGmailStatus();

                if (
                    selectedTab === "sent"
                ) {
                    await loadSentEmails();
                }

                const imported =
                    data?.imported ??
                    data?.count ??
                    data?.total ??
                    0;

                showMessage(
                    imported > 0
                        ? `Đồng bộ thành công ${imported} email`
                        : "Đồng bộ Gmail thành công"
                );

            } catch (error) {

                console.error(
                    "SYNC GMAIL ERROR:",
                    error
                );

                showError(
                    error.response?.data?.message ||
                    "Không thể đồng bộ Gmail"
                );

            } finally {

                setSyncing(
                    false
                );

            }

        };


    // =====================================================
    // OPEN SENT
    // =====================================================

    const openSentFolder =
        async () => {

            setSelectedTab(
                "sent"
            );

            setSelectedCategory(
                "all"
            );

            if (
                !gmailConnected
            ) {

                showError(
                    "Vui lòng kết nối Gmail trước."
                );

                return;
            }

            await loadSentEmails();

        };


    // =====================================================
    // DELETE EMAIL
    // =====================================================

    const deleteEmail =
        async (
            event,
            emailId
        ) => {

            event.stopPropagation();

            const confirmed =
                window.confirm(
                    "Bạn có chắc muốn xóa email này không?"
                );

            if (!confirmed) {
                return;
            }

            try {

                await api.delete(
                    `/emails/${emailId}`
                );

                setEmails(
                    (currentEmails) =>
                        currentEmails.filter(
                            (email) =>
                                email.id !==
                                emailId
                        )
                );

                showMessage(
                    "Đã xóa email"
                );

            } catch (error) {

                console.error(
                    "DELETE EMAIL ERROR:",
                    error
                );

                showError(
                    error.response?.data?.message ||
                    "Không thể xóa email"
                );

            }

        };


    // =====================================================
    // TOGGLE IMPORTANT
    // =====================================================

    const toggleImportant =
        async (
            event,
            email
        ) => {

            event.stopPropagation();

            const currentValue =
                Boolean(
                    email.is_important ??
                    email.isImportant
                );

            const nextValue =
                !currentValue;

            try {

                await api.patch(
                    `/emails/${email.id}/important`,
                    {
                        isImportant:
                            nextValue
                    }
                );

                setEmails(
                    (currentEmails) =>
                        currentEmails.map(
                            (item) => {

                                if (
                                    item.id !==
                                    email.id
                                ) {
                                    return item;
                                }

                                return {
                                    ...item,

                                    is_important:
                                        nextValue,

                                    isImportant:
                                        nextValue
                                };

                            }
                        )
                );

            } catch (error) {

                console.error(
                    "IMPORTANT ERROR:",
                    error
                );

                showError(
                    error.response?.data?.message ||
                    "Không thể cập nhật trạng thái quan trọng"
                );

            }

        };


    // =====================================================
    // OPEN EMAIL
    // =====================================================

    const openEmail =
        (emailId) => {

            navigate(
                `/emails/${emailId}`
            );

        };


    // =====================================================
    // OPEN SENT EMAIL
    // =====================================================

    const openSentEmail =
        (gmailMessageId) => {

            if (
                !gmailMessageId
            ) {

                showError(
                    "Không tìm thấy Gmail message ID."
                );

                return;
            }

            navigate(
                `/gmail/message/${encodeURIComponent(
                    gmailMessageId
                )}`
            );

        };


    // =====================================================
    // CATEGORY
    // =====================================================

    const getCategory =
        (email) => {

            return (
                email.category_name ||
                email.category ||
                email.categoryName ||
                "Khác"
            );

        };


    // =====================================================
    // CATEGORY CLASS
    // =====================================================

    const getCategoryClass =
        (category) => {

            const value =
                String(category)
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    )
                    .replace(
                        /\s+/g,
                        "-"
                    );

            const map = {

                "hoc-tap":
                    "category-hoc-tap",

                "cong-viec":
                    "category-cong-viec",

                "quang-cao":
                    "category-quang-cao",

                "tai-chinh":
                    "category-tai-chinh",

                spam:
                    "category-spam",

                "thong-bao":
                    "category-thong-bao",

                khac:
                    "category-khac"

            };

            return (
                map[value] ||
                "category-khac"
            );

        };


    // =====================================================
    // CATEGORY ICON
    // =====================================================

    const getCategoryIcon =
        (category) => {

            switch (
                String(category)
                    .toLowerCase()
            ) {

                case "học tập":
                    return "🎓";

                case "công việc":
                    return "💼";

                case "quảng cáo":
                    return "🏷️";

                case "tài chính":
                    return "💰";

                case "spam":
                    return "🚫";

                case "thông báo":
                    return "🔔";

                default:
                    return "📁";

            }

        };


    // =====================================================
    // CONFIDENCE
    // =====================================================

    const getConfidence =
        (email) => {

            const value =
                Number(
                    email.confidence ??
                    email.ai_confidence ??
                    0
                );

            if (
                !Number.isFinite(
                    value
                )
            ) {
                return 0;
            }

            if (
                value <= 1
            ) {

                return Math.round(
                    value * 100
                );

            }

            return Math.round(
                value
            );

        };


    // =====================================================
    // AVATAR
    // =====================================================

    const getAvatar =
        (sender) => {

            if (!sender) {
                return "?";
            }

            const value =
                String(sender)
                    .trim();

            /*
               Nếu sender dạng:
               Nguyen Van A <abc@gmail.com>
            */

            const match =
                value.match(
                    /^"?([^"<]+)"?\s*<[^>]+>$/
                );

            if (
                match &&
                match[1]
            ) {

                return match[1]
                    .trim()
                    .charAt(0)
                    .toUpperCase();

            }

            return value
                .charAt(0)
                .toUpperCase();

        };


    // =====================================================
    // CLEAN CONTENT
    // =====================================================

    const cleanContent =
        (content) => {

            if (!content) {
                return "";
            }

            return String(content)
                .replace(
                    /<style[\s\S]*?<\/style>/gi,
                    " "
                )
                .replace(
                    /<script[\s\S]*?<\/script>/gi,
                    " "
                )
                .replace(
                    /<[^>]*>/g,
                    " "
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        };


    // =====================================================
    // DATE
    // =====================================================

    const formatDate =
        (dateValue) => {

            if (!dateValue) {
                return "";
            }

            const date =
                new Date(
                    dateValue
                );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "";
            }

            const now =
                new Date();

            if (
                date.toDateString() ===
                now.toDateString()
            ) {

                return date.toLocaleTimeString(
                    "vi-VN",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

            }

            return date.toLocaleDateString(
                "vi-VN",
                {
                    day: "2-digit",
                    month: "2-digit"
                }
            );

        };


    // =====================================================
    // STATUS
    // =====================================================

    const isUnread =
        (email) => {

            const status =
                String(
                    email.status ||
                    ""
                ).toLowerCase();

            return (
                status === "new" ||
                status === "unread"
            );

        };


    // =====================================================
    // FILTER + SEARCH
    // =====================================================

    const filteredEmails =
        useMemo(
            () => {

                /*
                   Nếu đang ở Đã gửi:
                   dùng sentEmails.

                   Các tab còn lại:
                   dùng emails từ database.
                */

                let result =
                    selectedTab === "sent"
                        ? [...sentEmails]
                        : [...emails];


                // =================================================
                // UNREAD
                // =================================================

                if (
                    selectedTab ===
                    "unread"
                ) {

                    result =
                        result.filter(
                            isUnread
                        );

                }


                // =================================================
                // IMPORTANT
                // =================================================

                if (
                    selectedTab ===
                    "important"
                ) {

                    result =
                        result.filter(
                            (email) =>
                                Boolean(
                                    email.is_important ??
                                    email.isImportant
                                )
                        );

                }


                // =================================================
                // PROCESSED
                // =================================================

                if (
                    selectedTab ===
                    "processed"
                ) {

                    result =
                        result.filter(
                            (email) =>
                                String(
                                    email.status ||
                                    ""
                                ).toLowerCase() ===
                                "processed"
                        );

                }


                // =================================================
                // CATEGORY
                // =================================================

                if (
                    selectedTab !== "sent" &&
                    selectedCategory !== "all"
                ) {

                    result =
                        result.filter(
                            (email) =>
                                getCategory(
                                    email
                                ) ===
                                selectedCategory
                        );

                }


                // =================================================
                // SEARCH
                // =================================================

                const keyword =
                    search
                        .trim()
                        .toLowerCase();

                if (keyword) {

                    result =
                        result.filter(
                            (email) => {

                                const sender =
                                    String(
                                        email.sender ||
                                        ""
                                    ).toLowerCase();

                                const recipient =
                                    String(
                                        email.recipient ||
                                        email.to ||
                                        ""
                                    ).toLowerCase();

                                const subject =
                                    String(
                                        email.subject ||
                                        ""
                                    ).toLowerCase();

                                const content =
                                    cleanContent(
                                        email.content
                                    ).toLowerCase();

                                const category =
                                    getCategory(
                                        email
                                    ).toLowerCase();

                                return (
                                    sender.includes(
                                        keyword
                                    ) ||

                                    recipient.includes(
                                        keyword
                                    ) ||

                                    subject.includes(
                                        keyword
                                    ) ||

                                    content.includes(
                                        keyword
                                    ) ||

                                    category.includes(
                                        keyword
                                    )
                                );

                            }
                        );

                }

                return result;

            },
            [
                emails,
                sentEmails,
                selectedTab,
                selectedCategory,
                search
            ]
        );


    // =====================================================
    // COUNTS
    // =====================================================

    const unreadCount =
        useMemo(
            () =>
                emails.filter(
                    isUnread
                ).length,
            [emails]
        );


    const importantCount =
        useMemo(
            () =>
                emails.filter(
                    (email) =>
                        Boolean(
                            email.is_important ??
                            email.isImportant
                        )
                ).length,
            [emails]
        );


    const processedCount =
        useMemo(
            () =>
                emails.filter(
                    (email) =>
                        String(
                            email.status ||
                            ""
                        ).toLowerCase() ===
                        "processed"
                ).length,
            [emails]
        );


    const sentCount =
        sentEmails.length;


    // =====================================================
    // CATEGORY COUNTS
    // =====================================================

    const categoryCounts =
        useMemo(
            () => {

                const counts = {};

                emails.forEach(
                    (email) => {

                        const category =
                            getCategory(
                                email
                            );

                        counts[category] =
                            (
                                counts[category] ||
                                0
                            ) + 1;

                    }
                );

                return counts;

            },
            [emails]
        );


    const categories = [
        "Học tập",
        "Công việc",
        "Quảng cáo",
        "Tài chính",
        "Spam",
        "Thông báo",
        "Khác"
    ];


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="gmail-app">


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="gmail-sidebar">


                {/* BRAND */}

                <div className="sidebar-brand">

                    <button
                        className="menu-button"
                        onClick={() =>
                            navigate(
                                "/emails"
                            )
                        }
                    >
                        ☰
                    </button>

                    <div className="brand-logo">
                        AI
                    </div>

                    <div className="brand-text">

                        <strong>
                            AI Mail
                        </strong>

                        <span>
                            Email Intelligence
                        </span>

                    </div>

                </div>


                {/* COMPOSE */}

                <button
                    className="compose-button"
                    onClick={() =>
                        navigate(
                            "/emails/new"
                        )
                    }
                >

                    <span>
                        ＋
                    </span>

                    Soạn email

                </button>


                {/* NAVIGATION */}

                <nav className="mail-navigation">


                    {/* ALL */}

                    <button
                        className={
                            `sidebar-item ${
                                selectedTab === "all"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() => {

                            setSelectedTab(
                                "all"
                            );

                            setSelectedCategory(
                                "all"
                            );

                        }}
                    >

                        <span className="sidebar-item-icon">
                            📥
                        </span>

                        <span className="sidebar-item-label">
                            Tất cả thư
                        </span>

                        <span className="sidebar-item-count">
                            {emails.length}
                        </span>

                    </button>


                    {/* UNREAD */}

                    <button
                        className={
                            `sidebar-item ${
                                selectedTab === "unread"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() => {

                            setSelectedTab(
                                "unread"
                            );

                            setSelectedCategory(
                                "all"
                            );

                        }}
                    >

                        <span className="sidebar-item-icon">
                            ✉️
                        </span>

                        <span className="sidebar-item-label">
                            Chưa đọc
                        </span>

                        <span className="sidebar-item-count">
                            {unreadCount}
                        </span>

                    </button>


                    {/* IMPORTANT */}

                    <button
                        className={
                            `sidebar-item ${
                                selectedTab === "important"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() => {

                            setSelectedTab(
                                "important"
                            );

                            setSelectedCategory(
                                "all"
                            );

                        }}
                    >

                        <span className="sidebar-item-icon">
                            ⭐
                        </span>

                        <span className="sidebar-item-label">
                            Quan trọng
                        </span>

                        <span className="sidebar-item-count">
                            {importantCount}
                        </span>

                    </button>


                    {/* SENT */}

                    <button
                        className={
                            `sidebar-item ${
                                selectedTab === "sent"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={
                            openSentFolder
                        }
                    >

                        <span className="sidebar-item-icon">
                            📤
                        </span>

                        <span className="sidebar-item-label">
                            Đã gửi
                        </span>

                        <span className="sidebar-item-count">
                            {sentCount}
                        </span>

                    </button>


                    {/* PROCESSED */}

                    <button
                        className={
                            `sidebar-item ${
                                selectedTab === "processed"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() => {

                            setSelectedTab(
                                "processed"
                            );

                            setSelectedCategory(
                                "all"
                            );

                        }}
                    >

                        <span className="sidebar-item-icon">
                            ✅
                        </span>

                        <span className="sidebar-item-label">
                            Đã xử lý
                        </span>

                        <span className="sidebar-item-count">
                            {processedCount}
                        </span>

                    </button>

                </nav>


                {/* CATEGORY */}

                <div className="sidebar-section-title">

                    <span>
                        DANH MỤC AI
                    </span>

                </div>


                <nav className="category-navigation">


                    {/* ALL CATEGORY */}

                    <button
                        className={
                            `category-item ${
                                selectedCategory === "all" &&
                                selectedTab !== "sent"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() => {

                            setSelectedCategory(
                                "all"
                            );

                            setSelectedTab(
                                "all"
                            );

                        }}
                    >

                        <span className="category-icon">
                            📁
                        </span>

                        <span className="category-name">
                            Tất cả
                        </span>

                        <span className="category-count">
                            {emails.length}
                        </span>

                    </button>


                    {categories.map(
                        (category) => (

                            <button
                                key={category}
                                className={
                                    `category-item ${
                                        selectedCategory ===
                                        category
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={() => {

                                    setSelectedCategory(
                                        category
                                    );

                                    setSelectedTab(
                                        "all"
                                    );

                                }}
                            >

                                <span className="category-icon">

                                    {getCategoryIcon(
                                        category
                                    )}

                                </span>

                                <span className="category-name">

                                    {category}

                                </span>

                                <span className="category-count">

                                    {
                                        categoryCounts[
                                            category
                                        ] || 0
                                    }

                                </span>

                            </button>

                        )
                    )}

                </nav>


                {/* GMAIL STATUS */}

                <div className="sidebar-bottom">

                    <div
                        className={
                            `gmail-status ${
                                gmailConnected
                                    ? "connected"
                                    : ""
                            }`
                        }
                    >

                        <span className="status-dot" />

                        <div>

                            <strong>
                                Gmail
                            </strong>

                            <small>

                                {gmailConnected
                                    ? (
                                        gmailEmail ||
                                        "Đã kết nối"
                                    )
                                    : "Chưa kết nối"}

                            </small>

                        </div>

                    </div>


                    {gmailConnected ? (

                        <button
                            className="connect-button"
                            onClick={
                                syncGmail
                            }
                            disabled={
                                syncing
                            }
                        >

                            {syncing
                                ? "Đang đồng bộ..."
                                : "🔄 Đồng bộ Gmail"}

                        </button>

                    ) : (

                        <button
                            className="connect-button"
                            onClick={
                                connectGmail
                            }
                        >

                            🔗 Kết nối Gmail

                        </button>

                    )}

                </div>

            </aside>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="gmail-main">


                {/* HEADER */}

                <header className="gmail-header">


                    <div className="mobile-menu">

                        <button>
                            ☰
                        </button>

                    </div>


                    <div className="search-box">

                        <span className="search-icon">
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder={
                                selectedTab === "sent"
                                    ? "Tìm kiếm thư đã gửi..."
                                    : "Tìm kiếm email..."
                            }
                            value={search}
                            onChange={
                                (event) =>
                                    setSearch(
                                        event.target.value
                                    )
                            }
                        />

                        {search && (

                            <button
                                className="clear-search"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                ×
                            </button>

                        )}

                    </div>


                    <div className="header-actions">


                        <button
                            title="Làm mới"
                            onClick={
                                selectedTab === "sent"
                                    ? loadSentEmails
                                    : loadEmails
                            }
                        >
                            ↻
                        </button>


                        <button
                            title="Dashboard"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            📊
                        </button>


                        <button
                            title="Đăng xuất"
                            onClick={() => {

                                localStorage.removeItem(
                                    "secretToken"
                                );

                                localStorage.removeItem(
                                    "refreshToken"
                                );

                                localStorage.removeItem(
                                    "user"
                                );

                                navigate(
                                    "/login"
                                );

                            }}
                        >
                            🚪
                        </button>


                        <div className="profile-avatar">

                            {getAvatar(
                                gmailEmail ||
                                "U"
                            )}

                        </div>

                    </div>

                </header>


                {/* MESSAGE */}

                {(message ||
                    errorMessage) && (

                    <div
                        style={{
                            padding:
                                "10px 24px",

                            fontSize:
                                "13px",

                            color:
                                errorMessage
                                    ? "#c5221f"
                                    : "#188038",

                            background:
                                errorMessage
                                    ? "#fff1f0"
                                    : "#edf8f0",

                            borderBottom:
                                "1px solid #edf0f2"
                        }}
                    >

                        {errorMessage ||
                            message}

                    </div>

                )}


                {/* ACCOUNT */}

                <div className="account-bar">

                    <div className="account-info">

                        <span className="account-dot" />

                        <span>

                            {selectedTab === "sent"
                                ? "Thư đã gửi từ Gmail"
                                : "Hệ thống AI đang hoạt động"}

                        </span>

                        <strong>

                            {selectedTab === "sent"
                                ? `${sentEmails.length} thư đã gửi`
                                : `${emails.length} email`}

                        </strong>

                    </div>


                    <span className="sync-info">

                        {gmailConnected
                            ? "Gmail đã kết nối"
                            : "Gmail chưa kết nối"}

                    </span>

                </div>


                {/* TOOLBAR */}

                <div className="mail-toolbar">

                    <div className="toolbar-left">

                        <button
                            className="toolbar-icon"
                            title="Làm mới"
                            onClick={
                                selectedTab === "sent"
                                    ? loadSentEmails
                                    : loadEmails
                            }
                            disabled={
                                loading ||
                                loadingSent
                            }
                        >
                            ↻
                        </button>


                        <button
                            className="toolbar-icon"
                            title="Đồng bộ Gmail"
                            onClick={
                                syncGmail
                            }
                            disabled={
                                syncing ||
                                !gmailConnected
                            }
                        >
                            🔄
                        </button>

                    </div>


                    <div className="mail-counter">

                        {filteredEmails.length}

                        {" / "}

                        {selectedTab === "sent"
                            ? sentEmails.length
                            : emails.length}

                        {" email"}

                    </div>

                </div>


                {/* TABS */}

                <div className="mail-tabs">


                    {/* ALL */}

                    <button
                        className={
                            `mail-tab ${
                                selectedTab === "all"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            setSelectedTab(
                                "all"
                            )
                        }
                    >

                        <span>
                            📥
                        </span>

                        <span>
                            Tất cả
                        </span>

                        <b>
                            {emails.length}
                        </b>

                    </button>


                    {/* UNREAD */}

                    <button
                        className={
                            `mail-tab ${
                                selectedTab === "unread"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            setSelectedTab(
                                "unread"
                            )
                        }
                    >

                        <span>
                            ✉️
                        </span>

                        <span>
                            Chưa đọc
                        </span>

                        <b>
                            {unreadCount}
                        </b>

                    </button>


                    {/* IMPORTANT */}

                    <button
                        className={
                            `mail-tab ${
                                selectedTab === "important"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            setSelectedTab(
                                "important"
                            )
                        }
                    >

                        <span>
                            ⭐
                        </span>

                        <span>
                            Quan trọng
                        </span>

                        <b>
                            {importantCount}
                        </b>

                    </button>


                    {/* SENT */}

                    <button
                        className={
                            `mail-tab ${
                                selectedTab === "sent"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={
                            openSentFolder
                        }
                    >

                        <span>
                            📤
                        </span>

                        <span>
                            Đã gửi
                        </span>

                        <b>
                            {sentCount}
                        </b>

                    </button>


                    {/* PROCESSED */}

                    <button
                        className={
                            `mail-tab ${
                                selectedTab === "processed"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            setSelectedTab(
                                "processed"
                            )
                        }
                    >

                        <span>
                            ✅
                        </span>

                        <span>
                            Đã xử lý
                        </span>

                        <b>
                            {processedCount}
                        </b>

                    </button>

                </div>


                {/* EMAIL LIST */}

                <div className="email-container">


                    {/* LOADING */}

                    {(
                        loading ||
                        (
                            selectedTab === "sent" &&
                            loadingSent
                        )
                    ) ? (

                        <div className="email-loading">

                            <div className="loading-spinner" />

                            <span>

                                {selectedTab === "sent"
                                    ? "Đang tải thư đã gửi..."
                                    : "Đang tải email..."}

                            </span>

                        </div>


                    ) : filteredEmails.length === 0 ? (

                        <div className="empty-mail">

                            <div className="empty-icon">
                                📭
                            </div>

                            <h3>

                                {selectedTab === "sent"
                                    ? "Chưa có thư đã gửi"
                                    : "Không có email"}

                            </h3>

                            <p>

                                {search
                                    ? "Không tìm thấy email phù hợp."
                                    : selectedTab === "sent"
                                        ? (
                                            gmailConnected
                                                ? "Gmail chưa có thư đã gửi."
                                                : "Hãy kết nối Gmail để xem thư đã gửi."
                                        )
                                        : "Danh sách email đang trống."}

                            </p>


                            {search ? (

                                <button
                                    onClick={() =>
                                        setSearch("")
                                    }
                                >
                                    Xóa tìm kiếm
                                </button>

                            ) : selectedTab === "sent" ? (

                                <button
                                    onClick={
                                        gmailConnected
                                            ? loadSentEmails
                                            : connectGmail
                                    }
                                >

                                    {gmailConnected
                                        ? "Tải lại thư đã gửi"
                                        : "Kết nối Gmail"}

                                </button>

                            ) : (

                                <button
                                    onClick={
                                        gmailConnected
                                            ? syncGmail
                                            : connectGmail
                                    }
                                >

                                    {gmailConnected
                                        ? "Đồng bộ Gmail"
                                        : "Kết nối Gmail"}

                                </button>

                            )}

                        </div>


                    ) : (

                        <div className="email-list">

                            {filteredEmails.map(
                                (email) => {

                                    const isSent =
                                        selectedTab ===
                                        "sent";


                                    const category =
                                        getCategory(
                                            email
                                        );


                                    const confidence =
                                        getConfidence(
                                            email
                                        );


                                    const important =
                                        Boolean(
                                            email.is_important ??
                                            email.isImportant
                                        );


                                    const unread =
                                        isUnread(
                                            email
                                        );


                                    const preview =
                                        cleanContent(
                                            email.content ||
                                            email.snippet
                                        );


                                    return (

                                        <div
                                            key={
                                                isSent
                                                    ? email.id
                                                    : email.id
                                            }
                                            className={
                                                `email-row ${
                                                    unread &&
                                                    !isSent
                                                        ? "unread"
                                                        : ""
                                                } ${
                                                    isSent
                                                        ? "sent-row"
                                                        : ""
                                                }`
                                            }
                                            onClick={() => {

                                                if (
                                                    isSent
                                                ) {

                                                    openSentEmail(
                                                        email.id
                                                    );

                                                } else {

                                                    openEmail(
                                                        email.id
                                                    );

                                                }

                                            }}
                                        >


                                            {/* CHECKBOX */}

                                            <div className="email-checkbox">

                                                <input
                                                    type="checkbox"
                                                    onClick={
                                                        (event) =>
                                                            event.stopPropagation()
                                                    }
                                                />

                                            </div>


                                            {/* STAR */}

                                            {!isSent ? (

                                                <button
                                                    className={
                                                        `email-star ${
                                                            important
                                                                ? "starred"
                                                                : ""
                                                        }`
                                                    }
                                                    onClick={
                                                        (event) =>
                                                            toggleImportant(
                                                                event,
                                                                email
                                                            )
                                                    }
                                                    title={
                                                        important
                                                            ? "Bỏ quan trọng"
                                                            : "Đánh dấu quan trọng"
                                                    }
                                                >

                                                    {important
                                                        ? "★"
                                                        : "☆"}

                                                </button>

                                            ) : (

                                                <div className="email-star sent-icon">

                                                    📤

                                                </div>

                                            )}


                                            {/* AVATAR */}

                                            <div className="sender-avatar">

                                                {getAvatar(
                                                    isSent
                                                        ? (
                                                            email.recipient ||
                                                            email.sender
                                                        )
                                                        : email.sender
                                                )}

                                            </div>


                                            {/* SENDER / RECIPIENT */}

                                            <div className="email-sender">

                                                <strong>

                                                    {isSent
                                                        ? (
                                                            email.recipient ||
                                                            "Không rõ người nhận"
                                                        )
                                                        : (
                                                            email.sender ||
                                                            "Không rõ người gửi"
                                                        )}

                                                </strong>

                                                <span>

                                                    {isSent
                                                        ? "Đã gửi"
                                                        : (
                                                            email.gmail_message_id
                                                                ? "Gmail"
                                                                : "Email hệ thống"
                                                        )}

                                                </span>

                                            </div>


                                            {/* CONTENT */}

                                            <div className="email-content">

                                                <div className="email-subject">

                                                    <strong>

                                                        {email.subject ||
                                                            "(Không có tiêu đề)"}

                                                    </strong>


                                                    {preview && (

                                                        <span className="email-preview">

                                                            {" — "}

                                                            {preview.substring(
                                                                0,
                                                                120
                                                            )}

                                                        </span>

                                                    )}

                                                </div>

                                            </div>


                                            {/* AI */}

                                            {!isSent ? (

                                                <div className="email-ai">

                                                    <span
                                                        className={
                                                            `ai-category ${
                                                                getCategoryClass(
                                                                    category
                                                                )
                                                            }`
                                                        }
                                                    >

                                                        {getCategoryIcon(
                                                            category
                                                        )}

                                                        {" "}

                                                        {category}

                                                    </span>

                                                    <small>

                                                        AI{" "}

                                                        {confidence}%

                                                    </small>

                                                </div>

                                            ) : (

                                                <div className="email-ai">

                                                    <span className="ai-category category-khac">

                                                        📤

                                                        {" "}

                                                        Gmail

                                                    </span>

                                                    <small>

                                                        Đã gửi

                                                    </small>

                                                </div>

                                            )}


                                            {/* DATE */}

                                            <div className="email-date">

                                                {formatDate(
                                                    email.created_at ||
                                                    email.updated_at ||
                                                    email.date ||
                                                    email.internalDate
                                                )}

                                            </div>


                                            {/* DELETE */}

                                            {!isSent && (

                                                <div className="email-actions">

                                                    <button
                                                        title="Xóa email"
                                                        onClick={
                                                            (event) =>
                                                                deleteEmail(
                                                                    event,
                                                                    email.id
                                                                )
                                                        }
                                                    >

                                                        🗑️

                                                    </button>

                                                </div>

                                            )}

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>


                {/* FOOTER */}

                <footer className="mail-footer">

                    <span>
                        AI Email Classification System
                    </span>

                    <span>

                        {selectedTab === "sent"
                            ? `${sentEmails.length} thư đã gửi`
                            : `${emails.length} email`}

                    </span>

                </footer>

            </main>

        </div>

    );

}


export default EmailList;