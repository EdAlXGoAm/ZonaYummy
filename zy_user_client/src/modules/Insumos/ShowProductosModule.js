import React, { useState, useEffect, useRef } from 'react';
import ProductoCard from './Producto_Card_Module';
import ProductoList from './Producto_List_Module';
import ProductoListHeader from './Producto_List_Header_Module';

const ShowProductos = ({ListaProductos, Mode, selectProductoBtn, deleteProductoBtn}) => {

    const containerRef = useRef(null);
    const [numColsPerProduct, setNumColsPerProduct] = useState (12);
    const updateNumColsPerProduct = (width) => {
        const productWidth = 700;
        const newNumColsPerProduct = Math.floor(productWidth / width * 12);
        setNumColsPerProduct(prevNumColsPerProduct => {
            console.log(`Columnas por Producto: ${newNumColsPerProduct < 12 ? newNumColsPerProduct : 12}`)
            return newNumColsPerProduct < 12 ? newNumColsPerProduct : 12;
        });
    }
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                updateNumColsPerProduct(width);
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
    }, []);


    return(
        <div className="row" ref={containerRef}>
            <div className="col-12">
                <div className="row">
                    <div className="col-12">
                        <h2>Lista de productos</h2>
                    </div>
                </div>
                <div className="row">
                    {   Mode === "Card"
                        ?
                            ListaProductos.map((producto, index) => {
                            return( <ProductoCard key={index} colSize={numColsPerProduct} producto={producto} selectProductoBtn={selectProductoBtn} deleteProductoBtn={deleteProductoBtn}/> );
                            })
                        :
                        <>
                            <ProductoListHeader colSize="12" />
                            {
                            ListaProductos.map((producto, index) => {
                            return( <ProductoList key={index} colSize="12" producto={producto} selectProductoBtn={selectProductoBtn} deleteProductoBtn={deleteProductoBtn}/> );
                            })
                            }
                        </>
                    }
                </div>
            </div>
        </div>
    );
}

export default ShowProductos;