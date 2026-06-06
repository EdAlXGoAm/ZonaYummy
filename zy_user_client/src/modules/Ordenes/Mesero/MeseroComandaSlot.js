import './MeseroComandaSlot.css';
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';
import MeseroComandaEditor from './MeseroComandaEditor';
import ResumeComanda from './../MeseroPage/ResumeComandaComponent';
import MeseroComandaFullscreenModal from './MeseroComandaFullscreenModal';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCashRegister } from '@fortawesome/free-solid-svg-icons';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faPaperPlane, faFilePen, faFloppyDisk, faExpand } from '@fortawesome/free-solid-svg-icons';

const MeseroComandaSlot = ({
    order,
    modeInterface,
    Comanda,
    updateComanda,
    removeComanda,
    onBubbleToggle,
    enableFullscreenFab = false,
    forceExpanded = false,
    fullscreenMode = false,
    onCloseFullscreen,
}) => {

    const [nota, setNota] = useState('');
    const [liveStatusNota, setLiveStatusNota] = useState('#33d457');
    const notaDirtyRef = useRef(false);
    const saveTimerRef = useRef(null);
    const comandaRef = useRef(Comanda);
    const notaRef = useRef(nota);
    const updateComandaRef = useRef(updateComanda);

    comandaRef.current = Comanda;
    notaRef.current = nota;
    updateComandaRef.current = updateComanda;

    const handleUpdateComandaPaidStatus = (status) => {
        flushPendingNota();
        const updatedComanda = {
            ...Comanda,
            ComandaPaidStatus: status,
            Notas: notaRef.current ?? Comanda.Notas,
        };
        updateComanda(updatedComanda);
    };

    const handleUpdateComandaPrepStatus = (status) => {
        let Status = status;
        if (Status === "Served"){
            const updatedComanda = {
                ...Comanda,
                ComandaPrepStatus: Status
            }
            updateComanda(updatedComanda);
        }
        else {
            if (Comanda.ComandaPaidStatus === "Editing"){
                alert("No puedes marcar la tarea Completada mientras Editas");
            }
            else {
                const updatedComanda = {
                    ...Comanda,
                    ComandaPrepStatus: Comanda.ComandaPrepStatus === "Preparing" ? "ReadyToServe" : "Preparing"
                }
                if (Comanda.ComandaPrepStatus === "ReadyToServe" && typeof onBubbleToggle === 'function') {
                    onBubbleToggle(Comanda._id);
                }
                updateComanda(updatedComanda);
            }
        }
    };

    const handleUpdateComandaDeliverMode = () => {
        const updatedComanda = {
            ...Comanda,
            ComandaDeliverMode: Comanda.ComandaDeliverMode === "Delivery" ? "Table-0" : "Delivery"
        }
        updateComanda(updatedComanda);
    };

    const handleUpdateComandaSwitchNota = () => {
        const updatedComanda = {
            ...Comanda,
            ComandaSwitchNota: !Comanda.ComandaSwitchNota
        }
        updateComanda(updatedComanda);
    };

    const NOTA_AUTOSAVE_MS = 1000;

    const persistNota = useCallback((value) => {
        if (!modeInterface) return;
        const current = comandaRef.current;
        const normalized = value ?? '';
        if (!current || normalized === (current.Notas ?? '')) {
            notaDirtyRef.current = false;
            setLiveStatusNota('#33d457');
            return;
        }
        updateComandaRef.current(
            { ...current, Notas: normalized },
            { notesOnly: true },
        );
        notaDirtyRef.current = false;
        setLiveStatusNota('#33d457');
    }, [modeInterface]);

    const flushPendingNota = useCallback(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        if (notaDirtyRef.current) {
            persistNota(notaRef.current);
        }
    }, [persistNota]);

    const scheduleNotaAutoSave = useCallback((value) => {
        if (!modeInterface) return;
        notaDirtyRef.current = true;
        setLiveStatusNota('#ff69b4');
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = setTimeout(() => {
            saveTimerRef.current = null;
            persistNota(value);
        }, NOTA_AUTOSAVE_MS);
    }, [modeInterface, persistNota]);

    const handleChangeNota = (event) => {
        const value = event.target.value;
        setNota(value);
        scheduleNotaAutoSave(value);
    };

    const handleBlurNota = () => {
        if (!modeInterface || !notaDirtyRef.current) return;
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        persistNota(notaRef.current);
    };

    const handleNoteNew = () => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        persistNota(notaRef.current);
    };

    useEffect(() => {
        notaDirtyRef.current = false;
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        setNota(Comanda.Notas ?? '');
        setLiveStatusNota('#33d457');
    }, [Comanda.ComandaId]);

    useEffect(() => {
        if (!notaDirtyRef.current) {
            setNota(Comanda.Notas ?? '');
        }
    }, [Comanda.Notas]);

    useEffect(() => () => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
    }, []);

    useEffect(() => () => {
        if (!modeInterface || !notaDirtyRef.current) return;
        const current = comandaRef.current;
        const value = notaRef.current ?? '';
        if (current && value !== (current.Notas ?? '')) {
            updateComandaRef.current(
                { ...current, Notas: value },
                { notesOnly: true },
            );
        }
    }, [modeInterface]);

    const [fullscreenOpen, setFullscreenOpen] = useState(false);

    // Todas las tarjetas inician contraídas (salvo pantalla completa)
    const [toggleArrowStatus, setToggleArrowStatus] = useState(forceExpanded); // false: plegado, true: desplegado

    const [colorStatus, setColorStatus] = useState('#ffffff');
    const [animOrBg, setAnimOrBg] = useState(false);

    useEffect(() => {
        if (forceExpanded) {
            setToggleArrowStatus(true);
        }
    }, [forceExpanded]);

    useEffect(() => {
        // Mantener lógica de color y animación según otros estados
        if (order.OrderCustStatus === "Done") {
            setAnimOrBg(false);
            setColorStatus("#2d2d2d");
        }
        if (Comanda.ComandaPaidStatus === "Editing") {
            if (!forceExpanded) setToggleArrowStatus(true);
            setColorStatus("#fe8878");
            return;
        }
        if (Comanda.ComandaPrepStatus === "Preparing") {
            if (!forceExpanded) setToggleArrowStatus(true);
            setColorStatus("#ffffff");
            return;
        }
        if (Comanda.ComandaPrepStatus === "ReadyToServe" && Comanda.ComandaPaidStatus === "Pending") {
            setAnimOrBg(false);
            setColorStatus("#00ff5e");
        } else {
            setAnimOrBg(false);
            setColorStatus("#ffffff");
        }
    },[Comanda, forceExpanded, order.OrderCustStatus]);

    const handleRemoveComanda = (comanda) => {
        removeComanda(comanda);
        if (typeof onCloseFullscreen === 'function') {
            onCloseFullscreen();
        }
    };

    const fullscreenTitle = `${Comanda.Platillo} · $${Comanda.Precio}`;

    const notaTextareaId = `NotaTextArea_${Comanda._id}${fullscreenMode ? '_fs' : ''}`;

    const renderNotaTextarea = (rows, fontSize, showSendButton = true) => (
        <div className='row'>
            <div className={showSendButton ? 'col-10' : 'col-12'}>
                <textarea
                    className="form-control mesero-comanda-slot__nota-input"
                    id={notaTextareaId}
                    rows={rows}
                    placeholder="Agregar notas"
                    onChange={handleChangeNota}
                    onBlur={handleBlurNota}
                    value={nota}
                    style={{
                        backgroundColor: liveStatusNota,
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize,
                    }}
                />
            </div>
            {showSendButton && (
                <div className='col-2'>
                    <div className="form-group">
                        <button type="button" className="btn btn-light" onClick={handleNoteNew}>
                            <FontAwesomeIcon icon={faPaperPlane} style={{ color: '#7ed65b' }} size="2x" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    // Manejador para el toggle de la flecha, invoca callback si colapsa una comanda ReadyToServe
    const handleToggleArrow = () => {
        if (forceExpanded) return;
        const newStatus = !toggleArrowStatus;
        setToggleArrowStatus(newStatus);
        if (Comanda.ComandaPrepStatus === "ReadyToServe" && typeof onBubbleToggle === 'function') {
            onBubbleToggle(Comanda._id);
        }
    };

    const cardContent = (
        <div className={`card-body mb-1 divStyle ${animOrBg && 'comandaCardAnimation'}`} style={{backgroundColor: animOrBg ? '' : colorStatus}}>
            <div className="row mb-3">
                <div className='col'>
                    <div className='row mb-2' style={{padding: "0px 20px"}}>
                        {!forceExpanded && (
                        <div className="toggleArrowButtons">
                            <button style={{backgroundColor:  toggleArrowStatus ? "#7ed65b" : "#ffffff"}} onClick={handleToggleArrow}>
                                <FontAwesomeIcon style={{color: toggleArrowStatus ? "#ffffff" : "#5d5d5d"}} icon={toggleArrowStatus ? faAngleUp : faAngleDown} size="2x" />
                            </button>
                        </div>
                        )}
                        <div className="mesero-comanda-slot__top-actions ml-auto">
                            {enableFullscreenFab && (
                                <button
                                    type="button"
                                    className="mesero-comanda-slot__expand-fab"
                                    onClick={() => setFullscreenOpen(true)}
                                    title="Abrir comanda en pantalla completa"
                                    aria-label="Abrir comanda en pantalla completa"
                                >
                                    <FontAwesomeIcon icon={faExpand} />
                                </button>
                            )}
                            <div
                                className="faButton"
                                style={{ cursor: 'pointer' }}
                                title="Solicitar eliminación (requiere autorización)"
                                onClick={() => handleRemoveComanda(Comanda)}
                            >
                                <FontAwesomeIcon icon={faTrash} style={{color: 'red'}} size="xl" />
                            </div>
                        </div>
                    </div>
                    {modeInterface ? (
                        <div className='row mb-2'>
                            <div className='col-2'>
                            <img src={Comanda.Imagen} alt="icon"className="img-fluid" style={{ width: '60px'}}></img>
                            </div>
                            <div className="col-8 d-flex align-items-center personalizarTitle">
                                <h2 className="title comandaTextStyle">{Comanda.Platillo}&nbsp;&nbsp;<span style={{textShadow: "0px 0px 10px red"}}>${Comanda.Precio}</span></h2>
                            </div>
                            <div className='col-2'>
                            <img src={Comanda.Imagen} alt="icon"className="img-fluid" style={{ width: '60px'}}></img>
                            </div>
                        </div>
                    ) : (
                        <div className='row mb-2'>
                            <div className='col-2'>
                            <img src={Comanda.Imagen} alt="icon"className="img-fluid" style={{ width: '200px'}}></img>
                            </div>
                            <div className="col-8 d-flex align-items-center personalizarTitle">
                                <h2 className="title comandaTextStyle" style={{fontSize:"70px"}}>{Comanda.Platillo}&nbsp;&nbsp;<span style={{textShadow: "0px 0px 10px red"}}>${Comanda.Precio}</span></h2>
                            </div>
                            <div className='col-2'>
                            <img src={Comanda.ComandaDeliverMode === "Delivery" ? "iconscocina/Llevar.png" : "iconscocina/Aqui.png" } alt="icon"className="img-fluid" style={{ width: '250px'}}></img>
                            </div>
                        </div>
                    )}
                    
                    {modeInterface && (
                    <div className='row'>
                        <div className="col-3">
                            <BootstrapSwitchButton checked={Comanda.ComandaDeliverMode === "Delivery" ? false : true}
                                onlabel='Aqui' offlabel='Llevar' width={100} onChange={handleUpdateComandaDeliverMode} />
                        </div>
                        <div className="col-3">
                            <div className="iconDelivery">
                                <img src="icons/Mesa.png" alt="icon"className="img-fluid" style={{ width: '40px',  display: (Comanda.ComandaDeliverMode === "Delivery" ? false : true) ? 'flex' : 'none'}}></img>
                                <img src="icons/Llevar.png" alt="icon"className="img-fluid" style={{ width: '40px',  display: !(Comanda.ComandaDeliverMode === "Delivery" ? false : true) ? 'flex' : 'none'}}></img>
                            </div>
                        </div>
                        <div className="col-3">
                            <BootstrapSwitchButton checked={Comanda.ComandaPrepStatus === "Preparing" ? false : true}
                                onlabel='Entregada' offlabel='Preparando' width={100} onChange={() => handleUpdateComandaPrepStatus("")} />
                        </div>
                        <div className="col-3">
                            <BootstrapSwitchButton checked={Comanda.ComandaSwitchNota}
                                onlabel='Nota' offlabel='Nota' width={100} onChange={handleUpdateComandaSwitchNota} />
                        </div>
                    </div>)}
                </div>
            </div>
            {toggleArrowStatus && (
                modeInterface ? (
                    Comanda.ComandaPaidStatus === "Editing" ? (
                        <div>
                            <div className="row">
                                <div className='col'>
                                <MeseroComandaEditor Comanda={Comanda} updateComanda={updateComanda} />
                                </div>
                            </div>
                            <div className="row" style={{display: !Comanda.ComandaSwitchNota ? 'none' : 'flex'}}>
                                <div className='col'>
                                    {renderNotaTextarea(3, '30px')}
                                </div>
                            </div>
                            <div className="row">
                                <div className='col-10'>
                                </div>
                                <div className='col-2'>
                                    <button type="button" className="btn btn-outline-success btn-lg" onClick={() => handleUpdateComandaPaidStatus("Pending")}>
                                        <FontAwesomeIcon icon={faFloppyDisk} style={{color: '#7ed65b'}} size="2x" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    )
                    : (
                        <div>
                                <div className="row">
                                    <div className='col'>
                                    <MeseroComandaEditor Comanda={Comanda} updateComanda={updateComanda} />
                                    </div>
                                </div>
                            <div className="row" style={{display: !Comanda.ComandaSwitchNota ? 'none' : 'flex'}}>
                                <div className='col'>
                                    {renderNotaTextarea(3, '30px')}
                                </div>
                            </div>
                            <div className="row">
                                <div className='col-10'>
                                </div>
                                <div className='col-2'>
                                    <button type="button" className="btn btn-outline-warning btn-lg" onClick={() => handleUpdateComandaPaidStatus("Editing")}>
                                        <FontAwesomeIcon icon={faFilePen} style={{color: '#7ed65b'}} size="2x" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                )
                : (
                    Comanda.ComandaPaidStatus === "Editing" ? (
                        <div>
                            <div style={{padding: "50px 0px"}}>
                                <h1>Editando Comanda...</h1>
                            </div>
                        </div>
                    )
                    : (
                        <div>
                            <div className="row">
                                <div className='col'>
                                <ResumeComanda Comanda={Comanda} updateComanda={updateComanda} />
                                </div>
                            </div>
                            <div className="row">
                                <div className='col-10'>
                                </div>
                                <div className='col-2'>
                                    <button type="button" className="btn btn-outline-success btn-lg" onClick={() => handleUpdateComandaPaidStatus("Editing")}>
                                        <FontAwesomeIcon icon={faFloppyDisk} style={{color: '#7ed65b'}} size="2x" />
                                    </button>
                                </div>
                            </div>
                            <div className="row" style={{display: !Comanda.ComandaSwitchNota ? 'none' : 'flex'}}>
                                <div className='col'>
                                    {renderNotaTextarea(2, '50px', false)}
                                </div>
                            </div>
                        </div>
                    )
                )
            )}
        </div>
    );

    return(
        <div className={`mesero-comanda-slot${fullscreenMode ? ' mesero-comanda-slot--fullscreen' : ''}`}>
            <div className="row"><div className="col-12">
                {cardContent}
            </div></div>
            {fullscreenOpen && (
                <MeseroComandaFullscreenModal
                    title={fullscreenTitle}
                    onClose={() => setFullscreenOpen(false)}
                >
                    <MeseroComandaSlot
                        order={order}
                        modeInterface={modeInterface}
                        Comanda={Comanda}
                        updateComanda={updateComanda}
                        removeComanda={removeComanda}
                        onBubbleToggle={onBubbleToggle}
                        forceExpanded
                        fullscreenMode
                        onCloseFullscreen={() => setFullscreenOpen(false)}
                    />
                </MeseroComandaFullscreenModal>
            )}
        </div>
    );
}

export default memo(MeseroComandaSlot);