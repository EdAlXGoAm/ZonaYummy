const AddProductoForm = ({addProductoBtn, onClose}) => {

    const handleCancel = () => {
        if (onClose) onClose();
    };

    return(
        <div className="producto-form-container">
            <form className="producto-form" onSubmit={addProductoBtn}>
                <div className="form-group">
                    <label htmlFor="Categoria">Categoría</label>
                    <input type="text" className="form-control" id="Categoria" placeholder="Ej: Lácteos, Carnes, Verduras..." />
                </div>
                <div className="form-group">
                    <label htmlFor="Proveedor">Proveedor</label>
                    <input type="text" className="form-control" id="Proveedor" placeholder="Nombre del proveedor" />
                </div>
                <div className="form-group">
                    <label htmlFor="Producto">Producto</label>
                    <input type="text" className="form-control" id="Producto" placeholder="Nombre del producto" />
                </div>
                <div className="form-row">
                    <div className="form-group form-group-half">
                        <label htmlFor="Unidad">Unidad</label>
                        <input type="text" className="form-control" id="Unidad" placeholder="Kg, L, Pza..." />
                    </div>
                    <div className="form-group form-group-half">
                        <label htmlFor="Cantidad">Cantidad</label>
                        <input type="text" className="form-control" id="Cantidad" placeholder="0" />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="Precio">Precio</label>
                    <input type="text" className="form-control" id="Precio" placeholder="$0.00" />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-success">Agregar Producto</button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}

export default AddProductoForm;