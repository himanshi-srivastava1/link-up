import ChatArea from "./components/chat";
import Header from "./components/header";
import Header2 from "./components/header2";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

function Home() {
    const { user } = useSelector(state => state.userReducer);
    const [onlineUser, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user) {
            const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            const newSocket = io(socketUrl, {
                transports: ["websocket", "polling"]
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
        return <div className="loading">Loading...</div>;
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