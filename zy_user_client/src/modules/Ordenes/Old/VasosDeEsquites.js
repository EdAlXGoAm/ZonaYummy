import React, { useState } from 'react';

import DropDown from '../x10DropDown';
import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';

const VasosDeEsquites = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const tamanoOptions = [
        'Chico',
        'Grande',
        '1 Litro',
    ];
    const aderezos = [
        'Mayonesa',
        'Q Rayado',
        'Chile Piquin',
        ''
    ];

    const [statusAderezos, setStatusAderezos] = useState(
        [
            propiedadesComanda.cb_mayonesa,
            propiedadesComanda.cb_qrayado,
            propiedadesComanda.cb_chilepiquin,
            false
        ]);

    const handleUpdateStatusAderezos = (newStatus) => {
        setStatusAderezos(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_mayonesa = newStatus[0];
        newPropiedades.cb_qrayado = newStatus[1];
        newPropiedades.cb_chilepiquin = newStatus[2];
        handleUpdatePropiedadesComanda(newPropiedades);
    };
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedTamano, setSelectedTamano] = useState(propiedadesComanda.selectedTamano);

    const handleDropdownChange = (e) => {
        setSelectedTamano(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedTamano = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    return (

        <div>
            <div>
                <DropDown opciones_in={tamanoOptions} selectedValue={selectedTamano} onDropdownChange={handleDropdownChange} precios={[25, 30, 90]}/>
            </div>
            
            <div className="row">
                <div className="col">
                    <ToogleButton_CheckButtons index={index} platillo='Burguer' tipo_ingrediente='aderezos' ingredientes_checkbutton={aderezos} despliegue='horizontal' toggleChecked_Status={toggleChecked_Status} setToggleChecked_Status={setToggleChecked_Status} statusCheckBoxes={statusAderezos} handleUpdateStatusCheckBoxes={handleUpdateStatusAderezos} />
                </div>
            </div>
        </div>
    );
};

export default VasosDeEsquites;
