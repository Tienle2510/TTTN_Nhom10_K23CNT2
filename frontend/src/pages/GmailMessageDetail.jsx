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


function GmailMessageDetail() {

    const navigate =
        useNavigate();

    const {
        messageId
    } = useParams();


    const [email, setEmail] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // =====================================================
    // LOAD EMAIL
    // =====================================================

    useEffect(
        () => {

            const loadEmail =
                async () => {

                    try {

                        setLoading(
                            true
                        );

                        setError("");

                        const response =
                            await api.get(
                                `/gmail/folder/message/${encodeURIComponent(
                                    messageId
                                )}`
                            );

                        const data =
                            response.data?.data ||
                            response.data;

                        setEmail(
                            data
                        );

                    } catch (error) {

                        console.error(
                            "LOAD GMAIL MESSAGE ERROR:",
                            error
                        );

                        setError(
                            error.response?.data?.message ||
                            "Không thể tải email Gmail."
                        );

                    } finally {

                        setLoading(
                            false
                        );

                    }

                };


            if (
                messageId
            ) {

                loadEmail();

            }

        },
        [
            messageId
        ]
    );


    // =====================================================
    // FORMAT DATE
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

                return dateValue;

            }

            return date.toLocaleString(
                "vi-VN",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div
                className="email-detail-page"
                style={{
                    padding: "40px",
                    textAlign: "center"
                }}
            >

                Đang tải email...

            </div>

        );

    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div
                className="email-detail-page"
                style={{
                    padding: "40px"
                }}
            >

                <button
                    onClick={() =>
                        navigate(
                            "/emails"
                        )
                    }
                >
                    ← Quay lại
                </button>

                <h3>
                    Không thể tải email
                </h3>

                <p>
                    {error}
                </p>

            </div>

        );

    }


    if (!email) {

        return null;

    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div
            className="email-detail-page"
            style={{
                minHeight:
                    "100vh",
                background:
                    "#f8f9fa"
            }}
        >

            {/* HEADER */}

            <div
                style={{
                    display:
                        "flex",

                    alignItems:
                        "center",

                    gap:
                        "12px",

                    padding:
                        "16px 24px",

                    background:
                        "#ffffff",

                    borderBottom:
                        "1px solid #e5e7eb"
                }}
            >

                <button
                    onClick={() =>
                        navigate(
                            "/emails"
                        )
                    }
                    style={{
                        border:
                            "none",

                        background:
                            "transparent",

                        cursor:
                            "pointer",

                        fontSize:
                            "20px"
                    }}
                >
                    ←
                </button>

                <strong>
                    Đã gửi
                </strong>

            </div>


            {/* EMAIL */}

            <div
                style={{
                    maxWidth:
                        "1000px",

                    margin:
                        "24px auto",

                    background:
                        "#ffffff",

                    borderRadius:
                        "12px",

                    padding:
                        "28px",

                    boxShadow:
                        "0 1px 4px rgba(0,0,0,.08)"
                }}
            >

                {/* SUBJECT */}

                <h1
                    style={{
                        marginTop:
                            0,

                        fontSize:
                            "24px"
                    }}
                >

                    {email.subject ||
                        "(Không có tiêu đề)"}

                </h1>


                {/* INFO */}

                <div
                    style={{
                        padding:
                            "16px 0",

                        borderBottom:
                            "1px solid #eee"
                    }}
                >

                    <div
                        style={{
                            marginBottom:
                                "8px"
                        }}
                    >

                        <strong>
                            Từ:
                        </strong>

                        {" "}

                        {email.sender ||
                            "Không rõ"}

                    </div>


                    <div
                        style={{
                            marginBottom:
                                "8px"
                        }}
                    >

                        <strong>
                            Đến:
                        </strong>

                        {" "}

                        {email.recipient ||
                            "Không rõ"}

                    </div>


                    {email.cc && (

                        <div
                            style={{
                                marginBottom:
                                    "8px"
                            }}
                        >

                            <strong>
                                Cc:
                            </strong>

                            {" "}

                            {email.cc}

                        </div>

                    )}


                    <div>

                        <strong>
                            Thời gian:
                        </strong>

                        {" "}

                        {formatDate(
                            email.date ||
                            email.internalDate
                        )}

                    </div>

                </div>


                {/* CONTENT */}

                <div
                    style={{
                        paddingTop:
                            "24px",

                        whiteSpace:
                            "pre-wrap",

                        lineHeight:
                            "1.7",

                        fontSize:
                            "15px"
                    }}
                >

                    {email.content ||
                        email.snippet ||
                        "Không có nội dung."}

                </div>


                {/* ACTIONS */}

                <div
                    style={{
                        display:
                            "flex",

                        gap:
                            "10px",

                        marginTop:
                            "30px",

                        paddingTop:
                            "20px",

                        borderTop:
                            "1px solid #eee"
                    }}
                >

                    <button
                        onClick={() =>
                            navigate(
                                "/emails"
                            )
                        }
                        style={{
                            padding:
                                "10px 18px",

                            border:
                                "1px solid #ddd",

                            borderRadius:
                                "8px",

                            background:
                                "#fff",

                            cursor:
                                "pointer"
                        }}
                    >
                        ← Quay lại
                    </button>

                </div>

            </div>

        </div>

    );

}


export default GmailMessageDetail;