import './ResumeComanda.css';
import './../Global/checkbox.css'; //La ruta de este archivo es: src/css/checkbox.css
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faPenToSquare, faBan} from '@fortawesome/free-solid-svg-icons';

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
    const [numCheckBoxPerRow, setNumCheckBoxPerRow] = useState (6);
    const containerRef = useRef(null);
    const updateNumCheckBoxPerRow = (width) => {
        const checkBoxWidth = 150;
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

    const [allComponentsChecked, setAllComponentsChecked] = useState(false);
    useEffect(() => {
        let allChecked = true;
        Comanda.Details.Variants[Comanda.Details.SelectedVariant].Componentes.map((componente, indexComponente) => (
            componente.Checked === false && (allChecked = false)
            ));
        setAllComponentsChecked(allChecked);
        console.log(`allComponentsChecked: ${allChecked}`);
    }, [Comanda]);
    
    // const [allIngredientesChecked, setAllIngredientezChecked] = useState(false);
    // useEffect(() => {
    //     let allChecked = true;
    //     Comanda.Details.Variants[Comanda.Details.SelectedVariant].Ingredientes.map((ingrediente, indexIngrediente) => (
    //         ingrediente.Checked === false && (allChecked = false)
    //         ));
    //     setAllIngredientezChecked(allChecked);
    //     console.log(`allComponentsChecked: ${allChecked}`);
    // }, [Comanda]);


    const [colorStatus, setColorStatus] = useState('#ffffff');

    useEffect(() => {
        if (Comanda.ComandaPrepStatus === "ReadyToServe" && Comanda.ComandaPaidStatus === "Pending") {
            setColorStatus("#00ff5e");
        }
        else if (Comanda.ComandaPrepStatus === "Preparing" && Comanda.ComandaPaidStatus === "Editing")
        {
            setColorStatus("#fe8878");
        }
        else if (Comanda.ComandaPrepStatus === "Served")
        {
            setColorStatus("#2d2d2d");
        }
        else {
            setColorStatus("#ffffff");
        }
    },[Comanda]);

    return (
        <div>
            <div className="card-body mb-1 divStyle" style={{backgroundColor: colorStatus}}>

                <div className="row" style={{display: Comanda.Customer === undefined ? 'none' : 'flex'}}>
                    <div className='col'>
                    {/* Text box editable backgroudn red and text blanco BOLD */}
                        <div className='row'>
                            <div className='col'>
                            <p className={`textClienteCocina colorTextClienteCocina${Comanda.OrderID % 10}`}><span>{`(${Comanda.OrderID})`} : </span>{Comanda.Customer}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row" style={{display: !Comanda.ComandaSwitchNota ? 'none' : 'flex'}}>
                    <div className='col'>
                    {/* Text box editable backgroudn red and text blanco BOLD */}
                        <div className='row'>
                            <div className='col'>
                            <p className="textNotaCocina"><span style={{fontSize: '25px'}}>Nota: </span>{Comanda.Notas}</p>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="row mb-3">
                    <div className='col'>
                        <div className='row mb-2'>
                            <div className='col-2'>
                            <img src={Comanda.Imagen} alt="icon"className="img-fluid" style={{ width: '200px'}}></img>
                            </div>
                            <div className="col-8">
                                <div className="row"><div className="col">
                                    <h2 className="title comandaTextStyleCocina">{Comanda.Platillo}&nbsp;&nbsp;<span style={{textShadow: "0px 0px 10px red"}}>${Comanda.Precio}</span></h2>
                                </div></div>
                                <div className="row"><div className="col">
                                    <div><span className="titleVariantCocina">
                                        {Comanda.Details.Variants[Comanda.Details.SelectedVariant].VariantName.toUpperCase()}
                                    </span></div>
                                </div></div>
                                
                            </div>
                            <div className='col-2'>
                            <img src={Comanda.ComandaDeliverMode === "Delivery" ? "iconscocina/Llevar.png" : "iconscocina/Aqui.png" } alt="icon"className="img-fluid" style={{ width: '250px'}}></img>
                            </div>
                        </div>
                        {Comanda.ComandaPaidStatus === "Editing" ? (
                            <div>
                                <div style={{padding: "50px 0px"}}>
                                    <h1>Editando Comanda...</h1>
                                </div>
                            </div>
                        )
                        : (
                            <div>
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Componentes.length > 0 && (
                                    <h2 className="titleComponentsCocina">Componentes</h2>
                                )}
                                <div className="row">
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Componentes.map((componente, indexComponente) => (
                                    <div key={indexComponente} style={{padding: '2px'}} className={`col-${12/numCheckBoxPerRow}`}>
                                        <label className="container containerIng">
                                            <div>
                                                <div className='row mb-2'>
                                                    <div className='col textoComponentsCocina' style={{fontSize: "15px"}}>
                                                        {!componente.Checked ? (
                                                            <span className="sinconComponentsCocina" style={{color:"red"}}>SIN </span>
                                                        ): (
                                                            <span className="sinconComponentsCocina" style={{color:"green"}}>CON </span>
                                                        )}
                                                        <span className="textoComponentsCocina">{componente.Name}</span>
                                                        {componente.Precio !== 0 && (
                                                            <span style={{color:"red"}}> ${componente.Precio}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className='row mb-2'>
                                                    <div className='col d-flex justify-content-center'>
                                                       <img src={`iconscocina/${componente.Name}.png`} alt="icon"className="img-fluid" style={{ width: 'auto', height: '55px', objectFit: 'cover'}}></img>
                                                       
                                                       {!componente.Checked && (
                                                        <div class="linea-tachado-delgada"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                                </div>
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Componentes.length > 0 && (<hr/>)}
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Opciones.map((opcion, indexOpcion) => (
                                    <div key={indexOpcion}>
                                        {opcion.Items[opcion.SelectedItem].Name !== "No aplica" && (
                                            <div>
                                            {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Opciones.length > 0 && (
                                                <h2 className="titleOpcionesCocina">{opcion.Name}</h2>
                                            )}
                                            {opcion.Items.map((item, indexItem) => (
                                                <div key={indexItem}>
                                                    {item.Name === opcion.Items[opcion.SelectedItem].Name && (
                                                        <div>
                                                            <label className="container containerIng">
                                                                <div style={{backgroundColor: '#7cd7ff'}}>
                                                                    <div className="row">
                                                                        <div className='col-10'>
                                                                            <div className="textOpcionesCocina">{item.Name}</div>
                                                                        </div>
                                                                        <div className='col-2 d-flex justify-content-center'>
                                                                            <img src={`iconscocina/${item.Name}.png`} alt="icon"className="img-fluid" style={{ width: 'auto', height: '55px', objectFit: 'cover'}}></img>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Opciones.length > 0 && (<hr/>)}
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Ingredientes.map((ingrediente, indexIngrediente) => (
                                    <div key={indexIngrediente}>
                                        <div className="row"><div className="col">
                                            <h2 className="titleIngredientesCocina">{ingrediente.Name}</h2>
                                        </div></div>
                                        <div className="row" ref={containerRef}>
                                        {ingrediente.Items.map((item, indexItem) => (
                                                <div key={indexItem} style={{padding: '2px'}} className={`col-${12/numCheckBoxPerRow}`}>
                                                    <label className="container containerIng">
                                                        <div>
                                                            <div className="row">
                                                                <div className="col">
                                                                    <div className="textIngredientesCocina"> {item.Name ? item.Name : "Nombre Ingrediente"} </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className='row mb-2'>
                                                                <div className='col d-flex justify-content-center'>
                                                                <img src={`iconscocina/${item.Name}.png`} alt="icon"className="img-fluid" style={{ width: 'auto', height: '55px', objectFit: 'cover'}}></img>
                                                                {!item.Checked && (
                                                                <div class="linea-tachado"></div>
                                                                )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                    </label>
                                                </div>
                                        ))}
                                        </div>
                                    </div>
                                ))}
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Ingredientes.length > 0 && (<hr/>)}
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Extras.map((extra, indexExtra) => (
                                    extra.Checked && (
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
                                    )
                                ))}
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Extras.length > 0 && (<hr/>)}
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Adicionales.map((adicional, indexAdicional) => (
                                    adicional.Checked && (
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
                                    )
                                ))}
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Adicionales.length > 0 && (<hr/>)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DetailsComanda;