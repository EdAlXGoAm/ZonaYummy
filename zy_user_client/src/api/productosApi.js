
import Axios from "axios";

export const addProducto = () => {
  Axios.post("http://localhost:3010/saveOneProducto",{
    Categoria: "Consumibles",
    Proveedor: "Zorro",
    Producto: "Alitas",
    Unidad: "Volumen",
    Precios: [
        {
            fecha: "2024-01-12",
            precio: 21
        },
        {
            fecha: "2024-01-15",
            precio: 20.3
        },
        {
            fecha: "2024-01-17",
            precio: 20.3
        }
    ]
}).then(()=>{
  alert("Producto Agregado Correctamente");
});

}
export const getProductos = () => {
  return Axios.get("http://localhost:3010/getAllProductos")
  .then((response)=>{
    return response.data;
  });
}
