import React, { useState } from "react";
import { registerUser } from '../../apicalls/auth.js';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import { useChatContext } from "../../context/ChatContext";

function Signup() {
    const { setLoading } = useChatContext();
    const navigate = useNavigate();
    const [user, setUser] = useState({
        firstname: "",
        lastname: "",
        email: "",
        password: ""
    });

    async function onFormSubmit(event) {
        event.preventDefault();
        let response = null;
        try {
            setLoading(true);
            response = await registerUser(user);
            
            if (response.success) {
                toast.success(response.message);
                navigate("/login");
            }
            else {
                toast.error(response.message);
            }
        }
        catch (err) {
            console.log(err);
            toast.error(err.message || "Registration failed. Please try again.");
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className="container">
            <div className="container-back-img"></div>
            <div className="container-back-color"></div>
            <div className="card">
                <div className="card_title">
                    <h2>Create your Account</h2>
                </div>
                <div className="form">
                    <form onSubmit={onFormSubmit}>
                        <div className="column">
                            <input type="text" placeholder="First Name" value={user.firstname}
                                onChange={(e) => setUser({ ...user, firstname: e.target.value })}></input>
                            <input type="text" placeholder="Last Name" value={user.lastname}
                                onChange={(e) => setUser({ ...user, lastname: e.target.value })}></input>
                        </div>
                        <input type="email" placeholder="Email" value={user.email}
                            onChange={(e) => setUser({ ...user, email: e.target.value })}></input>
                        <input type="password" placeholder="Password" value={user.password}
                            onChange={(e) => setUser({ ...user, password: e.target.value })}></input>
                        <button className="signup_button">Sign Up</button>
                    </form>
                </div>
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