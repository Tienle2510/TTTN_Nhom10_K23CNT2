import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";

import "./Dashboard.css";


function Dashboard() {

    const navigate = useNavigate();


    const [stats, setStats] =
        useState({
            total: 0,
            new: 0,
            processed: 0,
            important: 0,
            categories: [],
            recentEmails: []
        });


    const [health, setHealth] =
        useState(null);


    const [loading, setLoading] =
        useState(true);


    const [refreshing, setRefreshing] =
        useState(false);


    const [message, setMessage] =
        useState("");


    useEffect(() => {

        loadDashboard();

    }, []);


    async function loadDashboard() {

        try {

            setRefreshing(true);

            const [
                statsResponse,
                healthResponse
            ] = await Promise.all([

                api.get(
                    "/emails/stats"
                ),

                api.get(
                    "/health"
                )

            ]);


            setStats(
                statsResponse.data?.data ||
                statsResponse.data ||
                {
                    total: 0,
                    new: 0,
                    processed: 0,
                    important: 0,
                    categories: [],
                    recentEmails: []
                }
            );


            setHealth(
                healthResponse.data?.data ||
                healthResponse.data
            );


        } catch (error) {

            console.error(
                "DASHBOARD ERROR:",
                error
            );

            setMessage(
                "Không thể tải dữ liệu dashboard"
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }
    }


    function formatDate(date) {

        if (!date) {
            return "";
        }

        const value =
            new Date(date);

        if (
            Number.isNaN(
                value.getTime()
            )
        ) {
            return "";
        }

        const now =
            new Date();

        if (
            value.toDateString() ===
            now.toDateString()
        ) {

            return value.toLocaleTimeString(
                "vi-VN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        }

        return value.toLocaleDateString(
            "vi-VN",
            {
                day: "2-digit",
                month: "2-digit"
            }
        );
    }


    function getCategoryIcon(
        category
    ) {

        const icons = {

            "Học tập": "🎓",
            "Công việc": "💼",
            "Quảng cáo": "📢",
            "Tài chính": "💰",
            "Spam": "🚫",
            "Thông báo": "🔔",
            "Khác": "📄"

        };

        return (
            icons[category] ||
            "📄"
        );
    }


    function getConfidence(
        confidence
    ) {

        if (
            confidence === null ||
            confidence === undefined
        ) {
            return "—";
        }

        return `${(
            Number(confidence) * 100
        ).toFixed(0)}%`;
    }


    const categoryTotal =
        stats.categories?.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.total || 0
                ),
            0
        ) || 0;


    return (

        <div className="dashboard-page">


            {/* HEADER */}

            <header className="dashboard-header">

                <div className="dashboard-brand">

                    <button
                        className="dashboard-back"
                        onClick={() =>
                            navigate(
                                "/emails"
                            )
                        }
                    >
                        ←
                    </button>

                    <div>

                        <h1>
                            AI Mail
                        </h1>

                        <p>
                            Dashboard hệ thống AI
                        </p>

                    </div>

                </div>


                <div className="dashboard-actions">

                    <button
                        onClick={() =>
                            navigate(
                                "/emails"
                            )
                        }
                    >
                        📥 Hộp thư
                    </button>


                    <button
                        className="primary"
                        onClick={() =>
                            navigate(
                                "/emails/new"
                            )
                        }
                    >
                        ＋ Soạn thư
                    </button>

                </div>

            </header>


            {/* MESSAGE */}

            {message && (

                <div className="dashboard-message">
                    {message}
                </div>

            )}


            {/* STATS */}

            <section className="dashboard-stats">

                <StatCard
                    icon="📨"
                    title="Tổng email"
                    value={
                        stats.total
                    }
                    description="Tất cả email"
                />


                <StatCard
                    icon="🆕"
                    title="Email mới"
                    value={
                        stats.new
                    }
                    description="Chưa xử lý"
                />


                <StatCard
                    icon="🤖"
                    title="AI đã xử lý"
                    value={
                        stats.processed
                    }
                    description="Đã phân loại"
                />


                <StatCard
                    icon="⭐"
                    title="Quan trọng"
                    value={
                        stats.important
                    }
                    description="Được đánh dấu"
                />

            </section>


            {/* MAIN GRID */}

            <section className="dashboard-grid">


                {/* AI CATEGORY */}

                <div className="dashboard-card">

                    <div className="card-header">

                        <div>

                            <h2>
                                Phân loại AI
                            </h2>

                            <p>
                                Email được hệ thống tự động phân loại
                            </p>

                        </div>

                        <span className="card-icon">
                            🤖
                        </span>

                    </div>


                    <div className="category-summary">

                        <div className="category-total">

                            <strong>
                                {categoryTotal}
                            </strong>

                            <span>
                                email đã phân loại
                            </span>

                        </div>


                        <div className="category-list">

                            {stats.categories?.map(
                                item => {

                                    const percentage =
                                        categoryTotal
                                            ? (
                                                Number(
                                                    item.total
                                                ) /
                                                categoryTotal
                                            ) * 100
                                            : 0;

                                    return (

                                        <div
                                            className="dashboard-category"
                                            key={
                                                item.category_name
                                            }
                                        >

                                            <div className="category-top">

                                                <span>

                                                    {
                                                        getCategoryIcon(
                                                            item.category_name
                                                        )
                                                    }

                                                    {" "}

                                                    {
                                                        item.category_name
                                                    }

                                                </span>

                                                <strong>
                                                    {
                                                        item.total
                                                    }
                                                </strong>

                                            </div>


                                            <div className="category-progress">

                                                <div
                                                    style={{
                                                        width:
                                                            `${percentage}%`
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    </div>

                </div>


                {/* SYSTEM */}

                <div className="dashboard-card">

                    <div className="card-header">

                        <div>

                            <h2>
                                Trạng thái hệ thống
                            </h2>

                            <p>
                                Các dịch vụ đang hoạt động
                            </p>

                        </div>

                        <span className="card-icon">
                            ⚙️
                        </span>

                    </div>


                    <div className="health-list">

                        <HealthRow
                            name="Node.js Backend"
                            status={
                                health?.services
                                    ?.backend
                            }
                        />


                        <HealthRow
                            name="MySQL Database"
                            status={
                                health?.services
                                    ?.database
                            }
                        />


                        <HealthRow
                            name="Java AI"
                            status={
                                health?.services
                                    ?.javaAI
                            }
                        />

                    </div>


                    <button
                        className="refresh-dashboard"
                        onClick={
                            loadDashboard
                        }
                    >

                        {refreshing
                            ? "Đang kiểm tra..."
                            : "↻ Kiểm tra lại"}

                    </button>

                </div>

            </section>


            {/* RECENT EMAILS */}

            <section className="dashboard-card recent-card">

                <div className="card-header">

                    <div>

                        <h2>
                            Email gần đây
                        </h2>

                        <p>
                            Những email mới nhất trong hệ thống
                        </p>

                    </div>


                    <button
                        className="view-all"
                        onClick={() =>
                            navigate(
                                "/emails"
                            )
                        }
                    >
                        Xem tất cả →
                    </button>

                </div>


                {loading ? (

                    <div className="dashboard-loading">
                        Đang tải dữ liệu...
                    </div>

                ) : stats.recentEmails?.length === 0 ? (

                    <div className="dashboard-empty">

                        <div>
                            ✉
                        </div>

                        <strong>
                            Chưa có email
                        </strong>

                        <span>
                            Email sẽ xuất hiện ở đây sau khi Gmail được đồng bộ.
                        </span>

                    </div>

                ) : (

                    <div className="recent-list">

                        {stats.recentEmails.map(
                            email => (

                                <div
                                    className="recent-row"
                                    key={
                                        email.id
                                    }
                                    onClick={() =>
                                        navigate(
                                            `/emails/${email.id}`
                                        )
                                    }
                                >

                                    <div className="recent-avatar">

                                        {
                                            getInitial(
                                                email.sender
                                            )
                                        }

                                    </div>


                                    <div className="recent-info">

                                        <strong>
                                            {
                                                getSenderName(
                                                    email.sender
                                                )
                                            }
                                        </strong>

                                        <span>
                                            {
                                                email.subject ||
                                                "(Không có tiêu đề)"
                                            }
                                        </span>

                                    </div>


                                    <div className="recent-ai">

                                        <span>

                                            {
                                                getCategoryIcon(
                                                    email.category_name
                                                )
                                            }

                                            {" "}

                                            {
                                                email.category_name ||
                                                "Chưa phân loại"
                                            }

                                        </span>

                                        <small>
                                            AI{" "}
                                            {
                                                getConfidence(
                                                    email.confidence
                                                )
                                            }
                                        </small>

                                    </div>


                                    <div className="recent-date">

                                        {
                                            formatDate(
                                                email.created_at
                                            )
                                        }

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </section>


            {/* QUICK ACTIONS */}

            <section className="dashboard-card quick-card">

                <div className="card-header">

                    <div>

                        <h2>
                            Thao tác nhanh
                        </h2>

                        <p>
                            Truy cập nhanh các chức năng chính
                        </p>

                    </div>

                </div>


                <div className="quick-actions">

                    <button
                        onClick={() =>
                            navigate(
                                "/emails"
                            )
                        }
                    >
                        <span>
                            📥
                        </span>

                        <strong>
                            Hộp thư
                        </strong>

                        <small>
                            Xem tất cả email
                        </small>

                    </button>


                    <button
                        onClick={() =>
                            navigate(
                                "/emails/new"
                            )
                        }
                    >
                        <span>
                            ✏️
                        </span>

                        <strong>
                            Soạn thư
                        </strong>

                        <small>
                            Gửi email Gmail
                        </small>

                    </button>


                    <button
                        onClick={() =>
                            navigate(
                                "/emails"
                            )
                        }
                    >
                        <span>
                            🤖
                        </span>

                        <strong>
                            Phân loại AI
                        </strong>

                        <small>
                            Xem kết quả AI
                        </small>

                    </button>


                    <button
                        onClick={
                            loadDashboard
                        }
                    >
                        <span>
                            🔄
                        </span>

                        <strong>
                            Đồng bộ
                        </strong>

                        <small>
                            Cập nhật dữ liệu
                        </small>

                    </button>

                </div>

            </section>

        </div>
    );
}


/* STAT */

function StatCard({
    icon,
    title,
    value,
    description
}) {

    return (

        <div className="stat-card">

            <div className="stat-icon">
                {icon}
            </div>

            <div className="stat-content">

                <span>
                    {title}
                </span>

                <strong>
                    {value}
                </strong>

                <small>
                    {description}
                </small>

            </div>

        </div>
    );
}


/* HEALTH */

function HealthRow({
    name,
    status
}) {

    const online =
        status?.status ===
        "online";


    return (

        <div className="health-row">

            <div className="health-name">

                <span
                    className={
                        online
                            ? "health-dot online"
                            : "health-dot"
                    }
                />

                <strong>
                    {name}
                </strong>

            </div>


            <span
                className={
                    online
                        ? "health-status online-text"
                        : "health-status"
                }
            >

                {online
                    ? "● Online"
                    : "● Offline"}

            </span>

        </div>
    );
}


function getInitial(
    sender
) {

    if (!sender) {
        return "AI";
    }

    const name =
        getSenderName(
            sender
        );

    return name
        .substring(0, 1)
        .toUpperCase();
}


function getSenderName(
    sender
) {

    if (!sender) {
        return "Không rõ";
    }

    return String(sender)
        .replace(
            /<[^>]+>/g,
            ""
        )
        .replace(
            /^"|"$/g,
            ""
        )
        .trim() ||
        "Không rõ";
}


export default Dashboard;