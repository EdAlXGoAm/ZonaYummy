import React, { useState } from 'react';

import DropDown from '../x10DropDown';
import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';

const Donas = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const proteinasOptions = [
        'Lechera',
        'Mermelada',
        'Cajeta',
        'Nutella',
        'Hersheys',
        'Ninguna',
        'Otra'
    ];
    const crocantesOptions = [
        'Fresas',
        'Durazno',
        'Ninguna',
        'Otra'
    ];
    const aderezos = [
        'Turin',
        'Gotas Bicolor',
        'Gotas Blancas',
        'Oreo',
        'Lunetas',
        'Laposse'
    ];

    const [statusAderezos, setStatusAderezos] = useState(
        [
            propiedadesComanda.cb_turin,
            propiedadesComanda.cb_gotas_bicolor,
            propiedadesComanda.cb_gotas_blancas,
            propiedadesComanda.cb_oreo,
            propiedadesComanda.cb_lunetas,
            propiedadesComanda.cb_laposse
        ]);
    
    const handleUpdateStatusAderezos = (newStatus) => {
        setStatusAderezos(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_turin = newStatus[0];
        newPropiedades.cb_gotas_bicolor = newStatus[1];
        newPropiedades.cb_gotas_blancas = newStatus[2];
        newPropiedades.cb_oreo = newStatus[3];
        newPropiedades.cb_lunetas = newStatus[4];
        newPropiedades.cb_laposse = newStatus[5];
        handleUpdatePropiedadesComanda(newPropiedades);
    };
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedBase, setselectedBase] = useState(propiedadesComanda.selectedBase);

    const handleDropdownChangeMaruchan = (e) => {
        setselectedBase(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedBase = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedFruta, setselectedFruta] = useState(propiedadesComanda.selectedFruta);

    const handleDropdownChange = (e) => {
        setselectedFruta(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.selectedFruta = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    return (
        <div>
        <div>
            <DropDown opciones_in={proteinasOptions} selectedValue={selectedBase} onDropdownChange={handleDropdownChangeMaruchan} precios={[40, 40, 40, 40, 40, 40, 40]}/>
        </div>
            <div>
                <DropDown opciones_in={crocantesOptions} selectedValue={selectedFruta} onDropdownChange={handleDropdownChange}/>
            </div>
            
            <div className="row">
                <div className="col">
                    <ToogleButton_CheckButtons index={index} platillo='Burguer' tipo_ingrediente='aderezos' ingredientes_checkbutton={aderezos} despliegue='horizontal' toggleChecked_Status={toggleChecked_Status} setToggleChecked_Status={setToggleChecked_Status} statusCheckBoxes={statusAderezos} handleUpdateStatusCheckBoxes={handleUpdateStatusAderezos} />
                </div>
            </div>
        </div>
    );
};

export default Donas;
