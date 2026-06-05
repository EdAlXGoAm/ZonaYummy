import './MeseroPage.css';
import React from 'react';
import CocinaBebidasOrdersShell from '../modules/Ordenes/CocinaBebidas/CocinaBebidasOrdersShell';

const CocinaBebidasPage = () => {
    return (
        <div className="App">
            <div className="container-fluid">
                <div className="row">
                    <div className="col">
                        <CocinaBebidasOrdersShell />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CocinaBebidasPage;

