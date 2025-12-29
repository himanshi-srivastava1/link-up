import React, { useState } from "react";
import { loginuser } from '../../apicalls/auth.js';
import {Link} from "react-router-dom";
import {toast} from "react-hot-toast";
import { useDispatch } from "react-redux";
import { hideLoader, showLoader } from "../../redux/loaderSlice.js";
function Login(){
    const dispatch=useDispatch();
     const [user, setUser] = useState({
            email: "",
            password: ""
        });
        async function onFormSubmit(event){
                event.preventDefault();
                let response=null;
                try {
                    dispatch(showLoader());
                    response =await loginuser(user);
                    dispatch(hideLoader());
                    if(response.success){
                        toast.success(response.message);  
                        localStorage.setItem('token', response.token);
                        window.location.href="/";           
                    }
                    else{
                        dispatch(hideLoader());
                        console.log(response);
                        toast.error(response.message);
                    }
                }
                catch(err){
                    console.log(err);
                    toast.error(err.message);
                };
            }
    return(
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
                            onChange={(e) => setUser({ ...user, email: e.target.value })}></input>
                        <input type="password" placeholder="Password" value={user.password}
                            onChange={(e) => setUser({ ...user, password: e.target.value })}></input>
                        <button className="signup_button">Sign In</button>
                    </form>
                </div>
                <div className="card_terms">
                    <span>Don't have an account yet?
                        <Link to ="/signup"> Sign Up</Link>
                    </span>
                </div>
            </div>
        </div>
    )
}
export default Login;