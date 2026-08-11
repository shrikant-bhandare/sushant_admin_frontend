import React, { useState } from 'react';

const SecondaryButton = ({ icon, text, id, activeButton, handleButtonClick, isExpanded }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = activeButton === id;

  return (
    <div className="flex justify-center items-center mx-auto w-full">
      <div
        onClick={() => handleButtonClick(id)}
        style={{
          boxShadow: isActive
            ? "10px 10px 20px 0px #CBCDD0 inset, -10px -10px 20px 0px #FFFFFF inset"
            : "-10px -10px 20px 0px #FFFFFF, 10px 10px 20px 0px #CBCDD0",
          color: isHovered || isActive ? "green" : "grey",
          width: "100%",
          marginBottom: "20px",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-[#F1F1F1] rounded-[10px] min-w-[50px] mx-[20px] my-[20px] flex items-center justify-center w-full py-[16px]"
      >
        <div className="px-3">
          {icon}
        </div>
        {isExpanded && (
          <div
            style={{ opacity: "75%" }}
            className="font-bold w-full text-[21px] leading-[27px] text-left ml-2"
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondaryButton;