import React, { useState, useEffect } from "react";
import { FaInstagram, FaWhatsapp, FaPaperPlane, FaUserCircle } from "react-icons/fa";

const SocialMediaChats = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState("WhatsApp");

    useEffect(() => {
        // Dummy data for testing
        const dummyChats = [
            {
                id: "1",
                name: "John Doe",
                platform: "WhatsApp",
                lastMessage: "Hey, can you help me?",
                messages: [
                    { sender: "John Doe", text: "Hey, can you help me?" },
                    { sender: "You", text: "Sure, what do you need help with?" },
                ],
            },
            {
                id: "2",
                name: "Jane Smith",
                platform: "Instagram",
                lastMessage: "Thanks for the update!",
                messages: [
                    { sender: "Jane Smith", text: "Thanks for the update!" },
                    { sender: "You", text: "You're welcome!" },
                ],
            },
        ];
        setChats(dummyChats);
    }, []);

    const handleSendMessage = () => {
        if (!message.trim()) return;

        const updatedChats = chats.map((chat) => {
            if (chat.id === selectedChat.id) {
                return {
                    ...chat,
                    messages: [...chat.messages, { sender: "You", text: message }],
                };
            }
            return chat;
        });

        setChats(updatedChats);
        setMessage("");
    };

    const filteredChats = chats.filter((chat) => chat.platform === activeTab);

    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar */}
                <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="flex justify-around mb-4">
                        <button
                            className={`p-2 rounded-lg flex items-center gap-2 ${
                                activeTab === "WhatsApp" ? "bg-green-500 text-white" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                            onClick={() => setActiveTab("WhatsApp")}
                        >
                            <FaWhatsapp />
                            WhatsApp
                        </button>
                        <button
                            className={`p-2 rounded-lg flex items-center gap-2 ${
                                activeTab === "Instagram" ? "bg-pink-500 text-white" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                            onClick={() => setActiveTab("Instagram")}
                        >
                            <FaInstagram />
                            Instagram
                        </button>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{activeTab} Chats</h2>
                    <ul className="overflow-y-auto">
                        {filteredChats.map((chat) => (
                            <li
                                key={chat.id}
                                className={`p-4 cursor-pointer flex items-center gap-4 rounded-lg ${
                                    selectedChat?.id === chat.id ? "bg-gray-200 dark:bg-gray-700" : ""
                                }`}
                                onClick={() => setSelectedChat(chat)}
                            >
                                <FaUserCircle className="text-3xl text-gray-500" />
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{chat.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{chat.lastMessage}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Chat Window */}
                <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    {selectedChat ? (
                        <>
                            <div className="flex items-center mb-4">
                                {selectedChat.platform === "Instagram" ? (
                                    <FaInstagram className="text-pink-500 text-2xl mr-2" />
                                ) : (
                                    <FaWhatsapp className="text-green-500 text-2xl mr-2" />
                                )}
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{selectedChat.name}</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                                {selectedChat.messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`mb-4 ${
                                            msg.sender === "You" ? "text-right" : "text-left"
                                        }`}
                                    >
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{msg.sender}</p>
                                        <p className="bg-gray-200 dark:bg-gray-600 p-2 rounded-lg inline-block">
                                            {msg.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    className="flex-1 p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <button
                                    className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                    onClick={handleSendMessage}
                                >
                                    <FaPaperPlane />
                                    Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 h-full">
                            <p>Select a chat to view messages</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocialMediaChats;
