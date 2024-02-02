import React, { useState, useEffect } from 'react';
import './TablaCostoInsumo.css'
const TablaCostoInsumo = ({ingrediente, index_list, updateCostoIngrediente, updateCostoTotalInsumos}) => {
    
    const [costo_calculado, setCostoCalculado] = useState(0);
    const costoCalculation = (precio_unidad, cantidad_usada,) => {
        const calculo = precio_unidad * cantidad_usada;
        setCostoCalculado(calculo);
        updateCostoIngrediente(ingrediente, cantidad_usada, calculo)
        updateCostoTotalInsumos();
    }
    return(
        <div className="container-fluid containerTablaCostoInsumo">
            <div className="row datos_ingrediente">
                <div className="col-4 ing_table">
                        <p className="IngredienteTitle" style={{backgroundColor: index_list % 2 ? "#64faff" : "#ffb6ee"}}>{ingrediente.Producto}</p>
                </div>
                <div className="col-4 ing_table">
                        <p className="HeaderUnidad">{ingrediente.Unidad}</p>
                        <p className="BodyUnidad">{ingrediente.Cantidad} {
                        ingrediente.Unidad === "Volumen" ? "Lt" :
                        ingrediente.Unidad === "Peso" ? "kg" :
                        ingrediente.Unidad === "Piezas" ? "pz" : null}</p>
                </div>
                <div className="col-4 ing_table">
                        <p className="HeaderPrice">$</p>
                        <p className="BodyPrice">{ingrediente.Precio}</p>
                </div>
            </div>
            <div className="row">
                <p><strong>Precio por Unidad</strong> = $
                {ingrediente.PrecioPorUnidad.toFixed(3)}/{
                ingrediente.Unidad === "Volumen" ? "ml" :
                ingrediente.Unidad === "Peso" ? "gr" :
                ingrediente.Unidad === "Piezas" ? "pz" : null}</p>
            </div>
            <div className="row">
                <div className="col-2">
                    <label className="CantidadUsadaLabel" htmlFor="CantidadUsada">Cantidad {
                ingrediente.Unidad === "Volumen" ? "ml" :
                ingrediente.Unidad === "Peso" ? "gr" :
                ingrediente.Unidad === "Piezas" ? "pz" : null}</label>
                </div>
                <div className="col-6">
                    <input type="text" className="form-control" id="CantidadUsada"
                    placeholder={"Cantidad"} onChange={(e) => 
                    costoCalculation(ingrediente.PrecioPorUnidad, e.target.value)} />
                </div>
                <div className="col-4">
                    <p>Costo: ${costo_calculado.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
}

export default TablaCostoInsumo;