import './MeseroPage.css';
import React from 'react';
import MeseroOrdersShell from '../modules/Ordenes/Mesero/MeseroOrdersShell';

const MeseroPage = ({ modeInterface }) => {

    return (
    <div className={`App${modeInterface ? ' mesero-app-root' : ''}`}>
        <div className="container-fluid h-100">
            <div className="row h-100">
                <div className="col h-100">
                <MeseroOrdersShell modeInterface={modeInterface} />
                </div>
            </div>
        </div>
    </div>
    )
}

export default MeseroPage;