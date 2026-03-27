import React, { useState } from "react";
import { loginuser } from '../../apicalls/auth.js';
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useChatContext } from "../../context/ChatContext";

function Login() {
    const { setUser } = useChatContext();
    const [user, setUserState] = useState({
        email: "",
        password: ""
    });

    async function onFormSubmit(event) {
        event.preventDefault();
        let response = null;
        try {
            response = await loginuser(user);
            
            if (response.success) {
                toast.success(response.message);
                // Store access token
                localStorage.setItem('token', response.data.accessToken);
                // Store user data in Context
                setUser(response.data.user);
                window.location.href = "/";
            }
            else if (response.requiresVerification) {
                // Handle email verification required
                toast.error(response.message);
                // Show verification UI or redirect to verification page
                if (response.email) {
                    // You could show a modal or redirect
                    alert(`Please check your email for verification link: ${response.email}`);
                    // Or redirect to verification page
                    // window.location.href = `/verify-email?email=${encodeURIComponent(response.email)}`;
                }
            }
            else {
                toast.error(response.message);
            }
        } catch (err) {
            console.log(err);
            toast.error(err.message || "Network error. Please try again.");
        }
    }

    return (
        <div className="container">
            <div className="container-back-img"></div>
            <div className="container-back-color"></div>
            <div className="card">
                <div className="card_title">
                    <h2>Sign in to your account</h2>
                </div>
                <div className="form">
                    <form onSubmit={onFormSubmit}>
                        <input type="email" placeholder="Email" value={user.email}
                            onChange={(e) => setUserState({ ...user, email: e.target.value })}></input>
                        <input type="password" placeholder="Password" value={user.password}
                            onChange={(e) => setUserState({ ...user, password: e.target.value })}></input>
                        <button className="signup_button">Sign In</button>
                    </form>
                </div>
                <div className="card_links">
                    <Link to="/forgot_pass">Forgot Password? </Link>
                </div>
                <div className="card_terms">
                    <span>Don't have an account yet?
                        <Link to="/signup"> Sign Up</Link>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Login;