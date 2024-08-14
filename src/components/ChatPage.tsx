import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socketService';
import { Socket } from 'socket.io-client';
import '../styles/ChatPage.css';

const ChatPage: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ [key: string]: any[] }>({});
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      const newSocket = initSocket(token);
      setSocket(newSocket);
      fetchRooms();
      fetchUsers();
      return () => {
        disconnectSocket();
      };
    }
  }, [navigate]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: any) => {
        setMessages(prevMessages => {
          const roomMessages = [...(prevMessages[message.roomId] || [])];
          return {
            ...prevMessages,
            [message.roomId]: [...roomMessages, message]
          };
        });
      };
  
      socket.on('new-message', handleNewMessage);
  
      return () => {
        socket.off('new-message', handleNewMessage);
      };
    }
  }, [socket]);

  useEffect(() => {
    console.log('Messages updated:', messages);
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedRoom]);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/chat/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/users/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createRoom = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/chat/rooms', {
        name: newRoomName,
        participants: [],
        isGroupChat: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(prevRooms => [...prevRooms, response.data.data]);
      setNewRoomName('');
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const selectRoom = async (roomId: string) => {
    setSelectedRoom(roomId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      console.log(`Fetching messages for room ID: ${roomId}`);
      const response = await api.get(`/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        setMessages(prevMessages => ({
          ...prevMessages,
          [roomId]: response.data.data
        }));
        if (socket) {
          socket.emit('join-room', roomId);
        }
      } else {
        console.error('Error fetching messages:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

const sendMessage = () => {
  if (socket && selectedRoom && newMessage.trim()) {
    const message = { content: newMessage, roomId: selectedRoom, sender: 'user' };
    socket.emit('send-message', message);
    setNewMessage('');
    scrollToBottom();
  }
};

  const addFriend = async () => {
    if (selectedUser && selectedRoom) {
      try {
        const token = localStorage.getItem('token');
        await api.post('/users/addFriend', {
          friendId: selectedUser,
          roomId: selectedRoom
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Friend added successfully');
      } catch (error) {
        console.error('Error adding friend:', error);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h2>Chat Rooms</h2>
        <ul className="room-list">
          {rooms.map(room => (
            <li
              key={room._id}
              onClick={() => selectRoom(room._id)}
              className={selectedRoom === room._id ? 'active' : ''}
            >
              {room.name}
            </li>
          ))}
        </ul>
        <div className="new-room">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="New room name"
          />
          <button onClick={createRoom}>Create Room</button>
        </div>
        <h2>All Users</h2>
        <ul className="user-list">
          {users.map(user => (
            <li
              key={user._id}
              onClick={() => setSelectedUser(user._id)}
              className={selectedUser === user._id ? 'active' : ''}
            >
              {user.name}
            </li>
          ))}
        </ul>
        <button onClick={addFriend} disabled={!selectedUser || !selectedRoom}>Add Friend</button>
      </div>
      <div className="chat-area">
        <div className="messages">
          {(messages[selectedRoom as keyof typeof messages] || []).map((message: any, index: number) => (
            <div key={index} className={`message ${message.sender === 'user' ? 'user' : 'other'}`}>
              <div className="message-content">{message.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="message-input">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;