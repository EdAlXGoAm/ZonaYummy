import './MeseroComandaSlot.css';
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { TwoOptionSwitch } from './two_option_switch/TwoOptionSwitch';
import MeseroComandaEditor from './MeseroComandaEditor';
import ResumeComanda from './../MeseroPage/ResumeComandaComponent';
import MeseroComandaFullscreenModal from './MeseroComandaFullscreenModal';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCashRegister } from '@fortawesome/free-solid-svg-icons';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faFilePen, faFloppyDisk, faExpand } from '@fortawesome/free-solid-svg-icons';

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
    const [notaEditing, setNotaEditing] = useState(false);
    const notaDirtyRef = useRef(false);
    const saveTimerRef = useRef(null);
    const notaInputRef = useRef(null);
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
                    onBubbleToggle(Comanda.ComandaId);
                }
                updateComanda(updatedComanda);
            }
        }
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
        if (!modeInterface) return;
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        if (notaDirtyRef.current) {
            persistNota(notaRef.current);
        }
        setNotaEditing(false);
    };

    const enterNotaEdit = () => {
        setNotaEditing(true);
        requestAnimationFrame(() => {
            const el = notaInputRef.current;
            if (!el) return;
            el.focus();
            const len = el.value.length;
            el.setSelectionRange(len, len);
        });
    };

    useEffect(() => {
        notaDirtyRef.current = false;
        setNotaEditing(false);
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        setNota(Comanda.Notas ?? '');
        setLiveStatusNota('#33d457');
    }, [Comanda.ComandaId]);

    useEffect(() => {
        if (!Comanda.ComandaSwitchNota) {
            setNotaEditing(false);
        }
    }, [Comanda.ComandaSwitchNota]);

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

    const renderNotaTextarea = (rows, fontSize) => (
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
    );

    const renderInlineNotaField = () => {
        const isEmpty = !nota.trim();
        const notaStyle = {
            backgroundColor: liveStatusNota,
            color: '#fff',
            fontWeight: 'bold',
        };

        if (notaEditing) {
            return (
                <textarea
                    ref={notaInputRef}
                    className="form-control mesero-comanda-slot__nota-input mesero-comanda-slot__nota-input--inline"
                    id={notaTextareaId}
                    rows={2}
                    placeholder="Agregar nota"
                    onChange={handleChangeNota}
                    onBlur={handleBlurNota}
                    value={nota}
                    style={notaStyle}
                />
            );
        }

        return (
            <div
                className={`mesero-comanda-slot__nota-label${isEmpty ? ' mesero-comanda-slot__nota-label--empty' : ''}`}
                style={notaStyle}
                onDoubleClick={enterNotaEdit}
                title="Doble click para editar"
            >
                {isEmpty ? 'Doble click para agregar nota' : nota}
            </div>
        );
    };

    // Manejador para el toggle de la flecha, invoca callback si colapsa una comanda ReadyToServe
    const handleToggleArrow = () => {
        if (forceExpanded) return;
        const newStatus = !toggleArrowStatus;
        setToggleArrowStatus(newStatus);
        if (Comanda.ComandaPrepStatus === "ReadyToServe" && typeof onBubbleToggle === 'function') {
            onBubbleToggle(Comanda.ComandaId);
        }
    };

    const renderStatusAction = (nextStatus, variant, icon, ariaLabel) => (
        <div className="mesero-comanda-slot__status-actions">
            <button
                type="button"
                className={`btn btn-outline-${variant} btn-lg mesero-comanda-slot__status-btn`}
                onClick={() => handleUpdateComandaPaidStatus(nextStatus)}
                aria-label={ariaLabel}
            >
                <FontAwesomeIcon icon={icon} style={{ color: '#7ed65b' }} />
            </button>
        </div>
    );

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
                            {modeInterface && (
                                <TwoOptionSwitch
                                    value={Comanda.ComandaPrepStatus === "Preparing" ? 'left' : 'right'}
                                    onChange={() => handleUpdateComandaPrepStatus("")}
                                    leftLabel="Prep"
                                    rightLabel="Entr"
                                    textColor="#000000"
                                    trackColor="#3d2e10"
                                    thumbColor="#ff9500"
                                    className="mesero-comanda-slot__option-switch mesero-comanda-slot__option-switch--prep"
                                    ariaLabel="Estado preparacion"
                                />
                            )}
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
                        <div className="mesero-comanda-slot__platillo-head">
                            <img
                                src={Comanda.Imagen}
                                alt=""
                                className="mesero-comanda-slot__platillo-img"
                            />
                            <h2 className="title comandaTextStyle mesero-comanda-slot__platillo-title">
                                {Comanda.Platillo}&nbsp;&nbsp;
                                <span style={{ textShadow: '0px 0px 10px red' }}>${Comanda.Precio}</span>
                            </h2>
                            <img
                                src={Comanda.Imagen}
                                alt=""
                                className="mesero-comanda-slot__platillo-img"
                            />
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
                    <div className="mesero-comanda-slot__switches">
                        <div className="mesero-comanda-slot__switch-row">
                            <TwoOptionSwitch
                                value={Comanda.ComandaDeliverMode === "Delivery" ? 'left' : 'right'}
                                onChange={(next) => updateComanda({
                                    ...Comanda,
                                    ComandaDeliverMode: next === 'left' ? "Delivery" : "Table-0",
                                })}
                                leftLabel="Llevar"
                                rightLabel="Aqui"
                                textColor="#000000"
                                trackColor="#1e3a4a"
                                thumbColor="#5ce1ff"
                                className="mesero-comanda-slot__option-switch mesero-comanda-slot__option-switch--delivery"
                                ariaLabel="Modo entrega"
                            />
                            <div className="iconDelivery">
                                <img src="icons/Mesa.png" alt="icon"className="img-fluid" style={{ width: '28px',  display: (Comanda.ComandaDeliverMode === "Delivery" ? false : true) ? 'flex' : 'none'}}></img>
                                <img src="icons/Llevar.png" alt="icon"className="img-fluid" style={{ width: '28px',  display: !(Comanda.ComandaDeliverMode === "Delivery" ? false : true) ? 'flex' : 'none'}}></img>
                            </div>
                        </div>
                        <div className="mesero-comanda-slot__switch-row mesero-comanda-slot__switch-row--nota">
                            <TwoOptionSwitch
                                value={Comanda.ComandaSwitchNota ? 'right' : 'left'}
                                onChange={(next) => updateComanda({
                                    ...Comanda,
                                    ComandaSwitchNota: next === 'right',
                                })}
                                leftLabel="Nota"
                                rightLabel="Nota"
                                textColor="#000000"
                                trackColor="#3d1a35"
                                thumbColor="#ff69b4"
                                className="mesero-comanda-slot__option-switch mesero-comanda-slot__option-switch--nota"
                                ariaLabel="Mostrar nota"
                            />
                            {Comanda.ComandaSwitchNota && (
                                <div className="mesero-comanda-slot__nota-inline">
                                    {renderInlineNotaField()}
                                </div>
                            )}
                        </div>
                    </div>)}
                </div>
            </div>
            {toggleArrowStatus && (
                modeInterface ? (
                    Comanda.ComandaPaidStatus === "Editing" ? (
                        <div className="mesero-comanda-slot__editor">
                            <MeseroComandaEditor Comanda={Comanda} updateComanda={updateComanda} />
                            {renderStatusAction('Pending', 'success', faFloppyDisk, 'Guardar comanda')}
                        </div>
                    )
                    : (
                        <div className="mesero-comanda-slot__editor">
                            <MeseroComandaEditor Comanda={Comanda} updateComanda={updateComanda} />
                            {renderStatusAction('Editing', 'warning', faFilePen, 'Editar comanda')}
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
                            <ResumeComanda Comanda={Comanda} updateComanda={updateComanda} />
                            {renderStatusAction('Editing', 'success', faFloppyDisk, 'Editar comanda')}
                            <div className="row" style={{display: !Comanda.ComandaSwitchNota ? 'none' : 'flex'}}>
                                <div className='col'>
                                    {renderNotaTextarea(2, '50px')}
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