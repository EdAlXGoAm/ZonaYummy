import './MeseroPage.css';
import React from 'react';
import MeseroOrdersShell from '../modules/Ordenes/Mesero/MeseroOrdersShell';
import { useMeseroAppShell } from '../modules/Ordenes/Mesero/useMeseroAppShell';
import '../modules/Ordenes/Mesero/meseroAppShell.css';

const MeseroPage = ({ modeInterface }) => {
    useMeseroAppShell(modeInterface);

    if (modeInterface) {
        return (
            <div className="mesero-app-shell">
                <div className="mesero-app-scroll">
                    <MeseroOrdersShell modeInterface={modeInterface} />
                </div>
            </div>
        );
    }

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
    );
};

export default MeseroPage;
