
import Axios from "axios";
const baseURL = `${process.env.REACT_APP_API_URL}`;

export const addProducto = (producto) => {
  return Axios.post(`${baseURL}/saveOneProducto`,{
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
  return Axios.get(`${baseURL}/getAllProductos`)
  .then((response)=>{
    return response.data;
  });
}
export const deleteProductoByProducto = (producto) => {
  return Axios.post(`${baseURL}/deleteProductoByProducto`,{
    Producto: producto.Producto
  }).then(()=>{
    alert("Producto Eliminado Correctamente");
  });
}
