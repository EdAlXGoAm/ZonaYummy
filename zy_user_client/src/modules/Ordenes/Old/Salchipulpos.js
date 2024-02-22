import React, { useState } from 'react';

import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';

const Salchipulpos = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {

    const Label = ["Orden"];

    const aderezos = [
        'Q Amarillo',
        'Mayonesa',
        'Catsup',
        'Valentina'
    ];

    const [statusAderezos, setStatusAderezos] = useState(
        [
            propiedadesComanda.cb_qamarillo,
            propiedadesComanda.cb_mayonesa,
            propiedadesComanda.cb_catsup,
            propiedadesComanda.cb_valentina
        ]);

    const handleUpdateStatusAderezos = (newStatus) => {
        setStatusAderezos(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_qamarillo = newStatus[0];
        newPropiedades.cb_mayonesa = newStatus[1];
        newPropiedades.cb_catsup = newStatus[2];
        newPropiedades.cb_valentina = newStatus[3];
        handleUpdatePropiedadesComanda(newPropiedades);
    }

    return (
        <div>
            <div className="row">
                <div className="col">
                    <label htmlFor="Salchipulpos"  style={{ fontWeight: 'bold', fontSize: '30px', border: '1px solid #2d2d2d', borderRadius: '15px', padding: '15px', width: '100%'
                }}><span style={{ color: 'red' }}>
                    $50
                    </span>
                    <span style={{ color: 'black' }}>
                    &nbsp;{Label}
                    </span></label>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <ToogleButton_CheckButtons index={index} platillo='Burguer' tipo_ingrediente='aderezos' ingredientes_checkbutton={aderezos} despliegue='horizontal' toggleChecked_Status={toggleChecked_Status} setToggleChecked_Status={setToggleChecked_Status} statusCheckBoxes={statusAderezos} handleUpdateStatusCheckBoxes={handleUpdateStatusAderezos} />
                </div>
            </div>
        </div>
    );
};

export default Salchipulpos;
