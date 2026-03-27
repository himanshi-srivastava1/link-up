import { useNavigate } from "react-router-dom";
import { useChatContext } from "../../../context/ChatContext";
import toast from "react-hot-toast";
import { createNewChat } from "../../../apicalls/chat.js";
import { useEffect, useState } from "react";
import moment from "moment";

function UsersList({ searchKey, socket, onlineUser }) {
    const { allUsers, allChats, user, setAllChats, selectedChat, setSelectedChat, setSelectedUser, setLoading } = useChatContext();
    const [selectedUser, setSelectedUserLocal] = useState(null);
    const [typingUsers, setTypingUsers] = useState({});
    const navigate = useNavigate();

    // Debug logging
    console.log('🔍 UsersList Debug Info:');
    console.log('currentUser:', user);
    console.log('allUsers:', allUsers);
    console.log('allChats:', allChats);

    const startNewChat = async (searchedUser) => {
        try {
            setLoading(true);

            const response = await createNewChat([user?.id, searchedUser._id]);
            
            if (response.success) {
                toast.success(response.message);
                const newChat = response.data;
                const updatedChats = [...allChats, newChat];
                setAllChats(updatedChats);
                setSelectedChat(newChat);
                setSelectedUser(searchedUser);
                navigate(`/message/${newChat._id}`);
            }
            else {
                toast.error(response.message);
            }
        }
        catch (err) {
            toast.error(err.message);
        }
        finally {
            setLoading(false);
        }
    }
    const openChat = async (selectedUser) => {
        const chat = await allChats.find(chat => chat.members.map(m => m._id).includes(selectedUser._id) && chat.members.map(m => m._id).includes(user.id));
        if (chat) {
            setSelectedChat(chat);
            setSelectedUser(selectedUser);
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
            const senderId = chat.lastMessage?.sender?._id || chat.lastMessage?.sender?.id || chat.lastMessage?.sender;
            const pretext = senderId === user.id ? "You: " : "";
            const msgType = chat.lastMessage.messageType || chat.lastMessage.actualMessageType;
            
            if (msgType === 'image') {
                const imgStr = chat.lastMessage.content?.image || "";
                const isGif = imgStr.toLowerCase().includes('.gif') || imgStr.toLowerCase().includes('giphy') || imgStr.toLowerCase().includes('tenor');
                const isSticker = imgStr.toLowerCase().includes('.webp') || imgStr.toLowerCase().includes('sticker');
                
                if (isGif) {
                    return <span>{pretext}<i className="fa-solid fa-icons" style={{marginRight: "4px"}}></i>GIF</span>;
                }
                if (isSticker) {
                    return <span>{pretext}<i className="fa-solid fa-note-sticky" style={{marginRight: "4px"}}></i>Sticker</span>;
                }
                return <span>{pretext}<i className="fa-solid fa-image" style={{marginRight: "4px"}}></i>Photo</span>;
            } else if (msgType === 'video') {
                return <span>{pretext}<i className="fa-solid fa-video" style={{marginRight: "4px"}}></i>Video</span>;
            } else if (msgType === 'file') {
                return <span>{pretext}<i className="fa-solid fa-file" style={{marginRight: "4px"}}></i>File</span>;
            }
            
            const textContent = chat.lastMessage?.content?.text || chat.lastMessage?.text || "";
            return <span>{pretext}{textContent.substring(0, 31)}</span>;
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
            // Check if the incoming message is NOT for the currently active chat
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
                setAllChats(updatedChats);
            }
        };
        const handleMessageDeleted = (data) => {
            const updatedChats = allChats.map(chat => {
                if (chat._id === data.chatId) {
                    let updated = { ...chat };
                    if (data.wasUnread) {
                        updated.unreadMessageCount = Math.max((updated.unreadMessageCount || 0) - 1, 0);
                    }
                    if (data.newLastMessage !== undefined) {
                        updated.lastMessage = data.newLastMessage;
                    }
                    return updated;
                }
                return chat;
            });
            setAllChats(updatedChats);
        };
        const handleMessagesRead = (data) => {
            const updatedChats = allChats.map(chat => {
                if (chat._id === data.chatId) {
                    return {
                        ...chat,
                        unreadMessageCount: 0
                    };
                }
                return chat;
            });
            setAllChats(updatedChats);
        };
        socket.on('receive-message', handleReceiveMessage);
        socket.on('message-deleted-update', handleMessageDeleted);
        socket.on('messages-read', handleMessagesRead);
        return () => {
            socket.off('receive-message', handleReceiveMessage);
            socket.off('message-deleted-update', handleMessageDeleted);
            socket.off('messages-read', handleMessagesRead);
        };
    }, [socket, user, allChats, setAllChats, selectedChat])
    const getUnreadMessageCount = (userId) => {
        const chat = allChats.find(chat => chat.members.map(m => m._id).includes(userId));
        if (chat && chat.unreadMessageCount) {
            if (chat.lastMessage?.sender !== user.id)
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
                    // Filter out current user from the list
                    if (user && user._id === user.id) {
                        return false;
                    }
                    
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
            if (user.id !== data.sender) {
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
    }, [socket, user.id])
    return (
        <div>
            {getData()
                .map((obj) => {
                    let displayUser = obj;
                    let currentChatId = null;
                    if (obj.members) {
                        displayUser = obj.members.find(m => m._id !== user.id && m.id !== user.id);
                        currentChatId = obj._id;
                    } else {
                        const existingChat = allChats.find(chat =>
                            chat.members.map(m => m._id).includes(displayUser._id) && chat.members.map(m => m._id).includes(user.id));
                        currentChatId = existingChat?._id;
                    }
                    if (!displayUser) return null; // Safe guard
                    return (
                        <div className="user-on-filter" onClick={() => currentChatId ? openChat(displayUser) : startNewChat(displayUser)} key={displayUser._id}>
                            {onlineUser.includes(displayUser._id) && <div className="online-bubble"></div>}
                            <div className="user-search-filter" >
                                <div className="filtered-user">
                                    <div className="filter-user-display">
                                        {displayUser.profilePic &&
                                            <img src={displayUser.profilePic} alt="Profile Pic" className="user-profile-image"></img>
                                        }
                                        {!displayUser.profilePic &&
                                            <div className="user-default-profile-pic">
                                                {displayUser.firstname?.charAt(0).toUpperCase() + displayUser.lastname?.charAt(0).toUpperCase()}
                                            </div>
                                        }
                                        <div className="filter-user-details">
                                            <div className="user-display-name">{formatName(displayUser)}</div>
                                            {
                                                typingUsers[currentChatId] && <div className="typing-indicator"><i>typing...</i></div>
                                            }
                                            {
                                                !typingUsers[currentChatId] && <div className="user-display-email">{getLastMessage(displayUser._id) || displayUser.email}</div>
                                            }
                                        </div>
                                        <div>
                                            <div className="last-message-timestamp">
                                                {getLastMessageTimestamp(displayUser._id)}
                                            </div>
                                            {
                                                getUnreadMessageCount(displayUser._id) !== "" &&
                                                    <div className="unread-message-count">{getUnreadMessageCount(displayUser._id)}</div>
                                            }
                                            {
                                                !currentChatId && (
                                                    <div className="user-start-chat-btn" onClick={(e) => { e.stopPropagation(); startNewChat(displayUser); }} style={{
                                                        fontSize: '11px',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }}>
                                                        Start Chat
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}

export default UsersList;