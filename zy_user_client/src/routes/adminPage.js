
import React, { useState, useEffect } from 'react';
import './adminPage.css';
import AddPlatilloForm from '../modules/Platillos/AddPlatilloFormModule';
import AddProductoForm from '../modules/Insumos/AddProductoModule';
import ShowProductos from '../modules/Insumos/ShowProductosModule';
import CalcularPreciosForm from '../modules/CalcularPrecios/CalcularPreciosModule';
import { addProducto, getProductos, deleteProductoByProducto } from '../api/productosApi';

const AdminPage = () => {
    
    const [ListaProductos, setListaProductos] = useState([]);
    const [ListaPlatillos, setListaPlatillos] = useState([]);
    const [ListaIngredientes, setListaIngredientes] = useState([]);
    const [isModalPlatilloOpen, setIsModalPlatilloOpen] = useState(false);
    const [editPlatilloId, setEditPlatilloId] = useState(null);

    const openPlatilloModal = (platilloId = null) => {
        setEditPlatilloId(platilloId);
        setIsModalPlatilloOpen(true);
    };
    const closePlatilloModal = () => {
        setIsModalPlatilloOpen(false);
        setEditPlatilloId(null);
    };

    const fetchProductos = () => {
        // console.log("Obteniendo ListaProductos...");
        getProductos().then(data => {
        // console.log("ListaProductos: ", data);
        setListaProductos(data);
        });
    };
    useEffect(() => {
        fetchProductos();
    },[]);
    const addProductoBtn = (event) => {
        event.preventDefault();
        addProducto({
            Categoria: document.getElementById("Categoria").value,
            Proveedor: document.getElementById("Proveedor").value,
            Producto: document.getElementById("Producto").value,
            Unidad: document.getElementById("Unidad").value,
            Cantidad: document.getElementById("Cantidad").value,
            Precios: document.getElementById("Precio").value
        })
        .then(() => {
            fetchProductos();
        })
    };
    const addListaIngredientes = (producto) => {
        const productPrecios = producto.Precios;
        const currentPrecio = productPrecios.length > 0 ? productPrecios[productPrecios.length - 1].precio : 0.0;
        let newPrecioPorUnidad = 0.0;
        producto.Unidad === "Volumen" ?
        newPrecioPorUnidad = currentPrecio / (producto.Cantidad * 1000) :
        producto.Unidad === "Peso" ?
        newPrecioPorUnidad = currentPrecio / (producto.Cantidad * 1000) :
        producto.Unidad === "Piezas" ?
        newPrecioPorUnidad = currentPrecio / producto.Cantidad :
        newPrecioPorUnidad = -1;
        const newIngrediente = {
            Producto: producto.Producto,
            Unidad: producto.Unidad,
            Cantidad: producto.Cantidad,
            Precio: currentPrecio,
            PrecioPorUnidad: newPrecioPorUnidad,
            CantidadUsada: 0,
            CostoCalculado: 0
        }
        setListaIngredientes(prevListaIngredientes => {
            const newListaIngredientes = [...prevListaIngredientes, newIngrediente];
            console.log("Lista Ingredientes: ", newListaIngredientes);
            return newListaIngredientes;
        });
    };
    const updateCostoIngrediente = (ingrediente, CantidadUsada, CostoCalculado) => {
        const prevListaIngredientes = ListaIngredientes;
        const newListaIngredientes = prevListaIngredientes.map(prevIngrediente => {
            if(prevIngrediente.Producto === ingrediente.Producto){
                prevIngrediente.CantidadUsada = CantidadUsada;
                prevIngrediente.CostoCalculado = CostoCalculado;
            }
            return prevIngrediente;
        });
        console.log("Lista de Ingredientes: ", newListaIngredientes);
        setListaIngredientes(newListaIngredientes);
    };
    const selectProductoBtn = (producto) => {
        addListaIngredientes(producto);
    };
    const deleteProductoBtn = (producto) => {
        deleteProductoByProducto(producto)
        .then(() => {
            fetchProductos();
        })
    };
    
    return(
        <div>
            {/* Lista de Platillos (tarjetas) - Visible en la página */}
            <div className="container-fluid" id="ListaPlatillos">
                <AddPlatilloForm 
                    mode="list" 
                    onEditRequest={openPlatilloModal}
                />
            </div>

            {/* Modal con formulario de Agregar/Editar Platillo */}
            {isModalPlatilloOpen && (
                <div className="modal-overlay" onClick={closePlatilloModal}>
                    <div className="modal-platillo-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editPlatilloId ? 'Editar Platillo' : 'Agregar Nuevo Platillo'}</h2>
                            <button className="modal-close-btn" onClick={closePlatilloModal}>✕</button>
                        </div>
                        <div className="modal-body">
                            <AddPlatilloForm 
                                mode="form"
                                editPlatilloId={editPlatilloId}
                                onClose={closePlatilloModal}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="container-fluid" id="AgregarProductos">
                <AddProductoForm addProductoBtn={addProductoBtn} />
            </div>
            <hr></hr>
            {/* <div className="container-fluid" id="ListaProductos">
                <ShowProductos ListaProductos={ListaProductos} Mode={"List"} selectProductoBtn={null} deleteProductoBtn={deleteProductoBtn} />
            </div> */}
            <hr></hr>
            <div className="container-fluid" id="CalcularPrecios">
                <CalcularPreciosForm ListaIngredientes={ListaIngredientes} updateCostoIngrediente={updateCostoIngrediente} />
            </div>
            <div className="container-fluid" id="ListaProductos">
                <ShowProductos ListaProductos={ListaProductos} Mode={"Card"} selectProductoBtn={selectProductoBtn} deleteProductoBtn={deleteProductoBtn} />
            </div>
            <hr></hr>
        </div>
    );
}

export default AdminPage;