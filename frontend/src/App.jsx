import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateEmail from "./pages/CreateEmail";
import EmailList from "./pages/EmailList";
import EmailDetail from "./pages/EmailDetail";
import GmailMessageDetail from "./pages/GmailMessageDetail";

import "./App.css";


function ProtectedRoute({ children }) {

    const token =
        localStorage.getItem("secretToken");

    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
}


function App() {

    return (
        <BrowserRouter>

            <Routes>

                {/* =========================
                    ROOT
                ========================= */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/emails"
                            replace
                        />
                    }
                />


                {/* =========================
                    AUTH
                ========================= */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* =========================
                    DASHBOARD
                ========================= */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    EMAIL LIST
                ========================= */}

                <Route
                    path="/emails"
                    element={
                        <ProtectedRoute>
                            <EmailList />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    CREATE EMAIL
                ========================= */}

                <Route
                    path="/emails/new"
                    element={
                        <ProtectedRoute>
                            <CreateEmail />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    DATABASE EMAIL DETAIL
                ========================= */}

                <Route
                    path="/emails/:id"
                    element={
                        <ProtectedRoute>
                            <EmailDetail />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    GMAIL MESSAGE DETAIL
                    SENT / DRAFT / TRASH
                ========================= */}

                <Route
                    path="/gmail/message/:messageId"
                    element={
                        <ProtectedRoute>
                            <GmailMessageDetail />
                        </ProtectedRoute>
                    }
                />


                {/* =========================
                    404
                ========================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/emails"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;