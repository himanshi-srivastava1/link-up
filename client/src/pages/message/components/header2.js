import { useNavigate, useParams } from "react-router-dom";
import { useChatContext } from "../../../context/ChatContext";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import moment from "moment";
import Loader from "../../../components/loader";

function Header2({ socket, onlineUser }) {
    const [isTyping, setIsTyping] = useState(false);
    const [lastSeen, setLastSeen] = useState({});
    const { allUsers, allChats, selectedChat, selectedUser, user, setSelectedChat, setSelectedUser, setLoading } = useChatContext();
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!selectedChat && allChats.length > 0) {
            setLoading(true);
            const chatToRestore = allChats.find(u => String(u._id).trim() === String(id).trim());
            if (chatToRestore) {
                setSelectedChat(chatToRestore);
                setLoading(false);
            }
            else {
                console.error("Invalid chat in Header2 Restore");
                setLoading(false);
                // toast.error("Invalid chat");
                // navigate("/");
            }
        }
    }, [id, allChats, selectedChat, setSelectedChat, setLoading]);

    useEffect(() => {
        if (!allChats || allChats.length === 0 || !allUsers || allUsers.length === 0 || !user) {
            console.log("Waiting for data to load...");
            return;
        }
        console.log("Restoring user with data:", { allChats: allChats.length, allUsers: allUsers.length, userId: user._id, chatId: id });
        
        const chatToRestore = allChats.find(chat => String(chat._id).trim() === String(id).trim());
        if (chatToRestore) {
            // Find the other user in chat (not current user)
            const currentUserId = String(user._id || user.id);
            const otherMember = chatToRestore.members.find(member => {
                const memberId = typeof member === 'object' ? String(member._id || member.id) : String(member);
                return memberId !== currentUserId;
            });
            const otherUserId = typeof otherMember === 'object' ? String(otherMember._id || otherMember.id) : String(otherMember);
            
            if (selectedUser && String(selectedUser._id || selectedUser.id) === otherUserId) {
                setLoading(false);
                return;
            }

            const userToRestore = allUsers.find(u => String(u._id) === otherUserId);
            console.log("Found user to restore:", userToRestore);
            if (userToRestore) {
                setSelectedUser(userToRestore);
                setLoading(false);
            }
            else if (typeof otherMember === 'object' && otherMember.firstname) {
                setSelectedUser(otherMember);
                setLoading(false);
            }
            else {
                console.error("Other user not found in Header2 Restore. Available users:", allUsers);
                console.error("Looking for user ID:", otherUserId);
                // Try to restore from chat members as fallback
                const memberIdStr = typeof otherUserId === 'object' ? otherUserId._id || otherUserId.id || 'unknown' : String(otherUserId);
                const memberUser = {
                    _id: otherUserId,
                    firstname: "User",
                    lastname: `${memberIdStr.slice(-4)}` // Show last 4 chars as identifier
                };
                setSelectedUser(memberUser);
                setLoading(false);
            }
        }
        else {
            console.error("Invalid chat in Header2 Second Restore. Available chats:", allChats);
            console.error("Looking for chat ID:", id);
            setLoading(false);
        }
    }, [id, allUsers, selectedUser, allChats, setSelectedUser, user, setLoading]);

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
        };
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
        };
        socket.on('last-seen-update', handleLastSeen);
        return () => {
            socket.off('last-seen-update', handleLastSeen);
        };
    }, [socket, selectedUser?._id]);

    function getfullname() {
        if (!selectedUser) return <Loader />;
        let fname = selectedUser?.firstname || "";
        let lname = selectedUser?.lastname || "";
        if (!fname && !lname) return <Loader />;
        return fname.trim() + ' ' + lname.trim();
    }
    function getinitials() {
        if (!selectedUser) return "...";
        let fname = selectedUser?.firstname || "";
        let lname = selectedUser?.lastname || "";
        if (!fname && !lname) return "...";
        return (fname.charAt(0) || "") + (lname.charAt(0) || "");
    }

    const formatLastSeen = (timestamp) => {
        if (!timestamp) return ""
        
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
    const expression = "Last seen just now";
    return (
        <div className="chat-header">
            <div className="back-logo">
                <a href='/' className="back-button">
                    <i className="fa-solid fa-arrow-left" ></i>
                </a>
            </div>
            <div className="chat-user-profile">
                {selectedUser?.profilePic &&
                    <img src={selectedUser.profilePic} alt="PP" className="chat-user-profile-pic" style={onlineUser.includes(selectedUser?._id) ?
                        { border: "3px solid #21e666ff", cursor: 'pointer' }
                        : { cursor: 'pointer' }} onClick={() => window.location.href = `/profile/${selectedUser?._id || selectedUser?.id}`} />}
                {!selectedUser?.profilePic &&
                    <div className="chat-user-profile-pic" style={onlineUser.includes(selectedUser?._id) ?
                        { border: "3px solid #21e666ff", cursor: 'pointer' }
                        : { cursor: 'pointer' }} onClick={() => window.location.href = `/profile/${selectedUser?._id || selectedUser?.id}`}>{getinitials()}
                    </div>}
                <div className="chat-user-name" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/profile/${selectedUser?._id || selectedUser?.id}`}>{getfullname()}</div>
                {isTyping && <div className="typing">typing...</div>}
            </div>
            <div className="last-seen-update"><i>{(onlineUser.includes(selectedUser?._id) && expression) || formatLastSeen(lastSeen[selectedUser?._id]) || formatLastSeen(selectedUser?.lastSeen)}</i></div>
        </div>
    );
}

export default Header2;