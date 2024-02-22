import React, { useState } from 'react';

import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';
import DropDown from '../x10DropDown';

const PapasALaFrancesa = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const Label = ["Orden"];

    const tamanoOptions = [
        'Orden',
        'Media Orden',
    ];

    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedTamano, setSelectedTamano] = useState(propiedadesComanda.selectedTamano);

    const handleDropdownChange = (e) => {
        setSelectedTamano(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedTamano = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

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
                    <DropDown opciones_in={tamanoOptions} selectedValue={selectedTamano} onDropdownChange={handleDropdownChange} precios={[40, 20]}/>
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

export default PapasALaFrancesa;
