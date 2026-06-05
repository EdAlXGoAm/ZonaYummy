import './MeseroPage.css';
import React from 'react';
import CocinaNewFeaturesOrdersShell from '../modules/Ordenes/CocinaNewFeatures/CocinaNewFeaturesOrdersShell';

const CocinaNewFeaturesPage = () => {
    return (
        <div className="App" style={{ height: '100vh', overflow: 'hidden' }}>
            <div className="container-fluid" style={{ padding: 0, height: '100%' }}>
                <div className="row" style={{ margin: 0, height: '100%' }}>
                    <div className="col" style={{ padding: 0, height: '100%' }}>
                        <CocinaNewFeaturesOrdersShell />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CocinaNewFeaturesPage;

