import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { hideLoader, showLoader } from "../../redux/loaderSlice.js";
import { sendOtpApi, resetPasswordApi } from "../../apicalls/auth.js";

function ForgotPassword() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [user, setUser] = useState({
        email: "",
        password: "",
        otp: ""
    });

    async function onFormSubmit(event) {
        event.preventDefault();
        try {
            dispatch(showLoader());
            const response = await sendOtpApi(user.email);
            dispatch(hideLoader());
            if (response.success) {
                toast.success(response.message);
                setStep(2);
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            dispatch(hideLoader());
            toast.error(error.message);
        }
    }

    async function onResetSubmit(event) {
        event.preventDefault();
        try {
            dispatch(showLoader());
            const response = await resetPasswordApi(user);
            dispatch(hideLoader());
            if (response.success) {
                toast.success(response.message);
                navigate("/login");
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            dispatch(hideLoader());
            toast.error(error.message);
        }
    }

    return (
        <div className="container">
            <div className="container-back-img"></div>
            <div className="container-back-color"></div>
            <div className="card">
                <div className="card_title">
                    <h2>{step === 1 ? "Forgot Password" : "Reset Password"}</h2>
                </div>
                <div className="form">
                    {step === 1 ? (
                        <form onSubmit={onFormSubmit}>
                            <input type="email" placeholder="Email" value={user.email}
                                onChange={(e) => setUser({ ...user, email: e.target.value })}></input>
                            <button className="signup_button">Send OTP</button>
                        </form>
                    ) : (
                        <form onSubmit={onResetSubmit}>
                            <input type="text" placeholder="6-digit OTP" value={user.otp}
                                onChange={(e) => setUser({ ...user, otp: e.target.value })}></input>
                            <input type="password" placeholder="New Password" value={user.password}
                                onChange={(e) => setUser({ ...user, password: e.target.value })}></input>
                            <button className="signup_button">Reset Password</button>
                        </form>
                    )}
                </div>
                <div className="card_terms">
                    <span>Don't have an account yet?
                        <Link to="/signup"> Sign Up</Link>
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword;