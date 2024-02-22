import React, { useState } from 'react';

import DropDown from '../x10DropDown';
import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';

const HotDog = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const HotDogOptions = [
        'Sencillo',
        'Q Oaxaca',
        'Q Manchego',
        'Tocino',
        'Especial (Q Oaxaca, Tocino)',
        'Especial (Q Manchego, Tocino)',
    ];
    
    const vegetales = [
        'Jitomate',
        'Cebolla',
        'Chiles',
        ''
    ];
    const aderezos = [
        'Mayonesa',
        'Catsup',
        'Mostaza',
        ''
    ];

    const ingredientes_papas_opcional = [
        'Q Amarillo',
        'Mayonesa',
        'Catsup',
        'Valentina',
    ];

    const [statusVegetales, setStatusVegetales] = useState(
        [
            propiedadesComanda.cb_jitomate,
            propiedadesComanda.cb_cebolla,
            propiedadesComanda.cb_chiles,
            false
        ]);

    const handleUpdateStatusVegetales = (newStatus) => {
        setStatusVegetales(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_jitomate = newStatus[0];
        newPropiedades.cb_cebolla = newStatus[1];
        newPropiedades.cb_chiles = newStatus[2];
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    const [statusAderezos, setStatusAderezos] = useState(
        [
            propiedadesComanda.cb_mayonesa,
            propiedadesComanda.cb_catsup,
            propiedadesComanda.cb_mostaza,
            false
        ]);

    const handleUpdateStatusAderezos = (newStatus) => {
        setStatusAderezos(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_mayonesa = newStatus[0];
        newPropiedades.cb_catsup = newStatus[1];
        newPropiedades.cb_mostaza = newStatus[2];
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    const [switch_papas, setSwitchPapas] = useState(propiedadesComanda.switch_papas);

    const handleUpdateSwitchPapas = (newStatus) => {
        setSwitchPapas(newStatus);
        
        const newPropiedades = propiedadesComanda;
        newPropiedades.switch_papas = newStatus;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    const [statusIngredientes_Papas_Opcional, setStatusIngredientes_Papas_Opcional] = useState(
        [
            propiedadesComanda.papas_cb_qamarillo,
            propiedadesComanda.papas_cb_mayonesa,
            propiedadesComanda.papas_cb_catsup,
            propiedadesComanda.papas_cb_valentina,
        ]);

    const handleUpdateStatusIngredientes_Papas_Opcional = (newStatus) => {
        setStatusIngredientes_Papas_Opcional(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.papas_cb_qamarillo = newStatus[0];
        newPropiedades.papas_cb_mayonesa = newStatus[1];
        newPropiedades.papas_cb_catsup = newStatus[2];
        newPropiedades.papas_cb_valentina = newStatus[3];
        handleUpdatePropiedadesComanda(newPropiedades);
    };
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedHotDog, setselectedHotDog] = useState(propiedadesComanda.selectedHotDog);

    const handleDropdownChangeMaruchan = (e) => {
        setselectedHotDog(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedHotDog = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    const [hide_show_toggle, setToggleChecked] = useState(switch_papas)
    const [hide_show_display, setToggleDisplay] = useState(
        switch_papas ? 'block' : 'none'
    );

    const handleToggleChange = () => {
        if (hide_show_toggle) {
            setToggleDisplay('none');
        }
        else {
            setToggleDisplay('block');
        }
        setToggleChecked(!hide_show_toggle);
        handleUpdateSwitchPapas(!hide_show_toggle);
    };
    const hide_show_style = {
        display: hide_show_display,
    }

    const inputId = `togglePapas_${index}`;

    return (
        <div>
            <div>
                <DropDown opciones_in={HotDogOptions} selectedValue={selectedHotDog} onDropdownChange={handleDropdownChangeMaruchan} precios={[30, 38, 38, 38, 45, 45]}
                                                                                                                                    precios_papas={[50, 58, 58, 58, 65, 65]} hide_show_toggle={hide_show_toggle} setToggleChecked={setToggleChecked}/>
            </div>
            
            
            <div className="row">
                <div className="col">
                    <ToogleButton_CheckButtons index={index} platillo='Burguer' tipo_ingrediente='vegetales' ingredientes_checkbutton={vegetales} despliegue='horizontal' toggleChecked_Status={toggleChecked_Status} setToggleChecked_Status={setToggleChecked_Status} statusCheckBoxes={statusVegetales} handleUpdateStatusCheckBoxes={handleUpdateStatusVegetales} />
                </div>
                </div>
            <div className="row">
                <div className="col">
                    <ToogleButton_CheckButtons index={index} platillo='Burguer' tipo_ingrediente='aderezos' ingredientes_checkbutton={aderezos} despliegue='horizontal' toggleChecked_Status={toggleChecked_Status} setToggleChecked_Status={setToggleChecked_Status} statusCheckBoxes={statusAderezos} handleUpdateStatusCheckBoxes={handleUpdateStatusAderezos} />
                </div>
            </div>
            <hr />
            <div className="row">
                <div className="col">
                    <div className="custom-control custom-switch">
                        <input
                            type="checkbox"
                            className="custom-control-input"
                            id={inputId}
                            checked={hide_show_toggle} // Global Variable
                            onChange={handleToggleChange} // Event
                        />
                        <label className="custom-control-label" htmlFor={inputId}>Con papas</label>
                    </div>
                </div>
            </div>
            <div style={hide_show_style}>
                <div className="row">
                    <div className="col-6">
                        <img src="papas.png" alt="Papas Fritas"className="img-fluid" style={{ width: '150px' }}></img>
                    </div>
                    <div className="col-6">
                        <ToogleButton_CheckButtons index={index} platillo='Papas' tipo_ingrediente='aderezos' ingredientes_checkbutton={ingredientes_papas_opcional} despliegue='vertical' toggleChecked_Status={toggleChecked_Status} setToggleChecked_Status={setToggleChecked_Status} statusCheckBoxes={statusIngredientes_Papas_Opcional} handleUpdateStatusCheckBoxes={handleUpdateStatusIngredientes_Papas_Opcional} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotDog;
