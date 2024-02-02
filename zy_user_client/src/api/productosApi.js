
import Axios from "axios";

export const addProducto = (producto) => {
  return Axios.post("http://192.168.100.38:3010/saveOneProducto",{
    Categoria: producto.Categoria,
    Proveedor: producto.Proveedor,
    Producto: producto.Producto,
    Unidad: producto.Unidad,
    Cantidad: producto.Cantidad,
    Precios: producto.Precios
}).then(()=>{
  alert("Producto Agregado Correctamente");
});
}
export const getProductos = () => {
  return Axios.get("http://192.168.100.38:3010/getAllProductos")
  .then((response)=>{
    return response.data;
  });
}
export const deleteProductoByProducto = (producto) => {
  return Axios.post("http://192.168.100.38:3010/deleteProductoByProducto",{
    Producto: producto.Producto
  }).then(()=>{
    alert("Producto Eliminado Correctamente");
  });
}
