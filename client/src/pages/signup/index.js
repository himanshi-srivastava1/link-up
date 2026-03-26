import React, { useState } from "react";
import { signupuser } from '../../apicalls/auth.js';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { showLoader, hideLoader } from "../../redux/loaderSlice.js";
import { sendOtpApiSignUp } from "../../apicalls/auth.js";

function Signup() {
    const dispatch = useDispatch();
    const navigate=useNavigate();
    const [step, setStep] = useState(1);
    const [user, setUser] = useState({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        otp: "",
    });
    async function onSubmitEmail(event) {
        event.preventDefault();
        try {
            dispatch(showLoader());
            const response = await sendOtpApiSignUp(user.email);
            if (response.success) {
                toast.success(response.message);
                setStep(2);
            } else {
                toast.error(response.message);
            }
            dispatch(hideLoader());
        } catch (error) {
            dispatch(hideLoader());
            toast.error(error.message);
        }
    }
    async function onFormSubmit(event) {
        event.preventDefault();
        let response = null;
        try {
            dispatch(showLoader());
            response = await signupuser(user);
            if (response.success) {
                toast.success(response.message);
                navigate("/login");
            }
            else {
                toast.error(response.message);
            }
            dispatch(hideLoader());
        }
        catch (err) {
            console.log(err);
            toast.error(err.message);
        };
    }
    return (
        <div className="container">
            <div className="container-back-img"></div>
            <div className="container-back-color"></div>
            <div className="card">
                <div className="card_title">
                    <h2>{step == 1 ? "Enter your Email" : "Create your Account"}</h2>
                </div>
                {step == 1 ?
                    <div className="form">
                        <form onSubmit={onSubmitEmail}>
                            <input type="email" placeholder="Email" value={user.email}
                                onChange={(e) => setUser({ ...user, email: e.target.value })}></input>
                            <button className="signup_button">Send OTP</button>
                        </form>
                    </div> :
                    <div className="form">
                        <form onSubmit={onFormSubmit}>
                            <input type="email" placeholder="Email" value={user.email} className="hidden"></input>
                            <input type="text" placeholder="6-digit OTP" value={user.otp}
                                onChange={(e) => setUser({ ...user, otp: e.target.value })}></input>

                            <div className="column">
                                <input type="text" placeholder="First Name" value={user.firstname}
                                    onChange={(e) => setUser({ ...user, firstname: e.target.value })}></input>
                                <input type="text" placeholder="Last Name" value={user.lastname}
                                    onChange={(e) => setUser({ ...user, lastname: e.target.value })}></input>
                            </div>
                            <input type="password" placeholder="Password" value={user.password}
                                onChange={(e) => setUser({ ...user, password: e.target.value })}></input>
                            <button className="signup_button">Sign Up</button>
                        </form>
                    </div>
                }
                <div className="card_terms">
                    <span>Do you already have an account?
                        <Link to="/login"> Sign In</Link>
                    </span>
                </div>
            </div>
        </div>
    )
}
export default Signup;