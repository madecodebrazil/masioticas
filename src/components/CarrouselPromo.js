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
  const [isMobile, setIsMobile] = useState(false);
  
  // Determina o número de slides a avançar e o tamanho do slide com base no viewport
  const slidesToShow = isMobile ? 1 : 2;
  const slidePercentage = isMobile ? 100 : 50;

  // Função para verificar o tamanho da tela
  const checkIsMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  // Monitora o redimensionamento da janela
  useEffect(() => {
    checkIsMobile(); // Verificação inicial
    
    const handleResize = () => {
      checkIsMobile();
      // Garante que o índice atual seja válido após redimensionamento
      setCurrentIndex(prev => Math.min(prev, images.length - slidesToShow));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [images.length, slidesToShow]);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const next = prev + slidesToShow;
      // Se estiver no último conjunto de slides, volte para o início
      return next >= images.length ? 0 : next;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const next = prev - slidesToShow;
      // Se estiver no primeiro conjunto de slides, vá para o último possível
      return next < 0 ? Math.max(0, images.length - slidesToShow) : next;
    });
  };

  // Rotação automática do carrossel
  useEffect(() => {
    const timer = setInterval(nextSlide, 3000);
    return () => clearInterval(timer);
  }, [slidesToShow]);
  
  // Calcula o número de indicadores (dots) necessários
  const totalGroups = Math.ceil(images.length / slidesToShow);
  const currentGroup = Math.floor(currentIndex / slidesToShow);

  return (
    <div className="relative max-w-6xl mx-auto overflow-hidden z-0">
      <div 
        className="flex transition-transform duration-500 ease-in-out relative"
        style={{
          transform: `translateX(-${currentIndex * slidePercentage}%)`
        }}
      >
        {images.map((img, index) => (
          <div 
            key={index} 
            className={`${isMobile ? 'w-full' : 'w-1/2'} flex-shrink-0 p-2`}
          >
            <img
              src={img}
              alt={`Slide ${index + 1}`}
              className="w-full h-44 object-cover rounded-lg shadow-md"
            />
          </div>
        ))}
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-purple-400/70 text-white p-2 md:p-3 rounded-full hover:bg-purple-600/70 transition-colors z-10"
        aria-label="Slide anterior"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-purple-400/70 text-white p-2 md:p-3 rounded-full hover:bg-purple-600/70 transition-colors z-10"
        aria-label="Próximo slide"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>

      {/* Indicadores de página (dots) */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
        {Array.from({ length: totalGroups }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index * slidesToShow)}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              currentGroup === index ? 'bg-purple-600 w-4' : 'bg-purple-300'
            }`}
            aria-label={`Ir para grupo de slides ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SimpleCarousel;