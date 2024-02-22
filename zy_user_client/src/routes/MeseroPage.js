import './MeseroPage.css';
import React, { useState } from 'react';
import OrdersInterface from '../modules/Ordenes/MeseroPage/OrdersInterface';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';

const MeseroPage = ({ modeInterface }) => {

    return (
    <div className="App">
        <div className="container-fluid">
            <div className="row">
                <div className="col">
                <OrdersInterface modeInterface={modeInterface} />
                </div>
            </div>
        </div>
    </div>
    )
}

export default MeseroPage;