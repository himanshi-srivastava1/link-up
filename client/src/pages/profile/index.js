import { useNavigate, useParams } from "react-router-dom";
import Header from './header.js';
import moment from "moment";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { uploadProfilePic } from "../../apicalls/users.js";
import { useChatContext } from "../../context/ChatContext";
import { resendEmailVerification } from "../../apicalls/auth.js";
import { io } from "socket.io-client";
import Loader from "../../components/loader";

function Profile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [image, setImage] = useState('');
    const [filename, setFilename] = useState('No file chosen');
    const { allUsers, allChats, user, setUser, setLoading } = useChatContext();
    
    let user1 = null;
    if (String(id) === String(user?._id) || String(id) === String(user?.id)) {
        user1 = user;
    } else {
        user1 = allUsers?.find(u => String(u._id) === String(id) || String(u.id) === String(id));
        if (!user1 && allChats) {
            for (let chat of allChats) {
                const member = chat.members?.find(m => String(m._id) === String(id) || String(m.id) === String(id));
                if (member) {
                    user1 = member;
                    break;
                }
            }
        }
    }

    useEffect(() => {
        if (user1 && user1.profilePic) {
            setImage(user1.profilePic);
        } else {
            setImage('');
        }
    }, [user1]);

    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user) {
            const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            const newSocket = io(socketUrl, {
                transports: ["websocket", "polling"],
                auth: {
                    token: localStorage.getItem('token')
                }
            });

            newSocket.emit('join-room', user._id || user.id);
            newSocket.emit('user-login', user._id || user.id);

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [user]);

    if (!user1 || !user || !socket) {
        return (
            <div className="home-page">
                <Loader />
            </div>
        );
    }

    const handleResendVerification = async () => {
        try {
            setLoading(true);
            const response = await resendEmailVerification(user.email);
            
            if (response.success) {
                toast.success(response.message);
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to resend verification email');
        } finally {
            setLoading(false);
        }
    };

    function getfullname() {
        let fname = user1?.firstname || '';
        let lname = user1?.lastname || '';
        let name = (fname + ' ' + lname).trim();
        return name || 'Unknown User';
    }

    function getinitials() {
        let fname = user1?.firstname?.toUpperCase()?.charAt(0) || '';
        let lname = user1?.lastname?.toUpperCase()?.charAt(0) || '';
        let name = fname + lname;
        return name || 'U';
    }

    function getDate() {
        if (!user1?.createdAt) return 'Unknown';
        let t = moment(user1.createdAt).format('MMM DD, YYYY');
        return t;
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader(file);
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            setImage(reader.result);
            setFilename(file.name);
        }
    };

    const updateProfilePic = async () => {
        try {
            setLoading(true);
            const response = await uploadProfilePic(image);
            
            if (response.success) {
                toast.success(response.message);
                setUser(response.data);
                setFilename('No file chosen');
            } else {
                toast.error(response.message);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <Header profileImg={image}></Header>
            <div className="profile-page-container">
                <div className="profile-pic-container">
                    {image &&
                        <img src={image}
                            alt="Profile Pic"
                            className="user-profile-pic-upload"
                        />}
                    {!image &&
                        <div className="user-default-profile-avatar">
                            {getinitials()}
                        </div>
                    }
                </div>
                <div className="profile-info-container">
                    <div className="user-profile-name">
                        <h1>{getfullname()}</h1>
                    </div>
                    <div className="user-profile-email">
                        <b>Email: </b>{user1.email}
                        {(user?._id === id || user?.id === id) && user.isEmailVerified === false && (
                            <span style={{ marginLeft: '10px' }}>
                                <span style={{ color: '#ff6b6b' }}>Not Verified</span>
                                <button 
                                    onClick={handleResendVerification}
                                    style={{ 
                                        marginLeft: '10px', 
                                        padding: '4px 8px', 
                                        fontSize: '12px',
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Resend
                                </button>
                            </span>
                        )}
                        {(user?._id === id || user?.id === id) && user.isEmailVerified === true && (
                            <span style={{ marginLeft: '10px', color: '#4CAF50' }}>✓ Verified</span>
                        )}
                    </div>
                    <div className="user-profile-created">
                        <b>Account Created: </b>{getDate()}
                    </div>
                    {(user?._id === id || user?.id === id) && (
                        <div className="profile-actions" style={{ marginTop: '20px' }}>
                            <button 
                                onClick={() => navigate('/change-password')}
                                style={{ 
                                    padding: '8px 16px', 
                                    marginRight: '10px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Change Password
                            </button>
                        </div>
                    )}
                    {(user?._id === id || user?.id === id) &&
                        <div className="select-profile-pic-container">
                            <input type="file" id="file-upload"
                                style={{ display: 'none' }}
                                onChange={handleFileChange} />
                            <label htmlFor="file-upload" className="cyber-button">
                                Choose File
                            </label>
                            <span className="file-name-display" style={{ marginLeft: '15px', color: 'rgba(255,255,255,0.6)' }}>
                                {filename}
                            </span>
                            <button className="upload-profile-button" onClick={updateProfilePic}>Upload</button>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}

export default Profile;