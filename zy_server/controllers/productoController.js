const Producto = require("../models/productoModel");

async function getAllProductos() {
    try {
        // Obtener todas las tareas de la base de datos ordenados alfabeticamente usando el valor Producto
        const productosList = await Producto.find().sort({ Producto: 1})
        
        // Comprobar si hay tareas disponibles
        if (productosList.length === 0) {
            console.log("No hay productos disponibles para mostrar.");
            return []
        }
        console.log("Productos:", productosList)
        return productosList;
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        return []
    }
}

async function saveOneProducto(producto) {
    try {
        // Guardar la tarea en la base de datos
        const productoGuardado = await producto.save();
        console.log("Producto guardado:", productoGuardado);
    } catch (error) {
        console.error("Error al guardar el producto:", error);
    }
}
// Exporta todas tus funciones
module.exports = {
    getAllProductos,
    saveOneProducto
  };
  