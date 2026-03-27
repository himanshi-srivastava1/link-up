import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getCurrentUser, refreshToken } from "../apicalls/auth.js";
import { getAllUsers } from "../apicalls/users.js";
import { getAllChats } from "../apicalls/chat.js";
import { useChatContext } from "../context/ChatContext";
import Loader from './loader.js';

function ProtectedRoute({ children }) {
   const { user, loading, setUser, setAllUsers, setAllChats } = useChatContext();
   const navigate = useNavigate();

   const getLoggedInUser = async () => {
      let response = null;
      try {
         response = await getCurrentUser();
         
         if (response.success) {
            setUser(response.data);
         } else {
            // Try to refresh token
            const refreshResponse = await refreshToken();
            if (refreshResponse.success) {
                // Retry getting user with new token
                const retryResponse = await getCurrentUser();
                if (retryResponse.success) {
                    setUser(retryResponse.data);
                } else {
                    toast.error("Session expired. Please login again.");
                    navigate("/login");
                }
            } else {
                toast.error(response.message || "Please login to continue.");
                navigate("/login");
            }
         }
      } catch (error) {
         toast.error("Session expired. Please login again.");
         navigate("/login");
      } finally {
         // setLoading(false);
      }
   };

   const getAllOtherUsers = async () => {
      let response = null;
      try {
         response = await getAllUsers();
         
         if (response.success) {
            setAllUsers(response.data);
         } else {
            toast.error(response.message);
         }
      } catch (error) {
         toast.error("Failed to load users");
      } finally {
         // setLoading(false);
      }
   };

   const getAllUserChats = async () => {
      let response = null;
      try {
         response = await getAllChats();
         
         if (response.success) {
            setAllChats(response.data);
         } else {
            toast.error(response.message);
         }
      } catch (error) {
         toast.error("Failed to load chats");
      } finally {
         // setLoading(false);
      }
   };

   useEffect(() => {
      if (localStorage.getItem('token')) {
         getLoggedInUser();
         getAllOtherUsers();
         getAllUserChats();
      } else {
         navigate("/login");
      }
   }, []);

   if (localStorage.getItem('token')) {
      if (!user) {
         return <Loader />;
      }
      return <div>{children}</div>;
   }

   return null;
}

export default ProtectedRoute;