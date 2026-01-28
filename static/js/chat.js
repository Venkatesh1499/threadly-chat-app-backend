/**
 * WhatsApp-like Chat Application
 * Socket.IO Integration for Private Room Chat
 */

// Initialize Socket.IO connection
const socket = io({
    transports: ["websocket"]
});

// Application State
let currentRoom = "";
let isInRoom = false;

// DOM Elements
const entryScreen = document.getElementById('entry-screen');
const chatContainer = document.getElementById('chat-container');
const roomIdInput = document.getElementById('room-id-input');
const joinButton = document.getElementById('join-button');
const roomIdDisplay = document.getElementById('room-id-display');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Join room button
    joinButton.addEventListener('click', handleJoinRoom);
    
    // Enter key to join room
    roomIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isInRoom) {
            handleJoinRoom();
        }
    });

    // Send message button
    sendButton.addEventListener('click', handleSendMessage);
    
    // Enter key to send message (Shift+Enter for new line)
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
        updateSendButtonState();
    });

    // Update send button state on input
    messageInput.addEventListener('input', updateSendButtonState);
}

/**
 * Handle joining a room
 */
function handleJoinRoom() {
    const roomId = roomIdInput.value.trim();
    
    if (!roomId) {
        alert('Please enter a room ID');
        return;
    }

    // Disable join button during connection
    joinButton.disabled = true;
    joinButton.textContent = 'Joining...';

    currentRoom = roomId;
    
    // Emit join room event (matching backend event name)
    socket.emit("join_room", { room: currentRoom });
}

// Track sent messages to show them as "sent" (right-aligned, green)
let sentMessages = new Set();

/**
 * Handle sending a message
 */
function handleSendMessage() {
    const messageText = messageInput.value.trim();
    
    if (!messageText || !isInRoom) {
        return;
    }

    // Add message immediately as sent (optimistic UI update)
    addMessage(messageText, true, false);
    sentMessages.add(messageText);

    // Emit message event (matching backend event name)
    socket.emit("room_message", {
        room: currentRoom,
        message: messageText
    });

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    updateSendButtonState();
}

/**
 * Update send button state based on input
 */
function updateSendButtonState() {
    const hasText = messageInput.value.trim().length > 0;
    sendButton.disabled = !hasText || !isInRoom;
}

/**
 * Show entry screen
 */
function showEntryScreen() {
    entryScreen.style.display = 'block';
    chatContainer.classList.remove('active');
    isInRoom = false;
    currentRoom = '';
    messagesContainer.innerHTML = '';
    messageInput.value = '';
    updateSendButtonState();
}

/**
 * Show chat screen
 */
function showChatScreen() {
    entryScreen.style.display = 'none';
    chatContainer.classList.add('active');
    isInRoom = true;
    roomIdDisplay.textContent = currentRoom;
    messageInput.disabled = false;
    messageInput.focus();
    updateSendButtonState();
}

/**
 * Add message to chat
 * @param {string} message - Message text
 * @param {boolean} isSent - Whether message is sent by current user
 * @param {boolean} isSystem - Whether it's a system message
 */
function addMessage(message, isSent = false, isSystem = false) {
    const messageDiv = document.createElement('div');
    
    if (isSystem) {
        messageDiv.className = 'system-message';
        messageDiv.textContent = message;
    } else {
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = message;
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = getCurrentTime();
        
        bubble.appendChild(text);
        bubble.appendChild(time);
        messageDiv.appendChild(bubble);
    }
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Get current time in HH:MM format
 */
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Scroll to bottom of messages
 */
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Handle socket connection
 */
socket.on('connect', () => {
    console.log('Connected to server');
    if (currentRoom && !isInRoom) {
        // Rejoin room if we were in one
        socket.emit("join_room", { room: currentRoom });
    }
});

/**
 * Handle socket disconnection
 */
socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

/**
 * Handle socket reconnection
 */
socket.on('reconnect', () => {
    console.log('Reconnected to server');
    if (currentRoom && isInRoom) {
        socket.emit("join_room", { room: currentRoom });
    }
});

/**
 * Handle room join confirmation and incoming messages
 * Backend emits "room_message" with "Joined room {room}" message
 */
socket.on("room_message", (data) => {
    const message = data.message;
    
    // Check if this is a join confirmation message
    if (message.includes("Joined room")) {
        if (!isInRoom) {
            // This is our own join confirmation
            showChatScreen();
            joinButton.disabled = false;
            joinButton.textContent = 'Join Room';
            addMessage(`You joined room: ${currentRoom}`, false, true);
        } else {
            // Another user joined
            addMessage("A user joined the room", false, true);
        }
    } else {
        // Regular message - check if we sent it
        // If we already displayed it as sent, don't show it again
        // Otherwise, show it as received (from another user)
        if (!sentMessages.has(message)) {
            addMessage(message, false, false);
        } else {
            // We sent this message, it's already displayed, remove from tracking
            sentMessages.delete(message);
        }
    }
});

// Handle mobile viewport height changes (keyboard appearance)
function handleViewportResize() {
    if (window.visualViewport) {
        const vh = window.visualViewport.height * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
}

// Initialize viewport handling for mobile
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize);
    handleViewportResize();
}

// Prevent zoom on input focus (iOS Safari)
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            }
        });
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventListeners);
} else {
    initializeEventListeners();
}

