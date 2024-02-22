import React, { useState, useEffect } from 'react';

const Counter30_to_0 = ({handleReloadFlag}) => {

    const [contador, setContador] = useState(60);

    useEffect(() => {
        // Si el contador es 0, no hace nada más
        if (contador === 0) {
            handleReloadFlag();
            return;
        }

        // Crea un temporizador que disminuye el contador cada segundo
        const id = setInterval(() => {
            setContador(contador - 1);
        }, 1000);

        // Limpia el intervalo cuando el componente se desmonta
        // o el contador llega a 0 para evitar efectos no deseados
        return () => clearInterval(id);
    }, [contador]); // Dependencias del efecto, se vuelve a ejecutar el efecto si `contador` cambia

    return(
        <div>
            <span>{contador}</span>
            {contador === 0 && <span> - Se recomienda recargar el sitio</span>}
        </div>
    );
}

export default Counter30_to_0;