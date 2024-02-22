import React from 'react';

const IngredientesAndQuesos = ({ selectedSabor, ingredientesPorSabor }) => {
    let ingredientes = '';
    let quesos = '';

    const ingredientListStyle = {
        listStyle: 'none',
        color: 'white',
        textDecoration: 'underline',
        fontWeight: 'bold',
    };
    const ingredientes_fijos_style = {
        backgroundColor: 'black',
        borderRadius: '5px',
    };

    // Obtén los ingredientes y quesos del sabor seleccionado
    if (selectedSabor) {
        ingredientes = ingredientesPorSabor[`array_${selectedSabor}`][0];
        quesos = ingredientesPorSabor[`array_${selectedSabor}`][1];
    }

    const arr_ingredientes = ingredientes.split(", ");
    const arr_quesos = quesos.split(", ");

    return (
        <div>
            <div className="row">
                <div className="col-6" style={{paddingLeft: '5px', paddingRight: '5px'}}>
                    {arr_ingredientes.map((ingrediente, index) => (
                        <div className="row mb-1">
                            <div className="col">
                                <div style={ingredientes_fijos_style}>
                                    &nbsp;
                                    <a style={ingredientListStyle}>{ingrediente}</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="col-6" style={{paddingLeft: '5px', paddingRight: '5px'}}>
                    {arr_quesos.map((queso, index) => (
                        <div className="row mb-1">
                            <div className="col">
                                <div style={ingredientes_fijos_style}>
                                    &nbsp;
                                    <a style={ingredientListStyle}>{queso}</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IngredientesAndQuesos;
