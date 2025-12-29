import ChatArea from "./components/chat";
import Header from "./components/header";
import Header2 from "./components/header2";
import { socket } from "../home";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
function Home() {
    const { user } = useSelector(state => state.userReducer);
    const [onlineUser, setOnlineUsers] = useState([]);
    useEffect(() => {
        if (user) {
            socket.emit('join-room', user._id);
            socket.emit('user-login', user._id);
            socket.on('online-users', (onlineUsers) => {
                setOnlineUsers(onlineUsers);
            })
        }
        return () => {
            socket.off('online-users');
        }
    }, [user])
    return (
        <div className="message-page">
            <Header></Header>
            <Header2 socket={socket}  onlineUser={onlineUser}></Header2>
            <div className="chat-content">
                <ChatArea socket={socket}></ChatArea>
            </div>
        </div>
    );
}
export default Home;