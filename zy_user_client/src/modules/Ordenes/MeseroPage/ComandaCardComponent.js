import './ComandaCard.css';
import React, { useState, useEffect } from 'react';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';
import DetailsComanda from './DetailsComandaComponent';
import ResumeComanda from './ResumeComandaComponent';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCashRegister } from '@fortawesome/free-solid-svg-icons';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faPaperPlane, faFilePen, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

const ComandaCard = ({order, modeInterface, Comanda, updateComanda, removeComanda}) => {

    const [nota, setNota] = useState('');
    const [liveStatusNota, setLiveStatusNota] = useState('#33d457')

    const handleUpdateComandaPaidStatus = (status) => {
        const updatedComanda = {
            ...Comanda,
            ComandaPaidStatus: status
        }
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

    const handleChangeNota = (event) => {
        setNota(event.target.value);
      };
    
    const handleNoteNew = () => {
        const updatedComanda = {
            ...Comanda,
            Notas: nota
        }
        updateComanda(updatedComanda);
        setLiveStatusNota('#33d457')
    }

    const handleUpdateNota = (event) => {
        setLiveStatusNota('#ff69b4')
    };
    const fetchNota = () => {
        setNota(Comanda.Notas);
    };
    useEffect(() => {
        fetchNota();
    },[Comanda])

    const [toggleArrowStatus, setToggleArrowStatus] = useState(true); // false: plegado, true: desplegado

    const [colorStatus, setColorStatus] = useState('#ffffff');
    const [animOrBg, setAnimOrBg] = useState(false);

    useEffect(() => {
        if (order.OrderCustStatus === "Done")
        {
            setToggleArrowStatus(false);
            setAnimOrBg(false);
            setColorStatus("#2d2d2d");
        }
        else {
            if (Comanda.ComandaPrepStatus === "ReadyToServe" && Comanda.ComandaPaidStatus === "Pending") {
                setToggleArrowStatus(false);
                setAnimOrBg(false);
                setColorStatus("#00ff5e");
            }
            else if (Comanda.ComandaPrepStatus === "Preparing" && Comanda.ComandaPaidStatus === "Editing")
            {
                setToggleArrowStatus(true);
                setAnimOrBg(true);
                setColorStatus("#fe8878");
            }
            else {
                setToggleArrowStatus(true);
                setAnimOrBg(false);
                setColorStatus("#ffffff");
            }
        }
    },[Comanda]);

    return(
        <div className="row"><div className="col-12">
            <div className={`card-body mb-1 divStyle ${animOrBg && 'comandaCardAnimation'}`} style={{backgroundColor: animOrBg ? '' : colorStatus}}>
            <div className="row mb-3">
                <div className='col'>
                    <div className='row mb-2' style={{padding: "0px 20px"}}>
                        <div className="toggleArrowButtons">
                            <button style={{backgroundColor:  toggleArrowStatus ? "#7ed65b" : "#ffffff"}} onClick={() => setToggleArrowStatus(!toggleArrowStatus)}>
                                <FontAwesomeIcon style={{color: toggleArrowStatus ? "#ffffff" : "#5d5d5d"}} icon={toggleArrowStatus ? faAngleUp : faAngleDown} size="2x" />
                            </button>
                        </div>
                            <div className="faButton ml-auto" onClick={() => removeComanda(Comanda)} style={{ cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faTrash} style={{color: 'red'}} size="xl" />
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
                                <DetailsComanda Comanda={Comanda} updateComanda={updateComanda} />
                                </div>
                            </div>
                            <div className="row" style={{display: !Comanda.ComandaSwitchNota ? 'none' : 'flex'}}>
                                <div className='col'>
                                {/* Text box editable backgroudn red and text blanco BOLD */}
                                    <div className='row'>
                                        <div className='col-10'>
                                        <textarea className="form-control" id={`NotaTextArea_${Comanda._id}`} rows="3" placeholder="Agregar notas" onChange={handleChangeNota} onKeyDown={handleUpdateNota}
                                        value={nota} style={{backgroundColor: liveStatusNota, color: '#fff', fontWeight: 'bold', fontSize: '30px'
                                        }}
                                        ></textarea>
                                        </div>
                                        <div className='col-2'>
                                            {/* Add Variant at Level 1 */}
                                            <div className="form-group">
                                                <button type="button" className="btn btn-light" onClick={handleNoteNew}><FontAwesomeIcon icon={faPaperPlane} style={{color: '#7ed65b'}} size="2x" /></button>
                                            </div>
                                        </div>
                                    </div>
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
                                    <DetailsComanda Comanda={Comanda} updateComanda={updateComanda} />
                                    </div>
                                </div>
                            <div className="row" style={{display: !Comanda.ComandaSwitchNota ? 'none' : 'flex'}}>
                                <div className='col'>
                                {/* Text box editable backgroudn red and text blanco BOLD */}
                                    <div className='row'>
                                        <div className='col-10'>
                                        <textarea className="form-control" id={`NotaTextArea_${Comanda._id}`} rows="3" placeholder="Agregar notas" onChange={handleChangeNota} onKeyDown={handleUpdateNota}
                                        value={nota} style={{backgroundColor: liveStatusNota, color: '#fff', fontWeight: 'bold', fontSize: '30px'
                                        }}
                                        ></textarea>
                                        </div>
                                        <div className='col-2'>
                                            {/* Add Variant at Level 1 */}
                                            <div className="form-group">
                                                <button type="button" className="btn btn-light" onClick={handleNoteNew}><FontAwesomeIcon icon={faPaperPlane} style={{color: '#7ed65b'}} size="2x" /></button>
                                            </div>
                                        </div>
                                    </div>
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
                                {/* Text box editable backgroudn red and text blanco BOLD */}
                                    <div className='row'>
                                        <div className='col'>
                                        <textarea className="form-control" id={`NotaTextArea_${Comanda._id}`} rows="2" placeholder="Agregar notas" onChange={handleChangeNota} onKeyDown={handleUpdateNota}
                                        value={nota} style={{backgroundColor: liveStatusNota, color: '#fff', fontWeight: 'bold', fontSize: '50px'
                                        }}
                                        ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                )
            )}
            </div>
        </div></div>
    );
}

export default ComandaCard;