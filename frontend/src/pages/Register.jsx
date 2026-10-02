import {
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import api from "../services/api";

function Register() {

    const navigate = useNavigate();

    const [form, setForm] =
        useState({
            name: "",
            email: "",
            password: ""
        });

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
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
        setSuccess("");
        setLoading(true);

        try {

            await api.post(
                "/auth/register",
                {
                    name:
                        form.name.trim(),
                    email:
                        form.email.trim(),
                    password:
                        form.password
                }
            );

            setSuccess(
                "Đăng ký thành công. Đang chuyển đến trang đăng nhập..."
            );

            setTimeout(() => {

                navigate(
                    "/login"
                );

            }, 1000);

        } catch (error) {

            setError(
                error.response?.data?.message ||
                "Đăng ký thất bại"
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
                    Tạo tài khoản
                </h1>

                <p className="auth-subtitle">
                    Bắt đầu sử dụng AI Email
                </p>

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="form-group">

                        <label>
                            Họ và tên
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={
                                form.name
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Nguyễn Văn A"
                            required
                        />

                    </div>

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
                            placeholder="example@gmail.com"
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
                            placeholder="Ít nhất 6 ký tự"
                            minLength={6}
                            required
                        />

                    </div>

                    {error && (

                        <div className="form-error">
                            ⚠️ {error}
                        </div>

                    )}

                    {success && (

                        <div className="form-success">
                            ✓ {success}
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
                            ? "Đang tạo tài khoản..."
                            : "Đăng ký"
                        }

                    </button>

                </form>

                <p className="auth-footer">

                    Đã có tài khoản?{" "}

                    <Link
                        to="/login"
                    >
                        Đăng nhập
                    </Link>

                </p>

            </div>

        </div>
    );
}

export default Register;