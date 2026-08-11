import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="animate-bounce">
                <FaExclamationTriangle className="text-yellow-500 text-[100px   ] mb-4" />
            </div>
            <h1 className="text-6xl font-bold text-gray-800 mb-2 animate-fade-in-down">
                404
            </h1>
            <p className="text-xl text-gray-600 mb-4 animate-fade-in-up">
                Oops! The page you're looking for doesn't exist.
            </p>
            <a href="/" className="text-blue-500 hover:underline animate-fade-in">
                Go Back Home
            </a>
        </div>
    );
};

export default NotFound;
