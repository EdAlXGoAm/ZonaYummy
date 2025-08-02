import './MeseroPage.css';
import React, { useState } from 'react';
import OrdersInterfaceTest from '../modules/Ordenes/MeseroPage/OrdersInterfaceTest';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';

const MeseroPageTest = ({ modeInterface }) => {

    return (
    <div className="App">
        <div className="container-fluid">
            <div className="row">
                <div className="col">
                <OrdersInterfaceTest modeInterface={modeInterface} />
                </div>
            </div>
        </div>
    </div>
    )
}

export default MeseroPageTest;