const mongoose = require("mongoose");
//mongoose.connect( "mongodb+srv://edalxgoam:MlFGDDQXj4IQYhnj@clusterzonayummy.vwdr0er.mongodb.net/zonayummy?retryWrites=true&w=majority", {  } );
mongoose.connect( "mongodb+srv://edalxgoam:MlFGDDQXj4IQYhnj@freeedalxgoam.tmtu4.mongodb.net/zonayummy?retryWrites=true&w=majority", {  } )
const express = require("express");
const http = require('http');
const socketIo = require('socket.io');
const cors = require("cors");

const app = express();
const PORT = 3010;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ZonaYummy Server</title>
            <style>
                body {
                    font-family: 'Segoe UI', sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                h1 { margin-bottom: 10px; }
                p { margin-bottom: 30px; opacity: 0.9; }
                button {
                    padding: 15px 40px;
                    font-size: 18px;
                    font-weight: 600;
                    border: none;
                    border-radius: 50px;
                    background: white;
                    color: #764ba2;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                button:active { transform: scale(0.98); }
                #response {
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 10px;
                    display: none;
                }
            </style>
        </head>
        <body>
            <h1>🍽️ Servidor ZonaYummy</h1>
            <p>Corriendo en puerto ${PORT}</p>
            <button onclick="handshake()">🤝 Hand Shake</button>
            <div id="response"></div>
            <script>
                async function handshake() {
                    try {
                        const res = await fetch('/handshake', { method: 'POST' });
                        const data = await res.json();
                        const responseDiv = document.getElementById('response');
                        responseDiv.textContent = '✅ ' + data.message;
                        responseDiv.style.display = 'block';
                        setTimeout(() => { responseDiv.style.display = 'none'; }, 3000);
                    } catch (err) {
                        console.error('Error:', err);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

app.post("/handshake", (req, res) => {
    const timestamp = new Date().toLocaleString();
    console.log(`🤝 Handshake recibido de un cliente - ${timestamp}`);
    res.json({ success: true, message: `Handshake exitoso - ${timestamp}` });
});

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
    socket.on('OrdenActualizadaDesdeCliente', (data) => {
        socket.broadcast.emit('OrdenActualizadaDesdeServidor', data);
    });

    socket.on('NuevaComandaDesdeCliente', (data) => {
        console.log('Mensaje recibido del cliente:', data);
        socket.broadcast.emit('NuevaComandaDesdeServidor', data);
    });
    socket.on('UpdateComandaDesdeCliente', (data) => {
        console.log('Mensaje recibido del cliente:', data);
        socket.broadcast.emit('UpdateComandaDesdeServidor', data);
    });
    socket.on('DeleteComandaDesdeCliente', (data) => {
        console.log('Mensaje recibido del cliente:', data);
        socket.broadcast.emit('DeleteComandaDesdeServidor', data);
    });
    socket.on('SolicitudBorradoDesdeCliente', (data) => {
        socket.broadcast.emit('SolicitudBorradoDesdeServidor', data);
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
const orderV2Routes = require('./routes/orderV2Routes');
const borradoRoutes = require('./routes/borradoRoutes');
app.use('/api/orders', orderRoutes);
app.use('/api/comandas', comandaRoutes);
app.use('/api/platillos', platilloRoutes);
app.use('/api/orders/v2', orderV2Routes);
app.use('/api/borrados', borradoRoutes);


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
