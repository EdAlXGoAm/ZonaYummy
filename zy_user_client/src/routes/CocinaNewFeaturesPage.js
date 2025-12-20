import './MeseroPage.css';
import React from 'react';
import OrdersInterfaceNewFeatures from '../modules/Ordenes/CocinaNewFeatures/OrdersInterfaceNewFeatures';

const CocinaNewFeaturesPage = () => {
    return (
        <div className="App">
            <div className="container-fluid">
                <div className="row">
                    <div className="col">
                        <OrdersInterfaceNewFeatures />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CocinaNewFeaturesPage;

