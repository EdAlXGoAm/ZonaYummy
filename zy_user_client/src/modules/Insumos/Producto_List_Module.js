import './Producto_List.css';

const ProductoList = ({colSize, producto, selectProductoBtn, deleteProductoBtn}) => {
    const productName = producto.Producto;
    const productCategoría = producto.Categoria;
    const productProveedor = producto.Proveedor;
    const productUnidad = producto.Unidad;
    const productCantidad = producto.Cantidad;
    const productPrecios = producto.Precios;
    return(
      <div className={`col-${colSize}`}>
        <div className="ProductListRow"> <div className="ProductListCol">
          <div className="row align-items-center">
            <div className="col-2">
              <p className="card-subtitle">{productCategoría}</p>
            </div>
            <div className="col-2">
              <p className="card-subtitle">{productProveedor}</p>
            </div>
            <div className="col-2">
              <p className="card-title">{productName}</p>
            </div>
            <div className="col-1">
              <p className="card-subtitle">{productUnidad}</p>
            </div>
            <div className="col-1">
              <p className="card-subtitle">{productCantidad}
              {
                productUnidad === "Volumen" ? " Lt" :
                productUnidad === "Peso" ? " kg" :
                productUnidad === "Piezas" ? " pz" :
                null
              }
              </p>
            </div>
            <div className="col-1">
              <p className="card-subtitle">$
                {
                  productPrecios.length > 0 && productPrecios[productPrecios.length - 1].precio !== null
                  ? productPrecios[productPrecios.length - 1].precio.toFixed(2)
                  : "NA"
                }
              </p>
            </div>
            <div className="col-3">
              <div className="div-button">
                {selectProductoBtn !== null
                ? <button type="button" className="btn btn-outline-light btn-sm" id="selectBtn" alt="selectBtn" onClick={()=>{selectProductoBtn(producto)}}>Select</button>
                : null
                }
                <button type="button" className="btn btn-warning btn-sm">Edit</button>{" "}
                <button type="button" className="btn btn-danger btn-sm" id="deleteBtn" alt="deleteBtn" onClick={()=>{deleteProductoBtn(producto)}}>Delete</button>
              </div>
            </div>
          </div>
        </div></div>
      </div>
    );
}

export default ProductoList;