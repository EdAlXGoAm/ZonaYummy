import React, { useState, useEffect, useRef } from 'react';
import './CalcularPrecios.css'
import TablaCostoInsumo from './TablaCostoInsumoModule'

const CalcularPrecios = ({ListaIngredientes, updateCostoIngrediente}) => {
    const [costoTotalInsumos, setCostoTotalInsumos] = useState(0);
    const [numColsForCalculator, setNumColsForCalculator] = useState (4);
    const containerCalculatorRef = useRef(null);
    const updateCostoTotalInsumos = () => {
        // Sumar todos los CostoCalculado
        let sum = 0;
        ListaIngredientes.forEach((ingrediente, index) => {
            sum += ingrediente.CostoCalculado;
        });
        setCostoTotalInsumos(sum);
    }
    
    const containerRef = useRef(null);
    const [numColsForCalculatorFormPart1, setNumColsForCalculatorFormPart1] = useState (12);
    const updateNumColsForCalculatorFormPart1 = (width) => {
        // console.log(`Width: ${width}`)
        const variantWidth = 900;
        // console.log(`checkBoxWidth: ${variantWidth}`)
        const newNumColsForCalculatorFormPart1 = Math.floor(variantWidth / width * 12);
        setNumColsForCalculatorFormPart1(prevNumColsForCalculatorFormPart1 => {
            // console.log(`Columnas por Calculadora: ${newNumColsForCalculatorFormPart1 > 0 ? newNumColsForCalculatorFormPart1 : 1}`)
            return newNumColsForCalculatorFormPart1 < 12 ? newNumColsForCalculatorFormPart1 : 12;
        });
    };

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                updateNumColsForCalculatorFormPart1(width);
            }
        });
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, []);
    return(
        <div className="row" ref={containerRef}>
            <div className={`col-${numColsForCalculatorFormPart1} calculadora`}><div className="row">

                <div className="col-12"><div className="row">
                    <h3 className="CalculadoraTitle">Calculemos el precio de un Platillo</h3>
                </div></div> {/* Col 12 Title*/}

                <div className="col-12"><div className="row">
                    <form className="FormCalculadora" onSubmit={null}> {/* addPlatillo */}
                        <div className="form-group">
                            <label htmlFor="NombrePlatillo">Nombre Platilo</label>
                            <input type="text" className="form-control" id="NombrePlatillo" placeholder="NombrePlatillo" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Cantidad">Cantidad a vender</label>
                            <input type="text" className="form-control" id="Cantidad" placeholder="Cantidad" />
                        </div>
                        <div className="form-group">
                        {
                            ListaIngredientes.map((ingrediente, index) => {
                            return(
                                <TablaCostoInsumo key={index} ingrediente={ingrediente} index_list={index} updateCostoIngrediente={updateCostoIngrediente} updateCostoTotalInsumos={updateCostoTotalInsumos} />
                            );})
                        }
                        </div>
                        <div className="form-group">
                            <p className="costoTotalInsumos">Costo Insumos: ${costoTotalInsumos.toFixed(2)}</p>
                        </div>
                        <div className="form-group">
                            <button type="submit" className="btn btn-primary">Guardar Precio</button>
                        </div>
                    </form>
                </div></div> {/* Col 12  Form */}

            </div> </div>
        </div>
    );
}

export default CalcularPrecios;