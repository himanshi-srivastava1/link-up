import Search from "./search";
import { useState } from 'react';
import UsersList from "./userList";
import { useChatContext } from "../../../context/ChatContext";

function Sidebar({socket, onlineUser}) {
    const [ searchKey, setSearchKey ] = useState('');
    const { user } = useChatContext();
    
    return (
        <div className="app-sidebar">
            <Search searchKey={searchKey}
                setSearchKey={setSearchKey}
            ></Search>
            <UsersList socket={socket}
             searchKey={searchKey} 
             onlineUser={onlineUser}
            ></UsersList>
        </div>
    );
}
export default Sidebar;