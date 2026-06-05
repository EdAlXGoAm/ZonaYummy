import './MeseroPage.css';
import React, { useState } from 'react';
import MeseroOrdersShell from '../modules/Ordenes/Mesero/MeseroOrdersShell';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';

const MeseroPage = ({ modeInterface }) => {

    return (
    <div className="App">
        <div className="container-fluid">
            <div className="row">
                <div className="col">
                <MeseroOrdersShell modeInterface={modeInterface} />
                </div>
            </div>
        </div>
    </div>
    )
}

export default MeseroPage;