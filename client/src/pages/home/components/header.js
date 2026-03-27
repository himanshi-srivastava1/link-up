import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../../apicalls/auth.js";
import { useChatContext } from "../../../context/ChatContext";
import { toast } from "react-hot-toast";

function Header() {
    const { user, setUser } = useChatContext();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logoutUser();
            localStorage.removeItem('token');
            setUser(null);
            toast.success("Logged out successfully");
            navigate('/login');
        } catch (error) {
            // Even if logout API fails, clear local storage
            localStorage.removeItem('token');
            setUser(null);
            navigate('/login');
        }
    };

    function getinitials() {
        let fname = user?.firstname.toUpperCase().charAt(0);
        let lname = user?.lastname.toUpperCase().charAt(0);
        let name = fname + lname;
        return name;
    }

    function getfullname() {
        let fname = user?.firstname;
        let lname = user?.lastname;
        let name = fname + ' ' + lname;
        return name;
    }

    return (
        <div className="app-header">
            <div className="app-logo">
                <i className="fa fa-comments" aria-hidden="true"></i>
                Link Up
            </div>
            <div className="app-user-profile">
                <div className="logged-user-name" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/profile/${user._id || user.id}`}>{getfullname()}</div>
                {user?.profilePic && <img src={user.profilePic} alt="PP" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/profile/${user._id || user.id}`} className="logged-user-profile-pic"></img>}
                {!user?.profilePic && <div className="logged-user-profile-pic" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/profile/${user._id || user.id}`}>{getinitials()}</div>}
                <i className="fa fa-sign-out logout-btn" title="Logout" aria-hidden="true" onClick={handleLogout}></i>
            </div>
        </div>
    );
}

export default Header;