import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {toast} from "react-hot-toast";
import { getLoggedUser, getAllUsers} from "../apicalls/users.js";
import { getAllChats } from "../apicalls/chat.js";
import { useDispatch, useSelector } from "react-redux";
import { hideLoader, showLoader } from "../redux/loaderSlice.js";
import { setUser, setAllUsers, setAllChats } from "../redux/userSlice.js";
import Loader from './loader.js';

function ProtectedRoute({ children }) {
   const {user, allChats}=useSelector(state=>state.userReducer);
   const navigate = useNavigate();
   const dispatch = useDispatch();

   const getLoggedInUser = async () => {
      let response = null;
      try {
         dispatch(showLoader());
         response = await getLoggedUser();
         dispatch(hideLoader());
         if (response.success) {
            dispatch(setUser(response.data));
         }
         else {
            toast.error(response.message);
            navigate("/login");
         }
      }
      catch(error) {
         toast.error(error.message);
         dispatch(hideLoader());
         navigate("/login");
      }
   };

   const getAllOtherUsers = async () => {
      let response = null;
      try {
         dispatch(showLoader());
         response = await getAllUsers();
         dispatch(hideLoader());
         if (response.success) {
            dispatch(setAllUsers(response.data));
         }
         else {
            toast.error(response.message);
            navigate("/login");
         }
      }
      catch(error) {
         toast.error(error.message);
         dispatch(hideLoader());
         navigate("/login");
      }
   };
   const getUsAllChats = async () => {
      let response = null;
      try {
         dispatch(showLoader());
         response = await getAllChats();
         dispatch(hideLoader());
         if (response.success) {
            dispatch(setAllChats(response.data));
         }
         else {
            toast.error(response.message);
            navigate("/login");
         }
      }
      catch(error) {
         toast.error(error.message);
         dispatch(hideLoader());
         navigate("/login");
      }
   };
   useEffect(() => {
      if (localStorage.getItem('token')) {
         //get the details of current user
         getLoggedInUser();
         getAllOtherUsers();
         getUsAllChats();
      }
      else {
         navigate("/login");
      }
   },[]);
   if (localStorage.getItem('token')) {
       if (!user || allChats.length === 0) {
            return <Loader />;
       }
       return <div>{children}</div>;
   }

   return null;
}
export default ProtectedRoute;