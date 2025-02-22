// components/CarrouselPromo.js
"use client";
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const SimpleCarousel = () => {
  const images = [
    "/images/homepage/ad1.svg",
    "/images/homepage/ad2.svg",
    "/images/homepage/ad3.svg",
    "/images/homepage/ad4.svg"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 2) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 2 + images.length) % images.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative max-w-6xl mx-auto overflow-hidden z-0">
      <div 
        className="flex transition-transform duration-500 relative"
        style={{
          transform: `translateX(-${currentIndex * 50}%)`
        }}
      >
        {images.map((img, index) => (
          <div key={index} className="w-1/2 flex-shrink-0 p-2">
            <img
              src={img}
              alt={`Slide ${index + 1}`}
              className="w-full h-44 object-cover rounded-lg"
            />
          </div>
        ))}
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-purple-400/70 text-white p-3 rounded-full hover:bg-purple-600/70 transition-colors z-10"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-purple-400/70 text-white p-3 rounded-full hover:hover:bg-purple-600/70 transition-colors z-10"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </div>
  );
};

export default SimpleCarousel;