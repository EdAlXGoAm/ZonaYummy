import './Producto_Card.css';

const ProductoCard = ({colSize, producto, selectProductoBtn, deleteProductoBtn}) => {
    const productName = producto.Producto;
    const productCategoría = producto.Categoria;
    const productProveedor = producto.Proveedor;
    const productUnidad = producto.Unidad;
    const productCantidad = producto.Cantidad;
    const productPrecios = producto.Precios;
    return(
      <div className={`col-${colSize}`}>
        <div className="card">
          <div className="body-card">
            <div>
              {/* <p className="card-title"><strong>Producto: </strong>{productName}</p> */}
              <p className="card-title"><strong>{productName}</strong></p>
              <p className="card-subtitle"><strong>Categoría: </strong>{productCategoría}</p>
              <p className="card-subtitle"><strong>Proveedor: </strong>{productProveedor}</p>
              <p className="card-subtitle"><strong>Unidad: </strong>{productUnidad}</p>
              <p className="card-subtitle"><strong>Cantidad: </strong>{productCantidad}
              {
                productUnidad === "Volumen" ? " Lt" :
                productUnidad === "Peso" ? " kg" :
                productUnidad === "Piezas" ? " pz" :
                null
              }
              </p>
              {/* obtener el ultimo lemento de productPrecios */}
              <p className="card-price"><strong>Precio: </strong>$
                {productPrecios.length > 0 ? productPrecios[productPrecios.length - 1].precio : null}
              </p>
            </div>
            <div className="div-button botones-card">
              {selectProductoBtn !== null
              ? <button type="button" className="btn btn-outline-light" id="selectBtn" alt="selectBtn" onClick={()=>{selectProductoBtn(producto)}}>Select</button>
              : null
              }
              <button type="button" className="btn btn-warning">Edit</button>
              <button type="button" className="btn btn-danger"id="deleteBtn" alt="deleteBtn" onClick={()=>{deleteProductoBtn(producto)}}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    );
}

export default ProductoCard;