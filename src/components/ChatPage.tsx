import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socketService';
import { Socket } from 'socket.io-client';
import '../styles/ChatPage.css';

const initials = (value: string = ''): string => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
};

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

  const currentRoom = rooms.find((r) => r._id === selectedRoom);
  const currentMessages = messages[selectedRoom as keyof typeof messages] || [];
  const participantCount = currentRoom?.participants?.length ?? 0;

  return (
    <div className="chat-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-mark">C</div>
          <div className="brand-name">ChatApp</div>
        </div>

        <div className="sidebar-scroll">
          <div className="sidebar-section">
            <h3>Chat Rooms</h3>
            <ul className="list">
              {rooms.map((room) => (
                <li
                  key={room._id}
                  onClick={() => selectRoom(room._id)}
                  className={`list-item ${selectedRoom === room._id ? 'active' : ''}`}
                >
                  <div className="avatar brand">{initials(room.name)}</div>
                  <span className="name">{room.name}</span>
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
              <button
                className="btn btn-primary"
                onClick={createRoom}
                disabled={!newRoomName.trim()}
              >
                Create
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>All Users</h3>
            <ul className="list">
              {users.map((user) => (
                <li
                  key={user._id}
                  onClick={() => setSelectedUser(user._id)}
                  className={`list-item ${selectedUser === user._id ? 'active' : ''}`}
                >
                  <div className="avatar">{initials(user.name)}</div>
                  <span className="name">{user.name}</span>
                </li>
              ))}
            </ul>
            <button
              className="btn btn-secondary btn-block"
              onClick={addFriend}
              disabled={!selectedUser || !selectedRoom}
            >
              Add Friend to Room
            </button>
          </div>
        </div>
      </aside>

      <main className="chat-area">
        <header className="chat-header">
          {currentRoom ? (
            <>
              <div className="avatar brand lg">{initials(currentRoom.name)}</div>
              <div>
                <div className="title">{currentRoom.name}</div>
                <div className="meta">
                  {participantCount} participant{participantCount === 1 ? '' : 's'}
                </div>
              </div>
            </>
          ) : (
            <div className="placeholder">Select a chat room to start messaging</div>
          )}
        </header>

        <div className="messages">
          {selectedRoom ? (
            currentMessages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-mark">💬</div>
                <div>No messages yet. Send the first one!</div>
              </div>
            ) : (
              currentMessages.map((message: any, index: number) => (
                <div
                  key={index}
                  className={`message ${message.sender === 'user' ? 'user' : 'other'}`}
                >
                  {message.content}
                </div>
              ))
            )
          ) : (
            <div className="empty-state">
              <div className="empty-mark">💬</div>
              <div>Pick a room from the left to view messages.</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="message-input">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedRoom ? 'Type a message…' : 'Select a room to start chatting'}
            disabled={!selectedRoom}
          />
          <button onClick={sendMessage} disabled={!selectedRoom || !newMessage.trim()}>
            Send
          </button>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
