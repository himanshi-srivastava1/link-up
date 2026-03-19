import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
function Header() {
    const { user } = useSelector(state => state.userReducer);
    const navigate = useNavigate();
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
                <div className="logged-user-name">{getfullname()}</div>
                {user?.profilePic && <img src={user.profilePic} alt="PP" onClick={() => navigate(`/profile/${user._id}`)} className="logged-user-profile-pic"></img>}
                {!user?.profilePic && <div className="logged-user-profile-pic" onClick={() => navigate(`/profile/${user._id}`)}>{getinitials()}</div>}

                <i className="fa fa-sign-out logout-btn" title="Logout" aria-hidden="true" onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }}></i>
            </div>
        </div>
    );
}
export default Header;