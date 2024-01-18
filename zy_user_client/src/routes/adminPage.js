
import React, { useState, useEffect } from 'react';

import ProductoModule from '../modules/ProductoModule';
import { addProducto, getProductos } from '../api/productosApi';

const AdminPage = () => {
    
    const [ListaProductos, setListaProductos] = useState([]);

    useEffect(() => {
        console.log("Obteniendo ListaProductos...");
        getProductos().then(data => {
        console.log("ListaProductos: ", data);
        setListaProductos(data);
        })
    }, []);
    
    return(
        <div>
            <div className="container-fluid" id="AgregarProductos">
            <div className="col-12">
                <div className="row">
                <button onClick={addProducto}>Agregar Producto</button>
                </div>
            </div>
            </div>
            <hr></hr>
            <div className="container-fluid" id="ListaProductos">
            <div className="col-12">
                <div className="row">
                <h2>Lista de productos</h2>
                </div>
                <div className="row">
                {
                    ListaProductos.map((producto, index) => {
                    return( <ProductoModule key={index} colSize="2" producto={producto} /> );
                    })
                }
                </div>
            </div>
            </div>
        </div>
    );
}

export default AdminPage;