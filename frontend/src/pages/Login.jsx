import {
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import api from "../services/api";

function Login() {

    const navigate = useNavigate();

    const [form, setForm] =
        useState({
            email: "",
            password: ""
        });

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleChange = (event) => {

        setForm({
            ...form,
            [event.target.name]:
                event.target.value
        });
    };

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response =
                await api.post(
                    "/auth/login",
                    {
                        email:
                            form.email.trim(),
                        password:
                            form.password
                    }
                );

            localStorage.setItem(
                "secretToken",
                response.data.secretToken
            );

            localStorage.setItem(
                "refreshToken",
                response.data.refreshToken
            );

            localStorage.setItem(
                "user",
                JSON.stringify(
                    response.data.user
                )
            );

            navigate(
                "/dashboard",
                {
                    replace: true
                }
            );

        } catch (error) {

            setError(
                error.response?.data?.message ||
                "Đăng nhập thất bại"
            );

        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-logo">
                    AI
                </div>

                <h1>
                    AI Email
                </h1>

                <p className="auth-subtitle">
                    Đăng nhập vào hệ thống
                </p>

                <form
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={
                                form.email
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Nhập email"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            Mật khẩu
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={
                                form.password
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Nhập mật khẩu"
                            required
                        />

                    </div>

                    {error && (

                        <div className="form-error">
                            ⚠️ {error}
                        </div>

                    )}

                    <button
                        type="submit"
                        className="primary-button auth-button"
                        disabled={
                            loading
                        }
                    >

                        {loading
                            ? "Đang đăng nhập..."
                            : "Đăng nhập"
                        }

                    </button>

                </form>

                <p className="auth-footer">

                    Chưa có tài khoản?{" "}

                    <Link
                        to="/register"
                    >
                        Đăng ký
                    </Link>

                </p>

            </div>

        </div>
    );
}

export default Login;