import './MeseroPage.css';
import React from 'react';
import OrdersInterfaceBebidasWaffles from '../modules/Ordenes/MeseroPage/OrdersInterfaceBebidasWaffles';

const CocinaBebidasPage = () => {
    return (
        <div className="App">
            <div className="container-fluid">
                <div className="row">
                    <div className="col">
                        <OrdersInterfaceBebidasWaffles />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CocinaBebidasPage;

