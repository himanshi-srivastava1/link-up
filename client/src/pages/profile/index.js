import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Header from './header.js';
import moment from "moment";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { uploadProfilePic } from "../../apicalls/users.js";
import { showLoader, hideLoader } from "../../redux/loaderSlice.js";
import { setUser } from "../../redux/userSlice.js";
function Profile() {
    const { id } = useParams();
    const [image, setImage]=useState('');
    const [filename,setFilename]=useState('No file chosen');
    const dispatch=useDispatch();
    const { allUsers, user } = useSelector(state => state.userReducer);
    let user1 = allUsers.find(u => u._id === id);
    user1 = id === user._id ? user : user1;
    useEffect(()=>{
         if(user?.profilePic){
            setImage(user.profilePic);
         }
    },[user1])
    function getfullname() {
        let fname = user1?.firstname;
        let lname = user1?.lastname;
        let name = fname + ' ' + lname;
        return name;
    }
    function getinitials() {
        let fname = user1?.firstname.toUpperCase().charAt(0);
        let lname = user1?.lastname.toUpperCase().charAt(0);
        let name = fname + lname;
        return name;
    }
    function getDate() {
        let t = moment(user1.createdAt).format('MMM DD, YYYY');
        return t;
    }
    const handleFileChange=async(e)=>{
        const file=e.target.files[0];
        const reader=new FileReader(file);
        reader.readAsDataURL(file);
        reader.onloadend=async()=>{
            setImage(reader.result);
            setFilename(file.name);
        }
    }
    const updateProfilePic=async()=>{
        try{
            dispatch(showLoader());
            const response=await uploadProfilePic(image);
            dispatch(hideLoader());
            if(response.success){
                toast.success(response.message);
                dispatch(setUser(response.data));
                setFilename('No file chosen');
            }else{
                toast.error(response.message);
            }
        }
        catch(err){
            toast.error(err.message);
            dispatch(hideLoader());
        };
    }
    return (
        <div className="profile-page">
            <Header profileImg={image}></Header>
            <div className="profile-page-container">
                <div className="profile-pic-container">
                    {image &&
                        <img src={image}
                            alt="Profile Pic"
                            class="user-profile-pic-upload"
                        />}
                    {!image &&
                        <div class="user-default-profile-avatar">
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
                    </div>
                    <div className="user-profile-created">
                        <b>Account Created: </b>{getDate()}
                    </div>
                    {
                        user._id===id &&
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