import React, { useState } from 'react';

import DropDown from '../x10DropDown';
import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';

const Dorilocos = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const doritosOptions = [
        'Dor. Nachos (Rojos)',
        'Dor. Diablo (Naranjas)',
        'Dor. Pizzerolas (Verdes)',
        'Dor. Incognita (Negros)',
        'Dor. Flaming Hot (Morados)',
        'Dor. Mix',
        'Cheetos Naranjas',
        'Cheetos Flaming Hot',
        'Otros'
    ];
    const aderezos = [
        'Chamoy',
        'Miguelito',
        'Tajin',
        'Valentina',
        'Botanera',
        ''
    ];

    const [statusAderezos, setStatusAderezos] = useState(
        [
            propiedadesComanda.cb_chamoy,
            propiedadesComanda.cb_miguelito,
            propiedadesComanda.cb_tajin,
            propiedadesComanda.cb_valentina,
            propiedadesComanda.cb_botanera,
            false
        ]);

    const handleUpdateStatusAderezos = (newStatus) => {
        setStatusAderezos(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_chamoy = newStatus[0];
        newPropiedades.cb_miguelito = newStatus[1];
        newPropiedades.cb_tajin = newStatus[2];
        newPropiedades.cb_valentina = newStatus[3];
        newPropiedades.cb_botanera = newStatus[4];
        handleUpdatePropiedadesComanda(newPropiedades);
    };
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedDoritos, setselectedDoritos] = useState(propiedadesComanda.selectedDoritos);

    const handleDropdownChange = (e) => {
        setselectedDoritos(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedDoritos = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    return (
        <div>
            <div>
                <DropDown opciones_in={doritosOptions} selectedValue={selectedDoritos} onDropdownChange={handleDropdownChange} precios={[30, 30, 30, 30, 30, 30, 30, 30, 30]}/>
            </div>
            
            <div className="row">
                <div className="col">
                    <ToogleButton_CheckButtons index={index} platillo='Burguer' tipo_ingrediente='aderezos' ingredientes_checkbutton={aderezos} despliegue='horizontal' toggleChecked_Status={toggleChecked_Status} setToggleChecked_Status={setToggleChecked_Status} statusCheckBoxes={statusAderezos} handleUpdateStatusCheckBoxes={handleUpdateStatusAderezos} />
                </div>
            </div>
        </div>
    );
};

export default Dorilocos;
