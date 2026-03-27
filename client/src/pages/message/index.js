import ChatArea from "./components/chat";
import Header from "./components/header";
import Header2 from "./components/header2";
import { io } from "socket.io-client";
import { useChatContext } from "../../context/ChatContext";
import { useEffect, useState } from "react";
import Loader from "../../components/loader";

function Home() {
    const [onlineUser, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const { user } = useChatContext();

    useEffect(() => {
        if (user) {
            const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            const newSocket = io(socketUrl, {
                transports: ["websocket", "polling"],
                auth: {
                    token: localStorage.getItem('token')
                }
            });

            newSocket.emit('join-room', user._id);
            newSocket.emit('user-login', user._id);
            newSocket.on('online-users', (onlineUsers) => {
                setOnlineUsers(onlineUsers);
            })

            setSocket(newSocket);

            return () => {
                newSocket.off('online-users');
                newSocket.close();
            };
        }
    }, [user]);

    if (!user || !socket) {
        return (
            <div className="message-page">
                <Loader />
            </div>
        );
    }

    return (
        <div className="message-page">
            <Header></Header>
            <Header2 socket={socket} onlineUser={onlineUser}></Header2>
            <div className="chat-content">
                <ChatArea socket={socket}></ChatArea>
            </div>
        </div>
    );
}
export default Home;