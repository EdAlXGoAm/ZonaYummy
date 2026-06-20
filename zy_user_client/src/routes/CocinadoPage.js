import './MeseroPage.css';
import React from 'react';
import CocinadosOrdersShell from '../modules/Ordenes/Cocinados/CocinadosOrdersShell';

const CocinadoPage = () => {
    return (
        <div className="App" style={{ height: '100vh', overflow: 'auto' }}>
            <div className="container-fluid" style={{ padding: 0, minHeight: '100%' }}>
                <div className="row" style={{ margin: 0 }}>
                    <div className="col" style={{ padding: 0 }}>
                        <CocinadosOrdersShell />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CocinadoPage;
