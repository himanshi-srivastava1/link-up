import { createNewMessage, getAllMessages, deleteMessage } from "../../../apicalls/message";
import { useChatContext } from "../../../context/ChatContext";
import { clearUnreadMessageCount } from "../../../apicalls/chat";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import EmojiPicker from "emoji-picker-react";
import GifPicker from "./GifPicker";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function ChatArea({ socket }) {
    const { user, allChats, selectedChat, setAllChats, setSelectedChat } = useChatContext();
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && socket) {
            socket.emit('join-room', user._id);
        }
    }, [user, socket])

    useEffect(() => {
        if (allChats && allChats.length > 0) {
            const chatToRestore = allChats.find(chat => String(chat._id).trim() === String(id).trim());

            if (chatToRestore) {
                setSelectedChat(chatToRestore);
            } else {
                console.error("Chat ID not found in allChats:", id);
            }
        }
    }, [id, allChats, setSelectedChat, navigate]);

    const [message, setMessage] = useState('');
    const [allMessages, setAllMessages] = useState([]);
    const [typingUser, setTypingUser] = useState(null);

    const sendMessage = async (image) => {
        let loadingId;
        try {
            if (!message.trim() && typeof image !== 'string') return;
            if (typeof image === 'string') {
                loadingId = toast.loading("Sending image...");
            }

            const newMessage = {
                chatId: id,
                content: {
                    text: message || '',
                    image: typeof image === 'string' ? image : ''
                },
                messageType: typeof image === 'string' ? 'image' : 'text'
            }

            const response = await createNewMessage(newMessage);
            if (loadingId) toast.dismiss(loadingId);
            if (response.success) {
                const messageWithContent = response.data;

                // Emit to other users in the chat (excluding current user)
                const otherMembers = selectedChat.members.filter(m => (m._id || m.id) !== user.id);
                socket.emit('send-message', {
                    ...messageWithContent,
                    members: otherMembers.map(m => m._id || m.id),
                });
                // Add to local messages immediately
                setAllMessages(prevmsg => [messageWithContent, ...prevmsg]);

                // Clear input fields
                setMessage('');
                setShowEmojiPicker(false);
                setShowGifPicker(false);
                setShowAttachmentMenu(false);
            }
            else {
                toast.error(response.message);
            };
        }
        catch (err) {
            if (loadingId) toast.dismiss(loadingId);
            toast.error(err.message);
        };
    }
    const sendVideoMessage = async (videoBase64) => {
        let loadingId;
        try {
            if (!message.trim() && !videoBase64) return;
            loadingId = toast.loading("Uploading and sending video...");

            const newMessage = {
                chatId: id,
                content: {
                    text: message || '',
                    image: '',
                    video: videoBase64
                },
                messageType: 'video'
            }
            const response = await createNewMessage(newMessage);
            toast.dismiss(loadingId);
            if (response.success) {
                const messageWithContent = response.data;

                socket.emit('send-message', {
                    ...messageWithContent,
                    members: selectedChat.members.map(m => m._id),
                })
                setAllMessages(prevmsg => [messageWithContent, ...prevmsg]);
                setMessage('');
                setShowEmojiPicker(false);
                setShowGifPicker(false);
                setShowAttachmentMenu(false);
            }
            else {
                toast.error(response.message);
            };
        }
        catch (err) {
            if (loadingId) toast.dismiss(loadingId);
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

    const handleDeleteMessage = async (messageId) => {
        try {
            const response = await deleteMessage(messageId);
            if (response.success) {
                const deletedMsg = response.data;
                if (deletedMsg && deletedMsg._id) {
                    setAllMessages(prev => prev.filter(msg => msg._id !== messageId));
                    socket.emit('delete-message', {
                        chatId: id,
                        messageId: messageId,
                        wasUnread: deletedMsg.read || false,
                        members: selectedChat.members.map(m => m._id)
                    });
                } else {
                    console.error('Deleted message is undefined or missing _id:', deletedMsg);
                }
            } else {
                toast.error(response.message);
            }
        } catch (err) {
            toast.error(err.message);
        }
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
            socket.emit('mark-messages-read', {
                chatId: id,
                readBy: user.id,
                members: selectedChat.members.map(m => m._id)
            });
            if (selectedChat?.lastMessage?.sender !== user.id)
                clearUnreadMessages();

            const handleReceiveMessage = (data) => {
                if (data.chatId === id) {
                    let updatedMessage = data;
                    const senderId = data.sender._id || data.sender.id || data.sender;
                    // Mark as read if it's not from current user
                    if (senderId !== user.id) {
                        updatedMessage = { ...data, readBy: [{ user: user.id }] };
                        
                        // Instantly notify backend that this message was read, so sender gets double-tick!
                        socket.emit('mark-messages-read', {
                            chatId: id,
                            readBy: user.id,
                            members: selectedChat.members.map(m => m._id)
                        });
                    }

                    // Add message to local state
                    setAllMessages(prevmsg => [updatedMessage, ...prevmsg]);

                    // Update chat list
                    const updatedChats = allChats.map(chat => {
                        if (chat._id === data.chatId) {
                            return {
                                ...chat,
                                unreadMessageCount: senderId !== user.id ? 0 : chat.unreadMessageCount || 0,
                                lastMessage: updatedMessage
                            };
                        }
                        else return chat;
                    });
                    setAllChats(updatedChats);
                }
            };

            const handleMessagesRead = (data) => {
                if (data.chatId === id && data.userId !== user.id) {
                    setAllMessages(prev => prev.map(msg => ({ ...msg, readBy: [{ user: data.userId }] })));
                }
            };

            const handleMessageDeleted = (data) => {
                if (data.chatId === id) {
                    setAllMessages(prev => prev.filter(msg => msg._id !== data.messageId));
                }
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

            socket.on('receive-message', handleReceiveMessage);
            socket.on('messages-read', handleMessagesRead);
            socket.on('message-deleted', handleMessageDeleted);

            // Handle typing indicators
            socket.on('user-typing', (data) => {
                if (data.chatId === id && data.user.id !== user.id) {
                    console.log(`${data.user.firstname} is typing...`);
                    setTypingUser(data.user);
                }
            });
            
            socket.on('user-stop-typing', (data) => {
                if (data.chatId === id && data.user.id !== user.id) {
                    console.log(`${data.user.firstname} stopped typing`);
                    setTypingUser(null);
                }
            });

            return () => {
                socket.off('receive-message', handleReceiveMessage);
                socket.off('messages-read', handleMessagesRead);
                socket.off('message-deleted', handleMessageDeleted);
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
        if (!file) return;
        setShowAttachmentMenu(false);
        const reader = new FileReader(file);
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            await sendMessage(reader.result);
            e.target.value = null;
        }
    }
    const sendVideo = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setShowAttachmentMenu(false);
        if (file.size > 25000000) {
            toast.error("Video must be less than 25MB");
            e.target.value = null;
            return;
        }
        const reader = new FileReader(file);
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            await sendVideoMessage(reader.result);
            e.target.value = null;
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
                            {/* Typing Indicator */}
                            {typingUser && (
                                <div className="typing-indicator" style={{
                                    padding: '8px 12px',
                                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                                    borderRadius: '12px',
                                    margin: '10px 0',
                                    fontSize: '12px',
                                    color: '#666',
                                    fontStyle: 'italic'
                                }}>
                                    {typingUser.firstname} is typing...
                                </div>
                            )}
                            {allMessages.map((msg, index) => {
                                console.log('Message debug:', {
                                    msgSenderId: msg.sender._id || msg.sender?.id || msg.sender,
                                    currentUserId: user.id,
                                    isMessageSender: msg.sender._id === user.id || msg.sender?.id === user.id || msg.sender === user.id
                                });

                                const isMessageSender = msg.sender._id === user.id || msg.sender?.id === user.id || msg.sender === user.id;
                                return <div key={index} className="message-container">
                                    <div className={isMessageSender ? "send-message" : "received-message"}>
                                        <div>{msg.content.text}</div>
                                        <div>{msg.content.image && <img src={msg.content.image} alt="content" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px' }} />}</div>
                                        <div>{msg.content.video && (<video src={msg.content.video} controls style={{ maxHeight: '200px', maxWidth: '300px', borderRadius: '8px' }} />)}</div>
                                    </div>
                                    <div className={isMessageSender ? "message-info-sender" : "message-info"}>
                                        <div className={isMessageSender ? "message-timestamp-sender" : "message-timestamp"}>
                                            {formatTime(msg.createdAt)}
                                        </div>
                                        {isMessageSender && (
                                            <i
                                                className="fa-solid fa-trash"
                                                style={{ cursor: 'pointer', marginRight: '5px', fontSize: '11px', color: '#ffb3b3' }}
                                                onClick={() => handleDeleteMessage(msg._id || msg.id || msg.sender?._id || msg.sender?.id)}
                                            ></i>
                                        )}
                                        <div className="message-icon-sender">{isMessageSender && (!msg.readBy || msg.readBy.length === 0) && <i className="fa-solid fa-check "></i>}</div>
                                        <div className="message-icon-sender">{isMessageSender && (msg.readBy && msg.readBy.length > 0) && <i className="fa-solid fa-check-double "></i>}</div>
                                    </div>
                                </div>
                            })}
                        </div>
                        {showEmojiPicker &&
                            <div style={{
                                position: 'absolute',
                                bottom: '70px',
                                right: '20px',
                                zIndex: 1000,
                                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                                borderRadius: '15px',
                                overflow: 'hidden'
                            }}>
                                <EmojiPicker
                                    width={300}
                                    height={450}
                                    onEmojiClick={(e) => {
                                        setMessage((prev) => prev + e.emoji);
                                    }} />
                            </div>
                        }
                        {showGifPicker &&
                            <GifPicker onSelect={handleGifSelect} />
                        }
                        {showAttachmentMenu &&
                            <div style={{ position: 'absolute', bottom: '70px', right: '110px', zIndex: 100, backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '15px', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '15px', color: '#000', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
                                <label htmlFor='file' style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500', padding: '5px' }}>
                                    <i className="fa-solid fa-image" style={{ fontSize: '20px', color: '#007bff' }}></i>Photo
                                </label>
                                <input type='file' id='file' style={{ display: "none" }}
                                    accept="image/jpg, image/jpeg, image/gif, image/png" onChange={sendImage}></input>
                                <label htmlFor='video-file' style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500', padding: '5px' }}>
                                    <i className="fa-solid fa-video" style={{ fontSize: '20px', color: '#ff3b3b' }}></i> Video
                                </label>
                                <input type='file' id='video-file' style={{ display: 'none' }}
                                    accept="video/mp4, video/webm, video/ogg" onChange={sendVideo}></input>
                            </div>
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

                    <button
                        className="send-image-btn"
                        onClick={() => {
                            setShowAttachmentMenu(!showAttachmentMenu);
                            setShowGifPicker(false);
                            setShowEmojiPicker(false);
                        }}
                    >
                        <i className="fa-solid fa-paperclip"></i>
                    </button>

                    <button
                        className="send-gif-btn"
                        onClick={() => {
                            setShowGifPicker(!showGifPicker);
                            setShowEmojiPicker(false);
                            setShowAttachmentMenu(false);
                        }}
                    ><span className="material-symbols-outlined">
                            gif
                        </span></button>
                    <button className="fa fa-smile-o send-emoji-btn" aria-hidden="true"
                        onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); setShowAttachmentMenu(false); }}></button>
                    <button className="fa fa-paper-plane send-message-btn" aria-hidden="true"
                        onClick={() => sendMessage()}></button>
                </div >
            }
        </>
    );
}

export default ChatArea;