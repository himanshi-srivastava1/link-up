import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import image from "./index.js";
function Header({profileImg}) {
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
                <div className="logged-user-name">{getfullname()}</div>
                {profileImg && <img src={profileImg} alt='PP' className="logged-user-profile-pic"/>}
                {!profileImg && <div className="logged-user-profile-pic">{getinitials()}</div>}
                <i className="fa fa-sign-out logout-btn" title="Logout" aria-hidden="true" onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }}></i>
            </div>
        </div>
    );
}
export default Header;