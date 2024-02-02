import './Producto_List.css';

const ProductoListHeader = ({colSize}) => {
    return(
      <div className={`col-${colSize}`}>
        <div className="ProductListRow"> <div className="ProductListCol">
          <div className="row align-items-center">
            <div className="col-2">
              <p className="card-subtitle"><strong>Categoría</strong></p>
            </div>
            <div className="col-2">
              <p className="card-subtitle"><strong>Proveedor</strong></p>
            </div>
            <div className="col-2">
              <p className="card-title"><strong>Producto</strong></p>
            </div>
            <div className="col-1">
              <p className="card-subtitle"><strong>Unidad</strong></p>
            </div>
            <div className="col-1">
              <p className="card-subtitle"><strong>Cantidad</strong></p>
            </div>
            <div className="col-1">
              <p className="card-subtitle"><strong>Precio</strong></p>
            </div>
          </div>
        </div></div>
      </div>
    );
}

export default ProductoListHeader;