import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useChatContext } from "../../context/ChatContext";
import { forgotPassword, resetPassword } from "../../apicalls/auth.js";

function ForgotPassword() {
    const { setLoading } = useChatContext();
    const navigate = useNavigate();
    const { token: routeToken } = useParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [token, setToken] = useState("");
    const [isResetMode, setIsResetMode] = useState(false);

    async function onFormSubmit(event) {
        event.preventDefault();
        try {
            setLoading(true);
            const response = await forgotPassword(email);
            
            if (response.success) {
                // Check if token is returned (new flow) or email sent (old flow)
                if (response.data && response.data.resetToken) {
                    // New token-based flow
                    toast.success("Password reset token generated!");
                    setToken(response.data.resetToken);
                    setIsResetMode(true);
                } else {
                    // Fallback for old email flow
                    toast.success("Password reset link sent to your email!");
                }
                setEmail("");
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            toast.error(error.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    }

    async function onResetSubmit(event) {
        event.preventDefault();
        try {
            setLoading(true);
            const response = await resetPassword(token, password);
            
            if (response.success) {
                toast.success(response.message);
                navigate("/login");
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            toast.error(error.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    }

    // Check if we have a token in URL (user clicked reset link)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const resetToken = routeToken || urlParams.get('token');
        if (resetToken) {
            setToken(resetToken);
            setIsResetMode(true);
        }
    }, [routeToken]);

    return (
        <div className="container">
            <div className="container-back-img"></div>
            <div className="container-back-color"></div>
            <div className="card">
                <div className="card_title">
                    <h2>{!isResetMode ? "Forgot Password" : "Reset Password"}</h2>
                </div>
                <div className="form">
                    {!isResetMode ? (
                        <form onSubmit={onFormSubmit}>
                            <input 
                                type="email" 
                                placeholder="Enter your email address" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
                                We'll generate a password reset token for you
                            </p>
                            <button className="signup_button">Generate Reset Token</button>
                        </form>
                    ) : (
                        <form onSubmit={onResetSubmit}>
                            <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                                Enter your new password below
                            </p>
                            <input 
                                type="password" 
                                placeholder="Enter new password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button className="signup_button">Reset Password</button>
                        </form>
                    )}
                </div>
                <div className="card_terms">
                    <span>Remember your password?
                        <Link to="/login"> Back to Login</Link>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;