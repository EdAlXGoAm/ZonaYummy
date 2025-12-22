import './ResumeComandaNewFeatures.css';
import './../Global/checkbox.css'; //La ruta de este archivo es: src/css/checkbox.css
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faPenToSquare, faBan} from '@fortawesome/free-solid-svg-icons';

import DropDown from './../x10DropDown';
import MarqueeText from './../MeseroPage/MarqueeText';

// Función para extraer timestamp del ObjectId de MongoDB
const getTimeAgo = (mongoId) => {
    if (!mongoId || mongoId.length < 8) return null;
    
    try {
        // Los primeros 8 caracteres del ObjectId son el timestamp en hexadecimal
        const timestamp = parseInt(mongoId.substring(0, 8), 16) * 1000;
        const createdDate = new Date(timestamp);
        const now = new Date();
        const diffMs = now - createdDate;
        
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        // Determinar nivel de urgencia: 'fresh' (< 5min), 'normal' (5-15min), 'warning' (15-30min), 'urgent' (> 30min)
        let urgency = 'fresh';
        if (diffMins >= 30) urgency = 'urgent';
        else if (diffMins >= 15) urgency = 'warning';
        else if (diffMins >= 5) urgency = 'normal';
        
        let text = 'Ahora';
        if (diffMins >= 1 && diffMins < 60) text = `${diffMins} min`;
        else if (diffHours >= 1 && diffHours < 24) text = `${diffHours}h ${diffMins % 60}m`;
        else if (diffHours >= 24) text = `${Math.floor(diffHours / 24)}d`;
        
        return { text, urgency, diffMins };
    } catch (e) {
        return null;
    }
};

const DetailsComandaNewFeatures = ({Comanda, updateComanda, compact = false, comandaNumber = null}) => {

    // Estado para el tiempo transcurrido (se actualiza cada minuto)
    const [timeAgo, setTimeAgo] = useState(() => getTimeAgo(Comanda._id));
    
    useEffect(() => {
        // Actualizar inmediatamente
        setTimeAgo(getTimeAgo(Comanda._id));
        
        // Actualizar cada 30 segundos
        const interval = setInterval(() => {
            setTimeAgo(getTimeAgo(Comanda._id));
        }, 30000);
        
        return () => clearInterval(interval);
    }, [Comanda._id]);

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
    const [numCheckBoxPerRow, setNumCheckBoxPerRow] = useState(compact ? 4 : 6);
    const containerRef = useRef(null);
    const lastCalculatedValue = useRef(compact ? 4 : 6);
    
    const updateNumCheckBoxPerRow = (width) => {
        const checkBoxWidth = compact ? 80 : 150; // Más pequeño en compact
        const newNumCheckBoxPerRow = Math.floor(width / checkBoxWidth) * 2;
        const finalValue = newNumCheckBoxPerRow > 0 ? newNumCheckBoxPerRow : (compact ? 4 : 1);
        
        // Solo actualizar si el valor cambió significativamente
        if (Math.abs(finalValue - lastCalculatedValue.current) >= 1) {
            lastCalculatedValue.current = finalValue;
            setNumCheckBoxPerRow(finalValue);
        }
    };
    
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width } = entry.contentRect;
                updateNumCheckBoxPerRow(width);
            }
        });
        
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        
        // Recálculo de verificación después de 500ms para corregir posibles errores iniciales
        const verificationTimeout = setTimeout(() => {
            if (containerRef.current) {
                const width = containerRef.current.getBoundingClientRect().width;
                if (width > 0) {
                    updateNumCheckBoxPerRow(width);
                }
            }
        }, 500);
        
        // Segundo recálculo después de 1.5s por si acaso
        const secondVerification = setTimeout(() => {
            if (containerRef.current) {
                const width = containerRef.current.getBoundingClientRect().width;
                if (width > 0) {
                    updateNumCheckBoxPerRow(width);
                }
            }
        }, 1500);
        
        return () => {
            clearTimeout(verificationTimeout);
            clearTimeout(secondVerification);
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, [componentsIsExpanded, compact]);

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

    const isPending = Comanda.ComandaPaidStatus === "Pending";

    // Calcular qué secciones tienen contenido visible para mostrar <hr/> inteligentemente
    const selectedVariant = Comanda.Details.Variants[Comanda.Details.SelectedVariant];
    const hasComponentes = selectedVariant.Componentes.length > 0;
    const hasOpciones = selectedVariant.Opciones.some(op => op.Items[op.SelectedItem].Name !== "No aplica");
    const hasIngredientes = selectedVariant.Ingredientes.length > 0;
    const hasExtras = selectedVariant.Extras.some(e => e.Checked);
    const hasAdicionales = selectedVariant.Adicionales.some(a => a.Checked);

    // En modo compacto: priorizar lectura (platillo + variante) y minimizar íconos
    const deliverIconWidth = compact ? '28px' : '250px';
    const mainImageWidth = compact ? '44px' : '200px';
    const headerFontSize = compact ? '22px' : '25px';
    const notaFontSize = compact ? '16px' : '25px';
    
    // Para Hamburguesa: ingredientes con ancho fijo de 80px y altura reducida
    const isHamburguesa = Comanda.Platillo === "Hamburguesa";
    const ingredientImageHeight = isHamburguesa ? '28px' : '55px';
    
    // Para Tacos: mostrar solo texto en lugar de imágenes para "Complementos"
    const isTacos = Comanda.Platillo?.toLowerCase().trim() === "tacos";
    
    // Helper para obtener el texto de complementos para Tacos
    const getTacosComplementosText = (ingrediente) => {
        const ingredienteName = ingrediente.Name?.toLowerCase().trim();
        if (!isTacos || ingredienteName !== "complementos") return null;
        
        const items = ingrediente.Items || [];
        const selectedItems = items.filter(item => item.Checked);
        
        if (selectedItems.length === 0) return { text: "NADA", color: "red" };
        if (selectedItems.length === items.length) return { text: "CON TODO", color: "green" };
        
        // Solo uno seleccionado
        const selectedNames = selectedItems.map(item => item.Name.toUpperCase());
        return { text: `SOLO ${selectedNames.join(" y ")}`, color: "#1a1a1a" };
    };

    return (
        <div className={`resume-card ${compact ? 'resume-card--compact' : ''} ${isHamburguesa ? 'resume-card--hamburguesa' : ''}`} tabIndex={compact ? 0 : undefined}>
            {/* Indicador de tiempo transcurrido - solo en modo normal, en compact va dentro del col-3 */}
            {!compact && timeAgo && (
                <div className="comanda-time-badge">
                    <span className={`comanda-time-dot comanda-time-${timeAgo.urgency}`}></span>
                    <span className="comanda-time-text">{timeAgo.text}</span>
                </div>
            )}
            {/* Tooltip flotante de nota - FUERA del div con overflow */}
            {Comanda.ComandaSwitchNota && Comanda.Notas && (
                <div className="nota-flotante-wrapper">
                    <div className="nota-flotante-fixed">
                        <svg 
                            className="nota-flotante-icon"
                            xmlns="http://www.w3.org/2000/svg" 
                            width={compact ? "18" : "24"} 
                            height={compact ? "18" : "24"} 
                            viewBox="0 0 24 24" 
                            fill="#ff4444" 
                            stroke="#ffffff" 
                            strokeWidth="1.5"
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8" stroke="#ffffff" fill="none"></polyline>
                        </svg>
                        <span className="nota-flotante-texto" style={{fontSize: compact ? '13px' : '16px'}}>
                            {Comanda.Notas}
                        </span>
                    </div>
                </div>
            )}
            
            <div className="card-body mb-1 divStyle" style={{backgroundColor: colorStatus, ...(isPending ? {fontFamily: 'Arial, sans-serif'} : {})}}>


                <div className="row" style={{display: Comanda.Customer === undefined ? 'none' : 'flex'}}>
                    <div className='col-3'>
                        {compact ? (
                            /* Modo compact: ComandaId grande + imagen delivery + tiempo en la misma fila */
                            <div className="compact-col3-layout">
                                <div className="compact-comanda-row">
                                    {comandaNumber && (
                                        <span className="comanda-number-badge-large">{comandaNumber}</span>
                                    )}
                                    <img
                                        src={Comanda.ComandaDeliverMode === "Delivery" ? "Ideogram/llevare.png" : "Ideogram/aquie.png"}
                                        alt="icon"
                                        className="img-fluid compact-deliver-icon"
                                    />
                                    {timeAgo && (
                                        <div className={`compact-time-badge compact-time-${timeAgo.urgency}`}>
                                            {timeAgo.text}
                                        </div>
                                    )}
                                </div>
                                <img
                                    src={Comanda.Imagen}
                                    alt="icon"
                                    className="img-fluid resume-main-image"
                                    style={{ width: mainImageWidth }}
                                />
                            </div>
                        ) : (
                            /* Modo normal */
                            <>
                                <div className="row"><div className="col">
                                    <img
                                        src={Comanda.ComandaDeliverMode === "Delivery" ? "Ideogram/llevare.png" : "Ideogram/aquie.png" }
                                        alt="icon"
                                        className="img-fluid resume-deliver-icon"
                                        style={{ width: deliverIconWidth }}
                                    />
                                </div></div>
                                <div className="row"><div className="col">
                                    <img
                                        src={Comanda.Imagen}
                                        alt="icon"
                                        className="img-fluid resume-main-image"
                                        style={{ width: mainImageWidth }}
                                    />
                                </div></div>
                            </>
                        )}
                    </div>
                    <div className='col-9'>
                        <div className="row"><div className="col">
                            <h2 className="title comandaTextStyleCocina" style={{fontSize: headerFontSize}}>
                                {/* En modo compact el número ya está en col-3 */}
                                {!compact && comandaNumber && (
                                    <span className="comanda-number-badge">{comandaNumber}</span>
                                )}
                                {Comanda.Platillo}&nbsp;&nbsp;<span style={{textShadow: "0px 0px 10px red"}}>${Comanda.Precio}</span>
                            </h2>
                        </div></div>
                        <div className="row"><div className="col">
                            <div><span className="titleVariantCocina">
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].VariantName.toUpperCase()}
                            </span></div>
                        </div></div>
                    </div>
                </div>



                <div className="row">
                    <div className='col'>
                        {Comanda.ComandaPaidStatus === "Editing" ? (
                            <div>
                                <div style={{padding: "50px 0px"}}>
                                    <h1>Editando Comanda...</h1>
                                </div>
                            </div>
                        )
                        : (
                            <div>
                                {!isHamburguesa && Comanda.Details.Variants[Comanda.Details.SelectedVariant].Componentes.length > 0 && (
                                    <h2 className="titleComponentsCocina">Componentes</h2>
                                )}
                                {!isHamburguesa && <div className="row" style={isHamburguesa ? { flexWrap: 'wrap' } : {}}>
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Componentes.map((componente, indexComponente) => (
                                    <div 
                                        key={indexComponente} 
                                        style={{
                                            padding: '2px',
                                            ...(isHamburguesa ? { width: '80px', flex: '0 0 80px' } : {})
                                        }} 
                                        className={isHamburguesa ? '' : `col-${12/numCheckBoxPerRow}`}
                                    >
                                        <label className="container containerIng">
                                            <div>
                                                <div className='row mb-2'>
                                                    <div className='col textoComponentsCocina' style={{fontSize: "15px"}}>
                                                        <MarqueeText tolerance={9}>
                                                        {!componente.Checked ? (
                                                            <span className="sinconComponentsCocina" style={{color:"red"}}>SIN </span>
                                                        ): (
                                                            <span className="sinconComponentsCocina" style={{color:"green"}}>CON </span>
                                                        )}
                                                        <span className="textoComponentsCocina">{componente.Name}</span>
                                                        {componente.Precio !== 0 && (
                                                            <span style={{color:"red"}}> ${componente.Precio}</span>
                                                        )}
                                                        </MarqueeText>
                                                    </div>
                                                </div>
                                                
                                                <div className={isHamburguesa ? 'row' : 'row mb-2'}>
                                                    <div className='col d-flex justify-content-center'>
                                                       <img src={`iconscocina/${componente.Name}.png`} alt="icon"className="img-fluid" style={{ width: 'auto', height: ingredientImageHeight, objectFit: 'cover'}}></img>
                                                       
                                                       {!componente.Checked && (
                                                        <div class="linea-tachado-delgada"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                                </div>}
                                {!isHamburguesa && hasComponentes && (hasOpciones || hasIngredientes || hasExtras || hasAdicionales) && (<hr/>)}
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
                                                                            <div className="textOpcionesCocina">
                                                                                <MarqueeText tolerance={9}>{item.Name}</MarqueeText>
                                                                            </div>
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
                                {hasOpciones && (hasIngredientes || hasExtras || hasAdicionales) && (<hr/>)}
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Ingredientes.map((ingrediente, indexIngrediente) => {
                                    const tacosComplementos = getTacosComplementosText(ingrediente);
                                    
                                    // Para Tacos con Complementos: mostrar solo texto
                                    if (tacosComplementos) {
                                        return (
                                            <div key={indexIngrediente} className="tacos-complementos-container">
                                                <span 
                                                    className="tacos-complementos-text"
                                                    style={{ color: tacosComplementos.color }}
                                                >
                                                    {tacosComplementos.text}
                                                </span>
                                            </div>
                                        );
                                    }
                                    
                                    // Renderizado normal para otros ingredientes
                                    return (
                                    <div key={indexIngrediente}>
                                        <div className="row"><div className="col">
                                            <h2 className="titleIngredientesCocina">{ingrediente.Name}</h2>
                                        </div></div>
                                        <div className="row" ref={containerRef} style={{ position: 'relative', ...(isHamburguesa ? { flexWrap: 'wrap' } : {}) }}>
                                            {ingrediente.Items.map((item, indexItem) => (
                                                <div 
                                                    key={indexItem} 
                                                    style={{
                                                        padding: '2px',
                                                        ...(isHamburguesa ? { width: '80px', flex: '0 0 80px' } : {})
                                                    }} 
                                                    className={isHamburguesa ? '' : `col-${12/numCheckBoxPerRow}`}
                                                >
                                                    <label className="container containerIng">
                                                        <div>
                                                            <div className="row"><div className="col">
                                                                <div className="textIngredientesCocina">
                                                                    <MarqueeText tolerance={14}>{item.Name || "Nombre Ingrediente"}</MarqueeText>
                                                                </div>
                                                            </div></div>
                                                            <div className={isHamburguesa ? 'row' : 'row mb-2'}><div className="col d-flex justify-content-center">
                                                                <img src={`iconscocina/${item.Name}.png`} alt="icon" className="img-fluid" style={{ width: 'auto', height: ingredientImageHeight, objectFit: 'cover' }}/>
                                                                {!item.Checked && !ingrediente.Items.every(i => !i.Checked) && (<div className="linea-tachado"></div>)}
                                                            </div></div>
                                                        </div>
                                                    </label>
                                                </div>
                                            ))}
                                            {ingrediente.Items.every(item => item.Checked) && (
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <span style={{ color: 'green', fontWeight: 'bold', fontSize: '24px', fontFamily: 'Salsa, cursive' }}>CON TODO</span>
                                                </div>
                                            )}
                                            {ingrediente.Items.every(item => !item.Checked) && (
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <span style={{ color: 'red', fontWeight: 'bold', fontSize: '24px', fontFamily: 'Salsa, cursive' }}>NADA</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
                                {hasIngredientes && (hasExtras || hasAdicionales) && (<hr/>)}
                                {/* Para Tacos: mostrar extras destacados */}
                                {isTacos && hasExtras && (
                                    <div className="tacos-extras-container">
                                        {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Extras
                                            .filter(extra => extra.Checked)
                                            .map((extra, idx) => (
                                                <span key={idx} className="tacos-extra-text">
                                                    + {extra.Extra?.toUpperCase() || "EXTRA"}
                                                    {extra.Precio !== 0 && <span className="tacos-extra-price"> ${extra.Precio}</span>}
                                                </span>
                                            ))
                                        }
                                    </div>
                                )}
                                {/* Renderizado normal de extras para otros platillos */}
                                {!isTacos && Comanda.Details.Variants[Comanda.Details.SelectedVariant].Extras.map((extra, indexExtra) => (
                                    extra.Checked && (
                                        <div key={indexExtra} className={isPending ? 'col-12' : `col-${12/numCheckBoxPerRow}`}>
                                            {isPending ? (
                                                <div className="resumeExtraLine">
                                                    <span className="resumeExtraName">{extra.Extra || "Nombre Ing Extra"}</span>
                                                    {extra.Precio !== 0 && (<span className="resumeExtraPrice">${extra.Precio}</span>)}
                                                </div>
                                            ) : (
                                                <label className="container">
                                                    <div>
                                                        {extra.Extra || "Nombre Ing Extra"}
                                                        <span style={{color: "red"}}>{extra.Precio !== 0 ? (<strong> ${extra.Precio}</strong>) : ''}</span>
                                                    </div>
                                                    <input type="checkbox" id="Checked" checked={extra.Checked} onChange={(e) => handleVariantExtra(indexExtra, e)}/>
                                                    <span className="checkmark"></span>
                                                </label>
                                            )}
                                        </div>
                                    )
                                ))}
                                {hasExtras && hasAdicionales && (<hr/>)}
                                {Comanda.Details.Variants[Comanda.Details.SelectedVariant].Adicionales.map((adicional, indexAdicional) => (
                                    adicional.Checked && (
                                        <div key={indexAdicional} className={isPending ? 'col-12' : `col-${12/numCheckBoxPerRow}`}>
                                            {isPending ? (
                                                <div className="resumeExtraLine">
                                                    <span className="resumeExtraName">{adicional.Adicional || "Nombre Adicional"}</span>
                                                    {adicional.Precio !== 0 && (<span className="resumeExtraPrice">${adicional.Precio}</span>)}
                                                    <span className="resumeExtraMeta">- {adicional.Opciones[adicional.SelectedOpcion]}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <label className="container">
                                                        <div>
                                                            {adicional.Adicional || "Nombre Adicional"}
                                                            <span style={{color: "red"}}>{adicional.Precio !== 0 ? (<strong> ${adicional.Precio}</strong>) : ''}</span>
                                                        </div>
                                                        <input type="checkbox" id="Checked" checked={adicional.Checked} onChange={(e) => handleVariantAdicional(indexAdicional, e)}/>
                                                        <span className="checkmark"></span>
                                                    </label>
                                                    {adicional.Checked && (
                                                        <DropDown
                                                            opciones_in={adicional.Opciones.map((opcion) => opcion)}
                                                            selectedValue={adicional.Opciones[adicional.SelectedOpcion]}
                                                            onDropdownChange={(e) => handleVariantAdicionalOpcionDropdownChange(adicional.Opciones.map((opcion) => opcion), indexAdicional, e)}
                                                            prefix={adicional.Opciones.map(() => 0)}/>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )
                                ))}
                                {/* El último hr nunca se muestra porque no hay contenido después */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DetailsComandaNewFeatures;

