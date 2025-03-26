"use client";
import React from 'react';

const SimpleSpinner = ({ size = "medium", color = "gradient" }) => {
  const sizeClasses = {
    small: "w-6 h-6 border-2",
    medium: "w-10 h-10 border-3",
    large: "w-16 h-16 border-4"
  };
  
  const colorStyles = color === "gradient" 
    ? "border-t-[#81059e] border-r-[#B7328C] border-b-[#81059e] border-l-[#B7328C]" 
    : `border-t-${color}`;
  
  return (
    <div className="flex justify-center items-center w-full h-full">
      <div className={`${sizeClasses[size]} rounded-full ${colorStyles} animate-spin`}></div>
    </div>
  );
};

export default SimpleSpinner;