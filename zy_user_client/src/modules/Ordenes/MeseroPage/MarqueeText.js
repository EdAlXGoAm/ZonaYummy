import React, { useRef, useEffect, useState } from 'react';

/**
 * Componente que muestra texto con efecto marquee automático
 * solo cuando el texto desborda el contenedor por más de la tolerancia especificada
 */
const MarqueeText = ({ children, className = '', tolerance = 10 }) => {
    const wrapperRef = useRef(null);
    const textRef = useRef(null);
    const [needsMarquee, setNeedsMarquee] = useState(false);
    const [marqueeDistance, setMarqueeDistance] = useState(0);

    useEffect(() => {
        const checkOverflow = () => {
            if (wrapperRef.current && textRef.current) {
                const wrapperWidth = wrapperRef.current.offsetWidth;
                const textWidth = textRef.current.scrollWidth;
                const overflow = textWidth - wrapperWidth;
                
                // Solo activar marquee si el overflow es mayor que la tolerancia
                if (overflow > tolerance) {
                    setNeedsMarquee(true);
                    // Calcular la distancia que debe recorrer (negativa para ir a la izquierda)
                    setMarqueeDistance(-(overflow + 5)); // +5px de margen
                } else {
                    setNeedsMarquee(false);
                    setMarqueeDistance(0);
                }
            }
        };

        // Verificar después del render
        checkOverflow();
        
        // Re-verificar si cambia el tamaño de la ventana
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [children, tolerance]);

    return (
        <span 
            ref={wrapperRef}
            className={`marquee-wrapper ${needsMarquee ? 'needs-marquee' : ''} ${className}`}
        >
            <span 
                ref={textRef}
                className="marquee-text"
                style={needsMarquee ? { '--marquee-distance': `${marqueeDistance}px` } : {}}
            >
                {children}
            </span>
        </span>
    );
};

export default MarqueeText;

