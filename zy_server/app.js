const mongoose = require("mongoose");
mongoose.connect( "mongodb+srv://edalxgoam:MlFGDDQXj4IQYhnj@clusterzonayummy.vwdr0er.mongodb.net/zonayummy?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true, } );
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const Producto = require("./models/productoModel");
const { getAllProductos, saveOneProducto } = require("./controllers/productoController")

app.listen(3010,()=>{
    console.log("Server runnning in port 3010");
});

app.get("/getAllProductos", async (req,res)=>{
    const productos = await getAllProductos();
    res.send(productos);
});

app.post("/saveOneProducto", async (req,res)=>{
    const producto = new Producto({
        Categoria: req.body.Categoria,
        Proveedor: req.body.Proveedor,
        Producto: req.body.Producto,
        Unidad: req.body.Unidad,
        Precios: req.body.Precios
    });
    
    await saveOneProducto(producto);
    res.send("Producto Guardado");
});