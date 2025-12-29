import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { createNewChat } from "../../../apicalls/chat";
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import { setAllChats, setSelectedChat, setSelectedUser } from "../../../redux/userSlice";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { useEffect, useState } from "react";
import store from "../../../redux/store";

function UsersList({ searchKey, socket, onlineUser }) {
    const { allUsers, allChats, user: currentUser, selectedUser, selectedChat } = useSelector(state => state.userReducer);
    const [typingUsers, setTypingUsers] = useState({});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const startNewChat = async (searchedUser) => {
        try {
            dispatch(showLoader());
            const response = await createNewChat([currentUser._id, searchedUser._id]);
            dispatch(hideLoader());
            if (response.success) {
                toast.success(response.message);
                const newChat = response.data;
                const updatedChats = [...allChats, newChat];
                dispatch(setAllChats(updatedChats));
                dispatch(setSelectedChat(newChat));
                dispatch(setSelectedUser(searchedUser));
                navigate(`/message/${newChat._id}`);
            }
            else {
                toast.error(response.message);
            }
        }
        catch (err) {
            toast.error(err.message);
            dispatch(hideLoader());
        };
    }
    const openChat = async (selectedUser) => {
        const chat = await allChats.find(chat => chat.members.map(m => m._id).includes(selectedUser._id) && chat.members.map(m => m._id).includes(currentUser._id));
        if (chat) {
            dispatch(setSelectedChat(chat));
            dispatch(setSelectedUser(selectedUser));
            navigate(`/message/${chat._id}`);
        }
    }
    const getLastMessage = (userId) => {
        const chat = allChats.find(chat => chat.members.map(m => m._id).includes(userId));
        if (!chat) return '';
        else if (!(chat?.lastMessage)) {
            return '';
        }
        else {
            const pretext = chat?.lastMessage?.sender === currentUser._id ? "You: " : "";
            return pretext + chat?.lastMessage?.text?.substring(0, 31);
        }
    }
    const getLastMessageTimestamp = (userId) => {
        const chat = allChats.find(chat => chat.members.map(m => m._id).includes(userId));
        if (!chat || !(chat?.lastMessage)) return '';
        else {
            return moment(chat?.lastMessage?.createdAt).format('hh:mm A');
        }
    }
    const formatName = (user) => {
        let fname = user.firstname?.at(0).toUpperCase() + user.firstname?.slice(1).toLowerCase();
        let lname = user.lastname?.at(0).toUpperCase() + user.lastname?.slice(1).toLowerCase();
        return fname + ' ' + lname;
    }
    useEffect(() => {
        if (!socket) return;
        const handleReceiveMessage = (message) => {
            const selectedChat = store.getState().userReducer.selectedChat;
            const allChats = store.getState().userReducer.allChats;
            if (selectedChat?._id !== message.chatId) {
                const updatedChats = allChats.map(chat => {
                    if (chat._id === message.chatId) {
                        return {
                            ...chat,
                            unreadMessageCount: (chat?.unreadMessageCount || 0) + 1,
                            lastMessage: message
                        };
                    }
                    else return chat;
                });
                updatedChats.sort((a, b) => {
                    const dateA = new Date(a.lastMessage?.createdAt || 0);
                    const dateB = new Date(b.lastMessage?.createdAt || 0);
                    return dateB - dateA;
                });
                dispatch(setAllChats(updatedChats));
            }
        };
        socket.on('receive-message', handleReceiveMessage);
        return () => {
            socket.off('receive-message', handleReceiveMessage);
        };
    }, [socket, dispatch])
    const getUnreadMessageCount = (userId) => {
        const chat = allChats.find(chat => chat.members.map(m => m._id).includes(userId));
        if (chat && chat.unreadMessageCount) {
            if (chat.lastMessage?.sender !== currentUser._id)
                return chat.unreadMessageCount;
            return "";
        }
        else
            return "";
    }
    function getData() {
        if (searchKey === "") return allChats;
        else {
            return allUsers
                .filter(user => {
                    const search = searchKey?.toLowerCase() || "";
                    const fname = user.firstname?.toLowerCase() || "";
                    const lname = user.lastname?.toLowerCase() || "";
                    return (fname.includes(search) || lname.includes(search))
                });
        }
    }
    useEffect(() => {
        let timers = {};
        const handleTyping = (data) => {
            if (currentUser._id !== data.sender) {
                const chat_id = data.chatId;
                setTypingUsers((prev) => ({
                    ...prev,
                    [chat_id]: true
                }));
                if (timers[chat_id]) {
                    clearTimeout(timers[chat_id]);
                }
                timers[chat_id] = setTimeout(() => {
                    setTypingUsers((prev) => {
                        const newState = { ...prev };
                        delete newState[chat_id];
                        return newState;
                    });
                    delete timers[chat_id];
                }, 1600);
            }
        }
        socket.on('started-typing', handleTyping);
        return () => {
            socket.off('started-typing', handleTyping);
            Object.values(timers).forEach(timer => clearTimeout(timer));
        };
    }, [socket, currentUser._id]);
    return (
        getData()
            .map((obj) => {
                let user = obj;
                let currentChatId = null;
                if (obj.members) {
                    user = obj.members.find(m => m._id !== currentUser._id);
                    currentChatId = obj._id;
                } else {
                    const existingChat = allChats.find(chat =>
                        chat.members.map(m => m._id).includes(user._id));
                    currentChatId = existingChat?._id;
                }
                return (
                    <div className="user-on-filter" onClick={() => openChat(user)} key={user._id}>
                       {onlineUser.includes(user._id) && <div className="online-bubble"></div> }
                        <div className="user-search-filter" >
                            <div className="filtered-user">
                                <div className="filter-user-display">
                                    {user.profilePic &&
                                        <img src={user.profilePic} alt="Profile Pic" class="user-profile-image"></img>
                                    }
                                    {!user.profilePic &&
                                        <div className="user-default-profile-pic">
                                            {user.firstname?.charAt(0).toUpperCase() + user.lastname?.charAt(0).toUpperCase()}
                                        </div>
                                    }
                                    <div className="filter-user-details">
                                        <div className="user-display-name">{formatName(user)}</div>
                                        {
                                            typingUsers[currentChatId] && <div className="typing-indicator"><i>typing...</i></div>
                                        }
                                        {
                                            !typingUsers[currentChatId] && <div className="user-display-email">{getLastMessage(user._id) || user.email}</div>
                                        }
                                    </div>
                                    <div>
                                        <div className="last-message-timestamp">
                                            {getLastMessageTimestamp(user._id)}
                                        </div>
                                        {
                                            getUnreadMessageCount(user._id) !== "" &&
                                            <div className="unread-message-count">{getUnreadMessageCount(user._id)}</div>
                                        }
                                    </div>
                                    {
                                        !allChats.find(chat => chat.members.map(m => m._id).includes(user._id)) &&
                                        <div className="user-start-chat">
                                            <button className="user-start-chat-btn" onClick={() => startNewChat(user)}>Start Chat</button>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>)
            })
    )
}
export default UsersList;