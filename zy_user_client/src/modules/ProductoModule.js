import './ProductoModule.css';

const ProductoModule = ({colSize, producto}) => {
    const productName = producto.Producto;
    const productCategoría = producto.Categoria;
    const productProveedor = producto.Proveedor;
    const productUnidad = producto.Unidad;
    const productPrecios = producto.Precios;
    return(
      <div className={`col-${colSize}`}>
        <div className="card">
          <div className="body-card">
            <div>
              <p className="card-title"><strong>Producto: </strong>{productName}</p>
              <p className="card-subtitle"><strong>Categoría: </strong>{productCategoría}</p>
              <p className="card-subtitle"><strong>Proveedor: </strong>{productProveedor}</p>
              <p className="card-subtitle"><strong>Unidad: </strong>{productUnidad}</p>
              {/* mapear precios del array */}
              {productPrecios.map((precio, index) => {
                return(
                  // retornar solo el ultimo elemento
                  index === productPrecios.length - 1 ?
                  <p className="card-price"><strong>Precio: </strong>${precio.precio}</p>
                  : null
                );
              })}
            </div>
            <div className="div-button">
              <button type="button" class="btn btn-outline-light">Select</button>
            </div>
          </div>
        </div>
      </div>
    );
}

export default ProductoModule;