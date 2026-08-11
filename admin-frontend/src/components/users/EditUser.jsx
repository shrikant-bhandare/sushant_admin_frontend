import { FaTimes } from 'react-icons/fa';

 // Modal component definition
 const EditUser = ({ isOpen, onClose, title, children }) => {
   if (!isOpen) return null;
   return (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md mx-4">
         <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
           <button
             onClick={onClose}
             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
           >
             <FaTimes />
           </button>
         </div>
         {children}
       </div>
     </div>
   );
 };

export default EditUser