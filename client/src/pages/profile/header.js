import { useNavigate } from "react-router-dom";

import { useChatContext } from "../../context/ChatContext";

function Header({profileImg}) {
    const { user } = useChatContext();
    const navigate = useNavigate();
    function getinitials() {
        let fname = user?.firstname?.toUpperCase()?.charAt(0) || '';
        let lname = user?.lastname?.toUpperCase()?.charAt(0) || '';
        let name = fname + lname;
        return name || 'U';
    }
    function getfullname() {
        let fname = user?.firstname || '';
        let lname = user?.lastname || '';
        let name = (fname + ' ' + lname).trim();
        return name || 'Unknown User';
    }
    return (
        <div className="app-header">
            <div className='packed-logo'>
                <div className="back-logo">
                    <a href='/' className="back-button">
                        <i className="fa-solid fa-arrow-left" ></i>
                    </a>
                </div>
                <div className="app-logo">
                    <i className="fa fa-comments" aria-hidden="true"></i>
                    Link Up
                </div>
            </div>
            <div className="app-user-profile">
                <div className="logged-user-name" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${user._id || user.id}`)}>{getfullname()}</div>
                {profileImg && <img src={profileImg} alt='PP' onClick={() => navigate(`/profile/${user._id || user.id}`)} style={{ cursor: 'pointer' }} className="logged-user-profile-pic"/>}
                {!profileImg && <div className="logged-user-profile-pic" onClick={() => navigate(`/profile/${user._id || user.id}`)} style={{ cursor: 'pointer' }}>{getinitials()}</div>}
                <i className="fa fa-sign-out logout-btn" title="Logout" aria-hidden="true" onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }}></i>
            </div>
        </div>
    );
}

export default Header;