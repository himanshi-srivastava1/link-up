import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useChatContext } from "../../context/ChatContext";
import { changePassword } from '../../apicalls/auth.js';

function ChangePassword() {
    const navigate = useNavigate();
    const { setLoading, user } = useChatContext();
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        try {
            setLoading(true);
            const response = await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword
            });

            if (response.success) {
                toast.success(response.message);
                navigate(`/profile/${user?._id || user?.id}`);
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="container-back-img"></div>
            <div className="container-back-color"></div>
            <div className="card">
                <div className="card_title">
                    <h2>Change Password</h2>
                </div>
                <div className="form">
                    <form onSubmit={handleSubmit}>
                        <input
                            type="password"
                            name="currentPassword"
                            placeholder="Current Password"
                            value={passwordData.currentPassword}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="password"
                            name="newPassword"
                            placeholder="New Password"
                            value={passwordData.newPassword}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm New Password"
                            value={passwordData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
                            Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character
                        </p>
                        <button className="signup_button">Change Password</button>
                    </form>
                </div>
                <div className="card_terms">
                    <span>
                        <a href="#" onClick={() => navigate(-1)}>Back</a>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ChangePassword;
