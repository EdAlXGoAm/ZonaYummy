const AddProductoForm = ({addProductoBtn}) => {

    return(
        <div className="col-12">
            <div className="col-12">
                <div className="row">
                    <form onSubmit={addProductoBtn}>
                        <div className="form-group">
                            <label htmlFor="Categoria">Categoría</label>
                            <input type="text" className="form-control" id="Categoria" placeholder="Categoría" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Proveedor">Proveedor</label>
                            <input type="text" className="form-control" id="Proveedor" placeholder="Proveedor" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Producto">Producto</label>
                            <input type="text" className="form-control" id="Producto" placeholder="Producto" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Unidad">Unidad</label>
                            <input type="text" className="form-control" id="Unidad" placeholder="Unidad" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Cantidad">Cantidad</label>
                            <input type="text" className="form-control" id="Cantidad" placeholder="Cantidad" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Precio">Precio</label>
                            <input type="text" className="form-control" id="Precio" placeholder="Precio" />
                        </div>

                        <button type="submit">Agregar Producto</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddProductoForm;