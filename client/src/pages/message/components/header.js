import { useSelector } from "react-redux";
function Header() {
    const {user}=useSelector(state=>state.userReducer);
    function getinitials(){
        let fname=user?.firstname.toUpperCase().charAt(0);
        let lname=user?.lastname.toUpperCase().charAt(0);
        let name=fname+lname;
        return name;
    }
    function getfullname(){
        let fname=user?.firstname;
        let lname=user?.lastname;
        let name=fname+' '+lname;
        return name;
    }
    return (
        <div className="message-header">
            <div className="app-logo">
                <i className="fa fa-comments" aria-hidden="true"></i>
                Link Up
            </div>
            <div className="app-user-profile">
                <div className="logged-user-name">{getfullname()}</div>
                <div className="logged-user-profile-pic">{getinitials()}</div>
            </div>
        </div>
    );
}
export default Header;