import React, { useState, useEffect } from 'react';
import checkbox_css from '../css/checkbox.css'; //La ruta de este archivo es: src/css/checkbox.css

const CheckButton_Ingredientes = ({ index, opciones_in, toggleChecked, despliegue, toggleChecked_Status, setToggleChecked_Status, statusCheckBoxes, handleUpdateStatusCheckBoxes }) => {
    // Asignar opciones_in directamente a opciones
    const opcionesPredeterminadas = ['Opciones'];
    const opciones = opciones_in && opciones_in.length > 0 ? opciones_in : opcionesPredeterminadas;

    // Mantén un estado local para cada checkbox
    const [checkboxStates, setCheckboxStates] = useState(statusCheckBoxes);

    // Función para manejar el cambio de estado de un checkbox individual
    const handleCheckboxChange = (index) => {
        if (!toggleChecked) {
            const newCheckboxStates = [...checkboxStates];
            newCheckboxStates[index] = !checkboxStates[index];
            setCheckboxStates(newCheckboxStates);
            handleUpdateStatusCheckBoxes(newCheckboxStates);
        }
    };

    // Actualiza el estado de los checkboxes cuando toggleChecked cambia
    useEffect(() => {
      if (toggleChecked) {
        const newCheckboxStates = opciones.map(() => true);
        setCheckboxStates(newCheckboxStates);
        handleUpdateStatusCheckBoxes(newCheckboxStates);
      }
    }, [toggleChecked]);

    return (
        <div className="row">
            <div className="col">
                {/* Align text to left, padding left */}
                {despliegue==='vertical' &&
                <div style={{ textAlign: "left"}}>
                    {opciones.map((opcion, local_index) => (
                        <div key={local_index}>
                            <label className={"container"}>
                                <div 
                                style={{
                                    paddingLeft: "15px",
                                    borderRadius: "10px",
                                    background: checkboxStates[local_index] ? (toggleChecked_Status ? '#2D2D2D' : '#38E54D') : '' ,
                                    color: checkboxStates[local_index] ? 'black' : 'grey'
                                    }}>
                                    {opcion}
                                </div>
                                <input
                                    type="checkbox"
                                    id={`${index}_opcion_${local_index}`}
                                    checked={checkboxStates[local_index]}
                                    onChange={() => handleCheckboxChange(local_index)}
                                    disabled={toggleChecked}/>
                                <span className={`checkmark ${toggleChecked_Status ? 'true' : ''}`}></span>
                            </label>
                        </div>
                    ))}
                </div>
                }
                {despliegue==='horizontal' &&
                <div style={{ textAlign: "left"}}>
                    <div className="row">
                        {/* Desplegar la mitad en un col-6 y la otra mitad en otro col-6 */}
                        <div className="col-6">
                            {/* Solo hacer map a la mitad */}
                            {opciones.slice(0, opciones.length/2).map((opcion, local_index) => (
                                <div key={local_index}>
                                    <label className={"container"}>
                                        <div 
                                        style={{
                                            paddingLeft: "15px",
                                            borderRadius: "10px",
                                            background: checkboxStates[local_index] ? (toggleChecked_Status ? '#2D2D2D' : '#38E54D') : '' ,
                                            color: checkboxStates[local_index] ? 'black' : 'grey'
                                            }}>
                                            {opcion}
                                        </div>
                                        <input
                                            type="checkbox"
                                            id={`${index}_opcion_${local_index}`}
                                            checked={checkboxStates[local_index]}
                                            onChange={() => handleCheckboxChange(local_index)}
                                            disabled={toggleChecked}/>
                                        <span className={`checkmark ${toggleChecked_Status ? 'true' : ''}`}></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="col-6">
                            {/* Ahora hacer map a la otra mitad */}
                            {opciones.slice(opciones.length/2, opciones.length).map((opcion, local_index) => (
                                <div key={local_index}>
                                    <label className={"container"}>
                                        <div 
                                        style={{
                                            paddingLeft: "15px",
                                            borderRadius: "10px",
                                            background: checkboxStates[local_index+opciones.length/2] ? (toggleChecked_Status ? '#2D2D2D' : '#38E54D') : '' ,
                                            color: checkboxStates[local_index+opciones.length/2] ? 'black' : 'grey'
                                            }}>
                                            {opcion}
                                        </div>
                                        <input
                                            type="checkbox"
                                            id={`${index}_opcion_${local_index+opciones.length/2}`}
                                            checked={checkboxStates[local_index+opciones.length/2]}
                                            onChange={() => handleCheckboxChange(local_index+opciones.length/2)}
                                            disabled={toggleChecked}/>
                                        <span className={`checkmark ${toggleChecked_Status ? 'true' : ''}`}></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                }
            </div>
        </div>
    );
};

export default CheckButton_Ingredientes;
