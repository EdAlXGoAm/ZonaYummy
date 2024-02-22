import React, { useState } from 'react';

import DropDown from '../x10DropDown';
import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';

const Ensaladas = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const proteinasOptions = [
        'Pollo',
        'Atun',
        'Queso Panela'
    ];
    const crocantesOptions = [
        'Crotones',
        'Arandanos',
        'Ajonjoli',
        'Cacahuate'
    ];
    const aderezos = [
        'Miel con Mostaza',
        'Tamarindo'
    ];

    const [statusAderezos, setStatusAderezos] = useState(
        [
            propiedadesComanda.cb_miel_con_mostaza,
            propiedadesComanda.cb_tamarindo
        ]);

    const handleUpdateStatusAderezos = (newStatus) => {
        setStatusAderezos(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_miel_con_mostaza = newStatus[0];
        newPropiedades.cb_tamarindo = newStatus[1];
        handleUpdatePropiedadesComanda(newPropiedades);
    }
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedProteina, setselectedProteina] = useState(propiedadesComanda.selectedProteina);

    const handleDropdownChangeMaruchan = (e) => {
        setselectedProteina(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedProteina = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedCrocante, setselectedCrocante] = useState(propiedadesComanda.selectedCrocante);

    const handleDropdownChange = (e) => {
        setselectedCrocante(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.selectedCrocante = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    return (
        <div>
        <div>
            <DropDown opciones_in={proteinasOptions} selectedValue={selectedProteina} onDropdownChange={handleDropdownChangeMaruchan} precios={[50, 50, 50]}/>
        </div>
            <div>
                <DropDown opciones_in={crocantesOptions} selectedValue={selectedCrocante} onDropdownChange={handleDropdownChange}/>
            </div>
            
            <div className="row">
                <div className="col">
                    <ToogleButton_CheckButtons index={index} platillo='Burguer' tipo_ingrediente='aderezos' ingredientes_checkbutton={aderezos} despliegue='horizontal' toggleChecked_Status={toggleChecked_Status} setToggleChecked_Status={setToggleChecked_Status} statusCheckBoxes={statusAderezos} handleUpdateStatusCheckBoxes={handleUpdateStatusAderezos} />
                </div>
            </div>
        </div>
    );
};

export default Ensaladas;
