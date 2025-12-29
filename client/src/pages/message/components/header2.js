import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { setSelectedUser, setSelectedChat } from "../../../redux/userSlice";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import moment from "moment";
function Header2({ socket, onlineUser }) {
    const [isTyping, setIsTyping] = useState(false);
    const [lastSeen, setLastSeen] = useState({});
    const { allUsers, allChats, selectedChat, selectedUser, user } = useSelector(state => state.userReducer);
    const { id } = useParams();
    function MessagePage() {
        const dispatch = useDispatch();
        const { allChats, selectedChat } = useSelector(state => state.userReducer);
        const navigate = useNavigate();
        useEffect(() => {
            if (!selectedChat && allChats.length > 0) {
                dispatch(showLoader());
                const chatToRestore = allChats.find(u => u._id === id);
                if (chatToRestore) {
                    dispatch(setSelectedChat(chatToRestore));
                    dispatch(hideLoader());
                }
                else {
                    toast.error("Invalid chat ");
                    dispatch(hideLoader())
                    navigate("/");
                }
            }
        }, [id, allChats, selectedChat, dispatch]);
        useEffect(() => {
            const chatToRestore = allChats.find(u => u._id === id);
            if (chatToRestore) {
                const id2 = chatToRestore.members.map(m => m._id).find(i => i !== user._id);
                const userToRestore = allUsers.find(u => u._id === id2);
                if (userToRestore) {
                    dispatch(setSelectedUser(userToRestore));
                    dispatch(hideLoader());
                }
                else {
                    toast.error("Invalid user");
                    dispatch(hideLoader())
                    navigate("/");
                }
            }
            else {
                toast.error("Invalid chat ");
                dispatch(hideLoader())
                navigate("/");
            }

        }, [id, allUsers, selectedUser, allChats, dispatch]);
    }
    useEffect(() => {
        let timer;
        const handleTyping = (data) => {
            if (id === data.chatId && user._id !== data.sender) {
                setIsTyping(true);
                clearTimeout(timer);
                timer = setTimeout(() => {
                    setIsTyping(false);
                }, 1600);
            }
        }
        socket.on('started-typing', handleTyping);
        return () => {
            socket.off('started-typing', handleTyping);
        };
    }, [id, socket, user._id]);
    useEffect(() => {
        const handleLastSeen = (data) => {
            setLastSeen((prev) => ({
                ...prev,
                [data.userId]: data.lastSeen
            }));
        }
        socket.on('last-seen-update', handleLastSeen);
        return () => {
            socket.off('last-seen-update', handleLastSeen);
        };
    }, [socket, selectedUser?._id]);
    MessagePage();
    function getinitials() {
        let fname = selectedUser?.firstname.toUpperCase().charAt(0);
        let lname = selectedUser?.lastname.toUpperCase().charAt(0);
        let name = fname + lname;
        return name;
    }
    function getfullname() {
        let fname = selectedUser?.firstname;
        let lname = selectedUser?.lastname;
        let name = fname + ' ' + lname;
        return name;
    }
    const formatLastSeen = (timestamp) => {
        if (!timestamp) return "";

        const now = moment();
        const lastSeenDate = moment(timestamp);
        const diffInMinutes = now.diff(lastSeenDate, 'minutes');
        if (now.isSame(lastSeenDate, 'day')) {
            return `Last seen today at ${lastSeenDate.format('hh:mm A')}`;
        }
        if (now.subtract(1, 'days').isSame(lastSeenDate, 'day')) {
            return `Last seen yesterday at ${lastSeenDate.format('hh:mm A')}`;
        }
        return `Last seen on ${lastSeenDate.format('MMM D, hh:mm A')}`;
    };
    const expression="Last seen just now";
    return (
        <div className="chat-header">
            <div className="back-logo">
                <a href='/' className="back-button">
                    <i className="fa-solid fa-arrow-left" ></i>
                </a>
            </div>
            <div className="chat-user-profile">
                <div className="chat-user-profile-pic" style={onlineUser.includes(selectedUser?._id) ?
                    { border: "3px solid #21e666ff" }
                    : {}}>{getinitials()}
                </div>
                <div className="chat-user-name">{getfullname()}</div>
                {isTyping && <div className="typing">typing...</div>}
            </div>
            <div className="last-seen-update"><i>{(onlineUser.includes(selectedUser?._id) && expression) || formatLastSeen(lastSeen[selectedUser?._id]) || formatLastSeen(selectedUser?.lastSeen)}</i></div>
        </div>
    );
}

export default Header2;