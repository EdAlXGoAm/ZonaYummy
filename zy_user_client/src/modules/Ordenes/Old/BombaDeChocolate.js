import React, { useState } from 'react';


const BombaDeChocolate = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const Label = ["Bomba de Chocolate"];
    
    return (
        <div>
            <div className="row">
                <div className="col">
                    <label htmlFor="BombaDeChocolate"  style={{ fontWeight: 'bold', fontSize: '30px', border: '1px solid #2d2d2d', borderRadius: '15px', padding: '15px', width: '100%'
                }}>
                <span style={{ color: 'red' }}>
                    $45
                </span>
                <span style={{ color: 'black' }}>
                &nbsp;{Label}
                </span>
                </label>
                </div>
            </div>
        </div>
    );
};

export default BombaDeChocolate;
