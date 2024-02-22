import React, { useState, useEffect } from 'react';
import ordersApi from './../../../api/ordersApi';
import comandasApi from './../../../api/comandasApi';
import ResumeComanda from './ResumeComandaComponent';

import io from 'socket.io-client';
const socket = io(`${process.env.REACT_APP_API_URL}`);

const OrdenesCocina = ({modeInterface, Orders}) => {
    const [numOrders, setNumOrders] = useState([]);
 
    const [activeComandas, setActiveComandas] = useState([]);
    const [arrayPostres, setArrayPostres] = useState([]);
    const [arrayBebidas, setArrayBebidas] = useState([]);
    const [arrayBotanas, setArrayBotanas] = useState([]);
    const [arrayComidas, setArrayComidas] = useState([]);
    const [arrayWaffles, setArrayWaffles] = useState([]);

    const fetchComandasFromOrders = () => {
        console.log("fetchComandasFromOrders using the next Orders:", Orders)
        setNumOrders(Orders.length); // Just fill the const
        let localOrders = Orders;
        let localActiveComandas = [];// Transforma cada 'Order' en una promesa que resuelve sus 'comandas'

        let comandasPromises = localOrders.map(order => {
            return comandasApi.getComandasByOrderId(order.OrderID)
                .then(response => {
                    const res_comandas = response.map(comanda => {
                        return {
                            ...comanda, // Esto copia todas las propiedades existentes del postre
                            Customer: order.Customer // Esto agrega el nuevo elemento Customer
                        };
                    });
                    return res_comandas; // Devuelve la respuesta para su uso posterior
                })
                .catch(e => {
                    console.log(e);
                    return []; // En caso de error, devuelve un array vacío para mantener la estructura
                });
        });
        
        // Espera a que todas las promesas se resuelvan
        Promise.all(comandasPromises).then(comandasResults => {
            // Concatena todas las respuestas en 'localActiveComandas'
            localActiveComandas = comandasResults.flat(); // 'flat()' es útil si cada 'response' es un array
            console.log("Todas las comandas activas: ", localActiveComandas);
            setActiveComandas(prevActiveComandas => {
                console.log("Comandas to setActiveComandas: ", localActiveComandas);
                return (localActiveComandas);
            });
            
        }).catch(e => {
            console.log("Error al recuperar comandas: ", e);
        });

    };

    useEffect(() => {
        fetchComandasFromOrders();
    }, [Orders]);

    const fetchCategorias = () => {
        // Removing all localArrayBebidas objects whos localActiveComanda[i].ComandaPrepStatus === Preparing
        let localComandasForCategorize = [...activeComandas].filter(c => c.ComandaPrepStatus !== "ReadyToServe");
        // Copy to arrayPostres all localArrayBebidas objects whos Platillo is in the Postres category
        const localArrayPostres = localComandasForCategorize.filter(c => c.Categoria === "Postres");
        // Copy to arrayBebidas all localArrayBebidas objects whos Platillo is in the Bebidas category
        const localArrayBebidas = localComandasForCategorize.filter(c => c.Categoria === "Bebidas");
        // Copy to arrayBotanas all localArrayBebidas objects whos Platillo is in the Botanas category
        const localArrayBotanas = localComandasForCategorize.filter(c => c.Categoria === "Botanas");
        // Copy to arrayComidas all localArrayBebidas objects whos Platillo is in the Comidas category
        const localArrayComidas = localComandasForCategorize.filter(c => c.Categoria === "Comida");
        // Copy to arrayWaffles all localArrayBebidas objects whos Platillo is in the Waffles category
        const localArrayWaffles = localComandasForCategorize.filter(c => c.Categoria === "Waffles");

        setArrayPostres(localArrayPostres);
        setArrayBebidas(localArrayBebidas);
        setArrayBotanas(localArrayBotanas);
        setArrayComidas(localArrayComidas);
        setArrayWaffles(localArrayWaffles);
        console.log("## Orders: ", Orders);
        console.log("## Comandas: ", localComandasForCategorize);
        console.log("# Postres: ", localArrayPostres);
        console.log("# Bebidas: ", localArrayBebidas);
        console.log("# Botanas: ", localArrayBotanas);
        console.log("# Comida: ", localArrayComidas);
        console.log("# Waffles: ", localArrayWaffles);
    }

    useEffect(() => { 
        fetchCategorias();
    }, [activeComandas]);

    const renderSixFirstPostres = () => {
        let localArrayPostres = arrayPostres;
        let localNumPostres = localArrayPostres.length;
        let localSixFirstPostres = [];
        for (let i = 0; i < 6; i++) {
            if (i < localNumPostres) {
                localSixFirstPostres.push(
                    <div key={localArrayPostres[i].ComandaId} className="col-2">
                        <ResumeComanda Comanda={localArrayPostres[i]} />
                    </div>
                );
            }
        }
        return localSixFirstPostres;
    };

    
    const renderSixFirstBebidas = () => {
        let localArrayBebidas = arrayBebidas;
        let localNumBebidas = localArrayBebidas.length;
        let localSixFirstBebidas = [];
        for (let i = 0; i < 6; i++) {
            if (i < localNumBebidas) {
                localSixFirstBebidas.push(
                    <div key={localArrayBebidas[i].ComandaId} className="col-2">
                        <ResumeComanda Comanda={localArrayBebidas[i]} />
                    </div>
                );
            }
        }
        return localSixFirstBebidas;
    };

    const renderSixFirstBotanas = () => {
        let localArrayBotanas = arrayBotanas;
        let localNumBotanas = localArrayBotanas.length;
        let localSixFirstBotanas = [];
        for (let i = 0; i < 6; i++) {
            if (i < localNumBotanas) {
                localSixFirstBotanas.push(
                    <div key={localArrayBotanas[i].ComandaId} className="col-2">
                        <ResumeComanda Comanda={localArrayBotanas[i]} />
                    </div>
                );
            }
        }
        return localSixFirstBotanas;
    };

    const renderSixFirstComidas = () => {
        let localArrayComidas = arrayComidas;
        let localNumComidas = localArrayComidas.length;
        let localSixFirstComidas = [];
        for (let i = 0; i < 6; i++) {
            if (i < localNumComidas) {
                localSixFirstComidas.push(
                    <div key={localArrayComidas[i].ComandaId} className="col-2">
                        <ResumeComanda Comanda={localArrayComidas[i]} />
                    </div>
                );
            }
        }
        return localSixFirstComidas;
    };

    const renderSixSecComidas = () => {
        let localArrayComidas = arrayComidas;
        let localNumComidas = localArrayComidas.length;
        let localSixFirstComidas = [];
        for (let i = 6; i < localNumComidas; i++) {
            if (i < localNumComidas) {
                localSixFirstComidas.push(
                    <div key={localArrayComidas[i].ComandaId} className="col-2">
                        <ResumeComanda Comanda={localArrayComidas[i]} />
                    </div>
                );
            }
        }
        return localSixFirstComidas;
    };

    const renderSixFirstWaffles = () => {
        
        let localArrayWaffles = arrayWaffles;
        let localNumWaffles = localArrayWaffles.length;
        let localSixFirstWaffles = [];
        for (let i = 0; i < 6; i++) {
            if (i < localNumWaffles) {
                localSixFirstWaffles.push(
                    <div key={localArrayWaffles[i].ComandaId} className="col-2">
                        <ResumeComanda Comanda={localArrayWaffles[i]} />
                    </div>
                );
            }
        }
        return localSixFirstWaffles;
    }

    
    useEffect(() => { // NewComanda
        socket.on('NuevaComandaDesdeServidor', (data) => {
            if (!modeInterface) {
                const audioMsg = `${data.msg.split('-')[0]}-${data.msg.split('-')[2]}`;
                console.log("MSG_Audio: ", audioMsg);
                if (audioMsg === "Add-Hamburguesa") {
                    const audio = new Audio("ComandaAudios/Solicitan-Hamburguesa.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Vaso de Postre") {
                    const audio = new Audio("ComandaAudios/Solicitan-VasoDePostre.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Pay de Limón") {
                    const audio = new Audio("ComandaAudios/Solicitan-Pay-de-Limon.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Cheese Cake") {
                    const audio = new Audio("ComandaAudios/Solicitan-Cheese-Cake.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Maruchan Loca") {
                    const audio = new Audio("ComandaAudios/Solicitan-Maruchan-Loca.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Vaso de Esquites") {
                    const audio = new Audio("ComandaAudios/Solicitan-Esquites.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Doriesquites") {
                    const audio = new Audio("ComandaAudios/Solicitan-Doriesquites.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Maruchan con Suadero") {
                    const audio = new Audio("ComandaAudios/Solicitan-Maruchan-Suadero.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Alitas a la BBQ") {
                    const audio = new Audio("ComandaAudios/Solicitan-Alitas.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Rebanada de Pizza") {
                    const audio = new Audio("ComandaAudios/Solicitan-Rebanada-Pizza.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Papas a la Francesa") {
                    const audio = new Audio("ComandaAudios/Solicitan-Papas.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Hot Dog") {
                    const audio = new Audio("ComandaAudios/Solicitan-Hotdog.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Salchipulpos") {
                    const audio = new Audio("ComandaAudios/Solicitan-Salchipulpos.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Sincronizadas") {
                    const audio = new Audio("ComandaAudios/Solicitan-Sincronizadas.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Donitas") {
                    const audio = new Audio("ComandaAudios/Solicitan-Donitas.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Bubble Waffle") {
                    const audio = new Audio("ComandaAudios/Solicitan-Waffle.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Café") {
                    const audio = new Audio("ComandaAudios/Solicitan-Cafe.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Frappé") {
                    const audio = new Audio("ComandaAudios/Solicitan-Frappe.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Malteada") {
                    const audio = new Audio("ComandaAudios/Solicitan-Malteada.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Esquimo") {
                    const audio = new Audio("ComandaAudios/Solicitan-Esquimo.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Bubble Soda") {
                    const audio = new Audio("ComandaAudios/Solicitan-Bubble-Soda.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Agua Fresca") {
                    const audio = new Audio("ComandaAudios/Solicitan-Agua-Fresca.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Refresco") {
                    const audio = new Audio("ComandaAudios/Solicitan-Refresco.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Ensalada") {
                    const audio = new Audio("ComandaAudios/Solicitan-Ensalada.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Platanos Fritos") {
                    const audio = new Audio("ComandaAudios/Solicitan--PlatanosFritos.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Nuggets con Papas") {
                    const audio = new Audio("ComandaAudios/Solicitan--Nuggets.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-Pastel") {
                    const audio = new Audio("ComandaAudios/Solicitan-Pastel.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-AMOR Hamburguesa") {
                    const audio = new Audio("ComandaAudios/Solicitan-SanValentinHamburguesa.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-AMOR Alitas") {
                    const audio = new Audio("ComandaAudios/Solicitan-SanValentinAlitas.wav");
                    audio.play();
                }
                else if (audioMsg === "Add-AMOR Hot Dog") {
                    const audio = new Audio("ComandaAudios/Solicitan-SanValentinHotDogs.wav");
                    audio.play();
                }
            }
        });
        return () => {
            socket.off('NuevaComandaDesdeServidor');
        };
    }, []);

    return (
        <div className="row contenedor-elementos">
            <div className="col-12 fila-elemento">
                <div className="row">
                    <div className="col-1" style={{color: '#fff', fontFamily: "'Salsa', cursive", fontSize: '30px'}}>
                        {`BEBIDAS -> `}
                    </div>
                    <div className="col-11">
                        <div className="row">
                            {renderSixFirstBebidas()}
                        </div>
                    </div>
                </div>
            </div>
        
            <div className="col-12 fila-elemento">
                <div className="row">
                    <div className="col-1" style={{color: '#fff', fontFamily: "'Salsa', cursive", fontSize: '30px'}}>
                        {`ESQUITES -> `}
                    </div>
                    <div className="col-11">
                        <div className="row">
                            {renderSixFirstBotanas()}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="col-12 fila-elemento">
                <div className="row">
                    <div className="col-1" style={{color: '#fff', fontFamily: "'Salsa', cursive", fontSize: '30px'}}>
                        {`COMIDA -> `}
                    </div>
                    <div className="col-11">
                        <div className="row">
                            {renderSixFirstComidas()}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="col-12 fila-elemento">
                <div className="row">
                    <div className="col-1" style={{color: '#fff', fontFamily: "'Salsa', cursive", fontSize: '30px'}}>
                        {`COMIDA 2 -> `}
                    </div>
                    <div className="col-11">
                        <div className="row">
                            {renderSixSecComidas()}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="col-12 fila-elemento">
                <div className="row">
                    <div className="col-1" style={{color: '#fff', fontFamily: "'Salsa', cursive", fontSize: '30px'}}>
                        {`WAFFLES -> `}
                    </div>
                    <div className="col-11">
                        <div className="row">
                            {renderSixFirstWaffles()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default OrdenesCocina;