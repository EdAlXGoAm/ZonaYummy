const mongoose = require("mongoose");
mongoose.connect( "mongodb+srv://edalxgoam:MlFGDDQXj4IQYhnj@clusterzonayummy.vwdr0er.mongodb.net/zonayummy?retryWrites=true&w=majority", {  } );
const express = require("express");
const http = require('http');
const socketIo = require('socket.io');
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "*", // Configura los orígenes permitidos según tus necesidades
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    socket.on('NuevaOrdenDesdeCliente', () => {
        socket.broadcast.emit('NuevaOrdenDesdeServidor',
        "Nuevo pedido en pantalla. Esperando los detalles del pedido");
    });
    socket.on('OrdenEliminadaDesdeCliente', () => {
        socket.broadcast.emit('OrdenEliminadaDesdeServidor',
        "Precaución. Se ha eliminado una orden.");
    });

    socket.on('NuevaComandaDesdeCliente', (data) => {
        console.log('Mensaje recibido del cliente:', data);
        socket.broadcast.emit('NuevaComandaDesdeServidor', data);
    });
    socket.on('UpdateComandaDesdeCliente', (data) => {
        console.log('Mensaje recibido del cliente:', data);
        socket.broadcast.emit('UpdateComandaDesdeServidor', data);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});


const Producto = require("./models/productoModel");
const { getAllProductos, saveOneProducto } = require("./controllers/productoController")

app.get("/getAllProductos", async (req,res)=>{
    const productos = await getAllProductos();
    res.send(productos);
});
app.post("/saveOneProducto", async (req,res)=>{
    console.log(req.body);
    const date = new Date();
    const producto = new Producto({
        Categoria: req.body.Categoria,
        Proveedor: req.body.Proveedor,
        Producto: req.body.Producto,
        Unidad: req.body.Unidad,
        Cantidad: req.body.Cantidad,
        Precios: [{
            fecha: date.toISOString().slice(0,10),
            precio: req.body.Precios
        }]
    }); 
    await saveOneProducto(producto);
    res.send("Producto Guardado");
});
app.post("/deleteProductoByProducto", async (req,res)=>{
    console.log(req.body);
    await Producto.deleteOne({Producto:req.body.Producto});
    res.send("Producto Eliminado");
});

const orderRoutes = require('./routes/orderRoutes');
const comandaRoutes = require('./routes/comandaRoutes');
const platilloRoutes = require('./routes/platilloRoutes');
app.use('/api/orders', orderRoutes);
app.use('/api/comandas', comandaRoutes);
app.use('/api/platillos', platilloRoutes);


server.listen(3010, () => {
    console.log("Server running on port 3010");
});