import React, { useState } from 'react';

import DropDown from '../x10DropDown';
import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';

const Sincronizadas = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const Label = ["Orden de 2"];
    
    const vegetales = [
        'Lechuga',
        'Jitomate',
        'Q Amarillo',
        'Chile'
    ];
    const aderezos = [
        'Mayonesa',
        'Catsup'
    ];

    const ingredientes_papas_opcional = [
        'Q Amarillo',
        'Mayonesa',
        'Catsup',
        'Valentina',
    ];
    
    const [statusVegetales, setStatusVegetales] = useState(
        [
            propiedadesComanda.cb_lechuga,
            propiedadesComanda.cb_jitomate,
            propiedadesComanda.cb_qamarillo,
            propiedadesComanda.cb_chile
        ]);

    const handleUpdateStatusVegetales = (newStatus) => {
        setStatusVegetales(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_lechuga = newStatus[0];
        newPropiedades.cb_jitomate = newStatus[1];
        newPropiedades.cb_qamarillo = newStatus[2];
        newPropiedades.cb_chile = newStatus[3];
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    const [statusAderezos, setStatusAderezos] = useState(
        [
            propiedadesComanda.cb_mayonesa,
            propiedadesComanda.cb_catsup
        ]);
    
    const handleUpdateStatusAderezos = (newStatus) => {
        setStatusAderezos(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_mayonesa = newStatus[0];
        newPropiedades.cb_catsup = newStatus[1];
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

    const [hide_show_toggle, setToggleChecked] = useState(switch_papas);
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

    const precios = [45];
    const precios_papas = [60];

    return (
        <div>
            <div className="row">
                <div className="col">
                    <label htmlFor="PayDeLimón"  style={{ fontWeight: 'bold', fontSize: '30px', border: '1px solid #2d2d2d', borderRadius: '15px', padding: '15px', width: '100%'
                }}>
                    <span style={{ color: 'red' }}>
                        {hide_show_toggle
                        ? (precios_papas && precios_papas.length > 0 ? `$${precios_papas[0]} ` : '')
                        : (precios && precios.length > 0 ? `$${precios[0]} ` : '')}
                    </span>
                    <span style={{ color: 'black' }}>
                    {Label}
                    </span>
                    </label>
                </div>
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

export default Sincronizadas;
