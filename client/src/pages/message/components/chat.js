import { createNewMessage, getAllMessages } from "../../../apicalls/message";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { clearUnreadMessageCount } from "../../../apicalls/chat";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import store from "../../../redux/store";
import { setSelectedChat, setAllChats } from "../../../redux/userSlice";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import EmojiPicker from "emoji-picker-react";
import GifPicker from "./GifPicker";

function ChatArea({ socket }) {
    const { user, allChats } = useSelector(state => state.userReducer);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
            const chatToRestore = allChats.find(chat => String(chat._id).trim() === String(id).trim());

            if (chatToRestore) {
                dispatch(setSelectedChat(chatToRestore));
            } else {
                // Instead of immediately kicking the user to the home screen, 
                // we'll wait or gently guide them.
                console.error("Chat ID not found in allChats:", id);
                // toast.error("Invalid chat");
                // navigate("/");
            }
        }
    }, [id, allChats, navigate, dispatch]);

    const [message, setMessage] = useState('');
    const [allMessages, setAllMessages] = useState([]);

    const sendMessage = async (image) => {
        try {
            const newMessage = {
                chatId: id,
                sender: user._id,
                text: message,
                image: typeof image === 'string' ? image : ''
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
                setShowEmojiPicker(false);
                setShowGifPicker(false);
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
                    const currentAllChats = store.getState().userReducer.allChats;
                    const updatedChats = currentAllChats.map(chat => {
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
    }, [selectedChat, id, socket, user._id])

    const formatTime = (timestamp) => {
        const now = moment();
        const diff = now.diff(moment(timestamp), 'days');
        if (diff < 1) return `Today ${moment(timestamp).format('hh:mm A')}`
        else if (diff === 1) return `Yesterday ${moment(timestamp).format('hh:mm A')}`
        else return moment(timestamp).format('MMM D,hh:mm A');
    }

    const sendImage = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader(file);
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            sendMessage(reader.result);
        }
    }

    const handleGifSelect = (gifUrl) => {
        sendMessage(gifUrl);
    }

    return (
        <>
            {selectedChat &&
                <div className="app-chat-area">
                    <div className="scrollbar-container">
                        <div className='messages-area'>
                            {allMessages.map((msg, index) => {
                                const isMessageSender = msg.sender === user._id;
                                return <div key={index} className="message-container">
                                    <div className={isMessageSender ? "send-message" : "received-message"}>
                                        <div>{msg.text}</div>
                                        <div>{msg.image && <img src={msg.image} alt="content" style={{maxHeight: '200px', maxWidth: '100%', borderRadius: '8px'}} />}</div>
                                    </div>
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
                        {showEmojiPicker && 
                            <div style={{position: 'absolute', bottom: '70px', right: '20px', zIndex: 100}}>
                                <EmojiPicker className="emoji-picker"
                                    onEmojiClick={(e) => {
                                        setMessage((prev) => prev + e.emoji);
                                    }} />
                            </div>
                        }
                        {showGifPicker && 
                            <GifPicker onSelect={handleGifSelect} />
                        }
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
                    </div>
                    <label htmlFor='file' className="send-image-btn"><i className="fa-solid fa-camera"></i></label>
                    <input type='file' id='file' style={{ display: 'none' }}
                        accept="image/jpg, image/jpeg, image/gif, image/png" onChange={sendImage}></input>
                    <button
                        className="send-gif-btn"
                        onClick={() => {
                            setShowGifPicker(!showGifPicker);
                            setShowEmojiPicker(false);
                        }}
                    ><span className="material-symbols-outlined">
                            gif
                        </span></button>
                    <button className="fa fa-smile-o send-emoji-btn" aria-hidden="true"
                        onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}></button>
                    <button className="fa fa-paper-plane send-message-btn" aria-hidden="true"
                        onClick={() => sendMessage()}></button>
                </div>
            }
        </>
    );
}

export default ChatArea;