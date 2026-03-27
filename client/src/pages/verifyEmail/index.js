import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../../apicalls/auth.js';
import { toast } from 'react-hot-toast';
import { useChatContext } from "../../context/ChatContext";

function VerifyEmail() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { setLoading } = useChatContext();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmailToken = async () => {
            try {
                setLoading(true);
                const response = await verifyEmail(token);
                
                if (response.success) {
                    setStatus('success');
                    setMessage(response.message);
                    toast.success(response.message);
                } else {
                    setStatus('error');
                    setMessage(response.message);
                    toast.error(response.message);
                }
            } catch (error) {
                setStatus('error');
                setMessage('Email verification failed. Please try again.');
                toast.error('Email verification failed. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            verifyEmailToken();
        } else {
            setStatus('error');
            setMessage('Invalid verification link.');
        }
    }, [token, setLoading]);

    return (
        <div className="container">
            <div className="container-back-img"></div>
            <div className="container-back-color"></div>
            <div className="card">
                <div className="card_title">
                    <h2>Email Verification</h2>
                </div>
                <div className="form" style={{ textAlign: 'center', padding: '20px' }}>
                    {status === 'verifying' && (
                        <div>
                            <div className="loading">Verifying your email...</div>
                        </div>
                    )}
                    
                    {status === 'success' && (
                        <div>
                            <div style={{ color: '#4CAF50', fontSize: '48px', marginBottom: '20px' }}>✓</div>
                            <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>Email Verified!</h3>
                            <p style={{ marginBottom: '20px' }}>{message}</p>
                            <Link to="/login">
                                <button className="signup_button">Proceed to Login</button>
                            </Link>
                        </div>
                    )}
                    
                    {status === 'error' && (
                        <div>
                            <div style={{ color: '#f44336', fontSize: '48px', marginBottom: '20px' }}>✗</div>
                            <h3 style={{ color: '#f44336', marginBottom: '10px' }}>Verification Failed</h3>
                            <p style={{ marginBottom: '20px' }}>{message}</p>
                            <div>
                                <Link to="/login">
                                    <button className="signup_button" style={{ marginRight: '10px' }}>Back to Login</button>
                                </Link>
                                <Link to="/signup">
                                    <button className="signup_button">Register Again</button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VerifyEmail;
