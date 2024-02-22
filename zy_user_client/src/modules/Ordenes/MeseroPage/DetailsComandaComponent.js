import './DetailsComanda.css';
import './../Global/checkbox.css'; //La ruta de este archivo es: src/css/checkbox.css
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faPenToSquare, faBan} from '@fortawesome/free-solid-svg-icons';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';

import DropDown from './../x10DropDown';

const DetailsComanda = ({Comanda, updateComanda}) => {

    const calcularComandaPrecio = (comanda) => {
        const indexVariante = comanda.Details.SelectedVariant;
        const variante = comanda.Details.Variants[indexVariante];
        let Precio = variante.Precio;
        for (let componente of variante.Componentes) {
            !componente.Checked && (Precio += componente.Precio);
            console.log(`Componente: ${componente.Precio}`);
        }
        for (let opcioon of variante.Opciones) {
            const indexItem = opcioon.SelectedItem;
            Precio += opcioon.Items[indexItem].Precio;
            console.log(`Opcion.Item: ${opcioon.Items[indexItem].Precio}`);
        }
        for (let extra of variante.Extras) {
            extra.Checked && (Precio += extra.Precio);
            console.log(`Componente: ${extra.Precio}`);
        }
        for (let adicional of variante.Adicionales) {
            adicional.Checked && (Precio += adicional.Precio);
            console.log(`Componente: ${adicional.Precio}`);
        }
        const newComanda = {...comanda, Precio: Precio};
        return newComanda;
    }

    const handleVariantDropdownChange = (variantList, event) => {
        console.log(`Variant e: `, event)
        // Search the index of e.target.value
        const newIndex = variantList.indexOf(event.value);
        // Update the SelectedVariant
        const newComanda = Comanda;
        newComanda.Details.SelectedVariant = newIndex;
        const newComandaPriced = calcularComandaPrecio(newComanda);
        updateComanda(newComandaPriced);
    };

    const handleOpcionDropdownChange = (itemsList, indexOpcion, event) => {
        console.log(`Opcion e: `, event)
        // Search the index of e.target.value
        const newIndex = itemsList.indexOf(event.value);
        // Update the SelectedVariant
        const newComanda = Comanda;
        const indexVariant = Comanda.Details.SelectedVariant;
        newComanda.Details.Variants[indexVariant].Opciones[indexOpcion].SelectedItem = newIndex;
        const newComandaPriced = calcularComandaPrecio(newComanda);
        updateComanda(newComandaPriced);
    };
    
    const handleVariantComponente = (indexComponente, event) => {
        console.log(`Component e: `, event)
        // Update the SelectedVariant
        const newComanda = Comanda;
        const indexVariant = Comanda.Details.SelectedVariant;
        newComanda.Details.Variants[indexVariant].Componentes[indexComponente].Checked = event.target.checked;
        const newComandaPriced = calcularComandaPrecio(newComanda);
        updateComanda(newComandaPriced);
    };

    const cancelVariantComponentes = () => {
        // Update the SelectedVariant
        const newComanda = Comanda;
        const indexVariant = Comanda.Details.SelectedVariant;
        for (let i = 0; i < newComanda.Details.Variants[indexVariant].Componentes.length; i++) {
            newComanda.Details.Variants[indexVariant].Componentes[i].Checked = true;
        }
        const newComandaPriced = calcularComandaPrecio(newComanda);
        updateComanda(newComandaPriced);
    };

    const handleVariantIngredienteItem = (indexIngrediente, indexItem, event) => {
        console.log(`Component e: `, event)
        // Update the SelectedVariant
        const newComanda = Comanda;
        const indexVariant = Comanda.Details.SelectedVariant;
        newComanda.Details.Variants[indexVariant].Ingredientes[indexIngrediente].Items[indexItem].Checked = event.target.checked;
        updateComanda(newComanda);
    };

    const handleVariantIngredientesItemAll = (indexIngrediente) => {
        const newComanda = Comanda;
        const indexVariant = Comanda.Details.SelectedVariant;
        newComanda.Details.Variants[indexVariant].Ingredientes[indexIngrediente].Items.map((item, indexItem) => {
            console.log(`item.Name: ${item.Name} - itemIndex: ${newComanda.Details.Variants[indexVariant].Ingredientes[indexIngrediente].Items[indexItem].Checked}`);
            newComanda.Details.Variants[indexVariant].Ingredientes[indexIngrediente].Items[indexItem].Checked = true;
        });
        updateComanda(newComanda);
    };

    const handleVariantExtra = (indexExtra, event) => {
        console.log(`Component e: `, event)
        // Update the SelectedVariant
        const newComanda = Comanda;
        const indexVariant = Comanda.Details.SelectedVariant;
        newComanda.Details.Variants[indexVariant].Extras[indexExtra].Checked = event.target.checked;
        const newComandaPriced = calcularComandaPrecio(newComanda);
        updateComanda(newComandaPriced);
    };

    const cancelVariantExtras = () => {
        // Update the SelectedVariant
        const newComanda = Comanda;
        const indexVariant = Comanda.Details.SelectedVariant;
        for (let i = 0; i < newComanda.Details.Variants[indexVariant].Extras.length; i++) {
            newComanda.Details.Variants[indexVariant].Extras[i].Checked = false;
        }
        const newComandaPriced = calcularComandaPrecio(newComanda);
        updateComanda(newComandaPriced);
    };

    const handleVariantAdicional = (indexAdicional, event) => {
        console.log(`Component e: `, event)
        // Update the SelectedVariant
        const newComanda = Comanda;
        const indexVariant = Comanda.Details.SelectedVariant;
        newComanda.Details.Variants[indexVariant].Adicionales[indexAdicional].Checked = event.target.checked;
        const newComandaPriced = calcularComandaPrecio(newComanda);
        updateComanda(newComandaPriced);
    };

    const handleVariantAdicionalOpcionDropdownChange = (optionList, indexAdicional, event) => {
        console.log(`Opcion e: `, event)
        // Search the index of e.target.value
        const newIndex = optionList.indexOf(event.value);
        // Update the SelectedVariant
        const newComanda = Comanda;
        const indexVariant = Comanda.Details.SelectedVariant;
        newComanda.Details.Variants[indexVariant].Adicionales[indexAdicional].SelectedOpcion = newIndex;
        updateComanda(newComanda);
    };

    const cancelVariantAdicionales = () => {
        // Update the SelectedVariant
        const newComanda = Comanda;
        const indexVariant = Comanda.Details.SelectedVariant;
        for (let i = 0; i < newComanda.Details.Variants[indexVariant].Adicionales.length; i++) {
            newComanda.Details.Variants[indexVariant].Adicionales[i].Checked = false;
        }
        const newComandaPriced = calcularComandaPrecio(newComanda);
        updateComanda(newComandaPriced);
    };

    // COMPONENTS ** F O L D **
    const [componentsIsExpanded, setComponentsIsExpanded] = useState(false);
    const fetchComponentsExpanded = () => {
        let anyFalse = false;
        const indexVariant = Comanda.Details.SelectedVariant;
        for (let i = 0; i < Comanda.Details.Variants[indexVariant].Componentes.length; i++) {
            if (Comanda.Details.Variants[indexVariant].Componentes[i].Checked === false){
                anyFalse = true;
                break;
            }
        };
        if (anyFalse === true) {
            setComponentsIsExpanded(true);
        }
        else {
            setComponentsIsExpanded(false);
        }
    };
    useEffect(() => {
        fetchComponentsExpanded();
    }, [Comanda]);
    const toggleComponentsIsExpanded = () => {
        if (componentsIsExpanded) {
            const confirm = window.confirm("Deseas cancelar la personalización?");
            if (confirm) {
                cancelVariantComponentes();
                setComponentsIsExpanded(prevComponentsIsExpanded => !prevComponentsIsExpanded);
            }
        }
        else {
            setComponentsIsExpanded(prevComponentsIsExpanded => !prevComponentsIsExpanded);
        }
    };
    
    // EXTRAS ** F O L D **
    const [extrasIsExpanded, setExtrasIsExpanded] = useState(false);
    const fetchExtrasExpanded = () => {
        let anyTrue = false;
        const indexVariant = Comanda.Details.SelectedVariant;
        for (let i = 0; i < Comanda.Details.Variants[indexVariant].Extras.length; i++) {
            if (Comanda.Details.Variants[indexVariant].Extras[i].Checked === true){
                anyTrue = true;
                break;
            }
        };
        if (anyTrue === true) {
            setExtrasIsExpanded(true);
        }
        else {
            setExtrasIsExpanded(false);
        }
    };
    useEffect(() => {
        fetchExtrasExpanded();
    }, [Comanda]);
    const toggleExtrasIsExpanded = () => {
        if (extrasIsExpanded) {
            const confirm = window.confirm("Deseas cancelar los ing. extras?");
            if (confirm) {
                cancelVariantExtras();
                setExtrasIsExpanded(prevExtrasIsExpanded => !prevExtrasIsExpanded);
            }
        }
        else {
            setExtrasIsExpanded(prevExtrasIsExpanded => !prevExtrasIsExpanded);
        }
    };
    
    // ADICIONALES ** F O L D **
    const [adicionalesIsExpanded, setAdicionalesIsExpanded] = useState(false);
    const fetchAdicionalesExpanded = () => {
        let anyTrue = false;
        const indexVariant = Comanda.Details.SelectedVariant;
        for (let i = 0; i < Comanda.Details.Variants[indexVariant].Adicionales.length; i++) {
            if (Comanda.Details.Variants[indexVariant].Adicionales[i].Checked === true){
                anyTrue = true;
                break;
            }
        };
        if (anyTrue === true) {
            setAdicionalesIsExpanded(true);
        }
        else {
            setAdicionalesIsExpanded(false);
        }
    };
    useEffect(() => {
        fetchAdicionalesExpanded();
    }, [Comanda]);
    const toggleAdicionalesIsExpanded = () => {
        if (adicionalesIsExpanded) {
            const confirm = window.confirm("Deseas cancelar los adicionales?");
            if (confirm) {
                cancelVariantAdicionales();
                setAdicionalesIsExpanded(prevAdicionalesIsExpanded => !prevAdicionalesIsExpanded);
            }
        }
        else {
            setAdicionalesIsExpanded(prevAdicionalesIsExpanded => !prevAdicionalesIsExpanded);
        }
    };
    
    //  CHECKBOX == RESPONSIVE ==
    const [numCheckBoxPerRow, setNumCheckBoxPerRow] = useState (1);
    const containerRef = useRef(null);
    const updateNumCheckBoxPerRow = (width) => {
        const checkBoxWidth = 500;
        const newNumCheckBoxPerRow = Math.floor(width / checkBoxWidth)*2;
        setNumCheckBoxPerRow(prevNumCheckBoxPerRow => {
            return newNumCheckBoxPerRow > 0 ? newNumCheckBoxPerRow : 1;
        });
    };
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                updateNumCheckBoxPerRow(width);
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
    }, [componentsIsExpanded]);

    return (
        <div>
            <DropDown
                opciones_in={Comanda.Details.Variants.map((variant, indexVariant) => (variant.VariantName))}
                selectedValue={Comanda.Details.Variants[Comanda.Details.SelectedVariant].VariantName}
                onDropdownChange={(e) => handleVariantDropdownChange(Comanda.Details.Variants.map((variant, indexVariant) => (variant.VariantName)), e)}
                prefix={Comanda.Details.Variants.map((variant, indexVariant) => (variant.Precio))}/>
            {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Componentes.length > 0 && (
                <div>
                    <div className="row d-flex align-items-center personalizarTitle">
                        <div className="faButton" onClick={toggleComponentsIsExpanded} style={{ cursor: 'pointer' }}>
                        { componentsIsExpanded ? <FontAwesomeIcon icon={faBan} size="sm" /> : <FontAwesomeIcon icon={faPenToSquare} size="sm" /> }
                        </div>
                        <h2 className="titleOption" onClick={toggleComponentsIsExpanded} style={{ cursor: 'pointer' }}>Personalizar</h2>
                    </div>
                    {componentsIsExpanded && (
                    <div>
                        <div className="row" ref={containerRef}>
                            {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Componentes.map((componente, indexComponente) => (
                                <div key={indexComponente} className={`col-${12/numCheckBoxPerRow}`}>
                                    <label className="container">
                                        <div>
                                            {componente.Name ? componente.Name : "Nombre Componente"}
                                            <span style={{color: "red"}}>{componente.Precio !== 0 ? (<strong> ${componente.Precio}</strong>) : ''}</span>
                                        </div>
                                        <input type="checkbox" id="Checked" checked={componente.Checked} onChange={(e) => handleVariantComponente(indexComponente, e)}/>
                                        <span className="checkmark"></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}
                    <hr/>
                </div>
            )}
            {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Opciones.map((opcion, indexOpcion) => (
                <div key={indexOpcion}>
                <h2 className="titleComponents">{opcion.Name.toUpperCase()}</h2>
                <DropDown
                    opciones_in={opcion.Items.map((item, indexItem) => (item.Name))}
                    selectedValue={opcion.Items[opcion.SelectedItem].Name} 
                    onDropdownChange={(e) => handleOpcionDropdownChange(opcion.Items.map((item, indexItem) => (item.Name)), indexOpcion, e)}
                    prefix={opcion.Items.map((item, indexItem) => (item.Precio))}/>
                </div>
            ))}
            {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Opciones.length > 0 && (<hr/>)}
            {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Ingredientes.length > 0 && (
                <div>
                    <div className="row"><div className="col">
                        <h2 className="titleIngredientes">INGREDIENTES</h2>
                    </div></div>
                    {true && (
                        <div>{Comanda.Details.Variants[Comanda.Details.SelectedVariant].Ingredientes.map((ingrediente, indexIngrediente) => (
                            <div key={indexIngrediente}>
                                <div className="row"><div className="col">
                                    <h2 className="titleOption">{ingrediente.Name}</h2>
                                </div></div>
                                <div className="conTodo">
                                    <button className="conTodoBtn" onClick={() => handleVariantIngredientesItemAll(indexIngrediente)}>
                                        <FontAwesomeIcon style={{color: "#000000"}} icon={faListCheck} size="xl" />{` Marcar Todo`}
                                    </button>
                                </div>
                                <div className="row" ref={containerRef}>
                                {ingrediente.Items.map((item, indexItem) => (
                                    <div key={indexItem} className={`col-${12/numCheckBoxPerRow}`}>
                                        <label className="container">
                                            <div> {item.Name ? item.Name : "Nombre Ingrediente"} </div>
                                            <input type="checkbox" id="Checked" checked={item.Checked} onChange={(e) => handleVariantIngredienteItem(indexIngrediente, indexItem, e)}/>
                                            <span className="checkmark"></span>
                                        </label>
                                    </div>
                                ))}
                                </div>
                            </div>
                        ))}</div>
                    )}
                    <hr/>
                </div>
            )}
            {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Extras.length > 0 && (
                <div>
                    <div className="row d-flex align-items-center personalizarTitle">
                        <div className="faButton" onClick={toggleExtrasIsExpanded} style={{ cursor: 'pointer' }}>
                        { extrasIsExpanded ? <FontAwesomeIcon icon={faBan} size="sm" /> : <FontAwesomeIcon icon={faPenToSquare} size="sm" /> }
                        </div>
                        <h2 className="titleOption" onClick={toggleExtrasIsExpanded} style={{ cursor: 'pointer' }}>Ingrediente Extra</h2>
                    </div>
                    {extrasIsExpanded && (
                    <div>
                        <div className="row" ref={containerRef}>
                            {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Extras.map((extra, indexExtra) => (
                                <div key={indexExtra} className={`col-${12/numCheckBoxPerRow}`}>
                                    <label className="container">
                                        <div> 
                                            {extra.Extra ? extra.Extra : "Nombre Ing Extra"}
                                            <span style={{color: "red"}}>{extra.Precio !== 0 ? (<strong> ${extra.Precio}</strong>) : ''}</span>
                                        </div>
                                        <input type="checkbox" id="Checked" checked={extra.Checked} onChange={(e) => handleVariantExtra(indexExtra, e)}/>
                                        <span className="checkmark"></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}
                    {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Adicionales.length > 0 && (<hr/>)}
                </div>
            )}
            {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Adicionales.length > 0 && (
                <div>
                    <div className="row d-flex align-items-center personalizarTitle">
                        <div className="faButton" onClick={toggleAdicionalesIsExpanded} style={{ cursor: 'pointer' }}>
                        { adicionalesIsExpanded ? <FontAwesomeIcon icon={faBan} size="sm" /> : <FontAwesomeIcon icon={faPenToSquare} size="sm" /> }
                        </div>
                        <h2 className="titleOption" onClick={toggleAdicionalesIsExpanded} style={{ cursor: 'pointer' }}>Adicional</h2>
                    </div>
                    {adicionalesIsExpanded && (
                    <div>
                        <div className="row" ref={containerRef}>
                            {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Adicionales.map((adicional, indexAdicional) => (
                                <div key={indexAdicional} className={`col-${12/numCheckBoxPerRow}`}>
                                    <label className="container">
                                        <div>
                                            {adicional.Adicional ? adicional.Adicional : "Nombre Adicional"}
                                            <span style={{color: "red"}}>{adicional.Precio !== 0 ? (<strong> ${adicional.Precio}</strong>) : ''}</span>
                                        </div>
                                        <input type="checkbox" id="Checked" checked={adicional.Checked} onChange={(e) => handleVariantAdicional(indexAdicional, e)}/>
                                        <span className="checkmark"></span>
                                    </label>
                                    {adicional.Checked && (
                                        <DropDown
                                            opciones_in={adicional.Opciones.map((opcion, indexOpcion) => (opcion))}
                                            selectedValue={adicional.Opciones[adicional.SelectedOpcion]} 
                                            onDropdownChange={(e) => handleVariantAdicionalOpcionDropdownChange(adicional.Opciones.map((opcion, indexOpcion) => (opcion)), indexAdicional, e)}
                                            prefix={adicional.Opciones.map((opcion, indexOpcion) => (0))}/>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default DetailsComanda;