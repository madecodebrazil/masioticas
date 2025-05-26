'use client';

// src/components/BackButton.js para App Router
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const BackButton = ({ 
  className = '',
  label = '',
  showLabel = true,
  color = '#81059e', // Cor roxa padrão
  fallbackRoute = '', // Rota de fallback caso não tenha histórico
  fallbackLabel = '', // Texto alternativo para o fallback
  size = 28 // Tamanho da seta, aumentado do padrão
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    // Verifica se é possível voltar (existe histórico)
    // Só execute este código no cliente
    if (typeof window !== 'undefined') {
      setCanGoBack(window.history.length > 1);
    }
  }, []);
  
  const handleGoBack = () => {
    if (canGoBack) {
      router.back();
    } else if (fallbackRoute) {
      router.push(fallbackRoute);
    }
  };

  // Cálculos para SVG responsivo
  const strokeWidth = size / 12; // Espessura proporcional ao tamanho
  const svgSize = size;
  const arrowPoints = `M${svgSize * 0.75},${svgSize * 0.5} L${svgSize * 0.25},${svgSize * 0.5}`;
  const arrowHead = `M${svgSize * 0.4},${svgSize * 0.25} L${svgSize * 0.25},${svgSize * 0.5} L${svgSize * 0.4},${svgSize * 0.75}`;
  
  return (
    <button
      onClick={handleGoBack}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={!canGoBack && !fallbackRoute}
      className={`flex items-center gap-2 transition-all px-3 py-2 rounded-md 
                hover:bg-opacity-10 hover:bg-purple-300 
                disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label="Voltar para a página anterior"
    >
      <svg 
        width={svgSize} 
        height={svgSize} 
        viewBox={`0 0 ${svgSize} ${svgSize}`} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300"
        style={{ 
          transform: isHovered ? 'translateX(-2px)' : 'translateX(0)',
        }}
      >
        <path 
          d={arrowPoints} 
          stroke={color} 
          strokeWidth={strokeWidth} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path 
          d={arrowHead} 
          stroke={color} 
          strokeWidth={strokeWidth} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
      {showLabel && label && (
        <span 
          style={{ color }}
          className="transition-opacity duration-300"
        >
          {(fallbackRoute && !canGoBack && fallbackLabel) ? fallbackLabel : label}
        </span>
      )}
    </button>
  );
};

export default BackButton;