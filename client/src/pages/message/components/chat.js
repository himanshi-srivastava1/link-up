import { createNewMessage, getAllMessages } from "../../../apicalls/message";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { clearUnreadMessageCount } from "../../../apicalls/chat";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import store from "../../../redux/store";
import { setSelectedChat, setAllChats } from "../../../redux/userSlice";
import { useNavigate } from "react-router-dom";
import moment from "moment";
function ChatArea({ socket }) {
    const { user, allChats } = useSelector(state => state.userReducer);
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { selectedChat } = useSelector(state => state.userReducer);
    useEffect(() => {
        if (user && socket) {
            socket.emit('join-room', user._id);
        }
    }, [user, socket])
    useEffect(() => {
        if (allChats && allChats.length > 0) {
            const chatToRestore = allChats.find(chat => chat._id === id);

            if (chatToRestore) {
                dispatch(setSelectedChat(chatToRestore));
            } else {
                toast.error("Invalid chat");
                console.log(id);
                console.log(allChats);
                console.log(selectedChat);
                navigate("/");
            }
        }
    }, [id, allChats]);
    const [message, setMessage] = useState('');
    const [allMessages, setAllMessages] = useState([]);
    const sendMessage = async () => {
        try {
            const newMessage = {
                chatId: id,
                sender: user._id,
                text: message
            }
            socket.emit('send-message', {
                ...newMessage,
                members: selectedChat.members.map(m => m._id),
                createdAt: new Date().toISOString(),
                read: false,
            })
            const response = await createNewMessage(newMessage);
            if (response.success) {
                setMessage('');
            }
            else {
                toast.error(response.message);
            };
        }
        catch (err) {
            toast.error(err.message);
        };
    }
    const getMessages = async () => {
        try {
            const response = await getAllMessages(id);
            if (response.success) {
                setAllMessages(response.data.reverse());
            }
        }
        catch (err) {
            toast.error(err.message);
        };
    }
    const clearUnreadMessages = async () => {
        try {
            const response = await clearUnreadMessageCount(selectedChat._id);
            if (response.success) {
                allChats.map(chat => {
                    if (chat._id === selectedChat._id) {
                        return response.data;
                    }
                    return chat;
                })
            }
        }
        catch (err) {
            toast.error(err.message);
        };
    }
    useEffect(() => {
        if (selectedChat && socket) {
            getMessages();
            socket.emit('read-all-messages', {
                chatId: id,
                readBy: user._id,
                members: selectedChat.members.map(m => m._id)
            });
            if (selectedChat?.lastMessage?.sender !== user._id)
                clearUnreadMessages();
            const handleReceiveMessage = (data) => {
                if (data.chatId === id) {
                    let updatedMessage1 = data;
                    if (data.sender !== user._id) {
                        updatedMessage1 = { ...data, read: true }
                    }
                    setAllMessages(prevmsg => [updatedMessage1, ...prevmsg]);
                    const allChats = store.getState().userReducer.allChats;
                    const updatedChats = allChats.map(chat => {
                        if (chat._id === data.chatId && data.sender !== user._id) {
                            clearUnreadMessages();
                            return {
                                ...chat,
                                unreadMessageCount: 0,
                                lastMessage: updatedMessage1
                            };
                        }
                        else return chat;
                    });
                    dispatch(setAllChats(updatedChats));
                }
            };
            const handleMessagesRead = (data) => {
                if (data.chatId === id && data.readBy !== user._id) {
                    setAllMessages(prev => prev.map(msg => ({ ...msg, read: true })));
                }
            };
            socket.on('receive-message', handleReceiveMessage);
            socket.on('messages-read-update', handleMessagesRead);
            return () => {
                socket.off('receive-message', handleReceiveMessage);
                socket.off('messages-read-update', handleMessagesRead);
            };

        }
    }, [selectedChat, id, socket, user._id,])

    const formatTime = (timestamp) => {
        const now = moment();
        const diff = now.diff(moment(timestamp), 'days');
        if (diff < 1) return `Today ${moment(timestamp).format('hh:mm A')}`
        else if (diff == 1) return `Yesterday ${moment(timestamp).format('hh:mm A')}`
        else return moment(timestamp).format('MMM D,hh:mm A');
    }
    return (
        <>
            {selectedChat &&
                <div className="app-chat-area">
                    <div className='messages-area'>
                        {allMessages.map((msg) => {
                            const isMessageSender = msg.sender === user._id;
                            return <div className="message-container">
                                <div className={isMessageSender ? "send-message" : "received-message"}>{msg.text}</div>
                                <div className={isMessageSender ? "message-info-sender" : "message-info"}>
                                    <div className={isMessageSender ? "message-timestamp-sender" : "message-timestamp"}>
                                        {formatTime(msg.createdAt)}
                                    </div>
                                    <div className="message-icon-sender">{isMessageSender && !msg.read && <i className="fa-solid fa-check "></i>}</div>
                                    <div className="message-icon-sender">{isMessageSender && msg.read && <i className="fa-solid fa-check-double "></i>}</div>
                                </div>
                            </div>
                        })}
                    </div>
                    <div className="send-message-div">
                        <input type="text" className="send-message-input" placeholder="Type a message"
                            value={message} onChange={(e) => {
                                setMessage(e.target.value)
                                socket.emit("user-typing", {
                                    chatId: id,
                                    members: selectedChat.members.map(m => m._id),
                                    sender: user._id
                                })
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    sendMessage();
                                }
                            }} />
                        <button className="fa fa-paper-plane send-message-btn" aria-hidden="true"
                            onClick={sendMessage}></button>
                    </div>
                </div>}
        </>
    );
}
export default ChatArea;