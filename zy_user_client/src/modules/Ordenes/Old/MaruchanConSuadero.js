import React, { useState } from 'react';

import DropDown from '../x10DropDown';
import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';

const Doriesquites = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const maruchanOptions = [
        'Camarón',
        'Camarón Habanero',
        'Camarón Piquin',
        'Pollo',
        'Res'
    ];
    const aderezos = [
        'Cebolla',
        'Cilantro',
        'Salsa de Tacos',
        ''
    ];
    
    const [statusAderezos, setStatusAderezos] = useState(
        [
            propiedadesComanda.cb_cebolla,
            propiedadesComanda.cb_cilantro,
            propiedadesComanda.cb_salsadetacos,
            false
        ]);

    const handleUpdateStatusAderezos = (newStatus) => {
        setStatusAderezos(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_cebolla = newStatus[0];
        newPropiedades.cb_cilantro = newStatus[1];
        newPropiedades.cb_salsadetacos = newStatus[2];
        handleUpdatePropiedadesComanda(newPropiedades);
    }
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedMaruchan, setSelectedMaruchan] = useState(propiedadesComanda.selectedMaruchan);

    const handleDropdownChangeMaruchan = (e) => {
        setSelectedMaruchan(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedMaruchan = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    return (
        <div>
            <div>
                <DropDown opciones_in={maruchanOptions} selectedValue={selectedMaruchan} onDropdownChange={handleDropdownChangeMaruchan} precios={[45, 45, 45, 45, 45]}/>
            </div>
            
            <div className="row">
                <div className="col">
                    <ToogleButton_CheckButtons index={index} platillo='Burguer' tipo_ingrediente='aderezos' ingredientes_checkbutton={aderezos} despliegue='horizontal' toggleChecked_Status={toggleChecked_Status} setToggleChecked_Status={setToggleChecked_Status} statusCheckBoxes={statusAderezos} handleUpdateStatusCheckBoxes={handleUpdateStatusAderezos} />
                </div>
            </div>
        </div>
    );
};

export default Doriesquites;
