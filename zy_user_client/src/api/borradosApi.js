import Axios from 'axios';

const baseURL = `${process.env.REACT_APP_API_URL}/api/borrados`;

const borradosApi = {
    solicitarBorrado: async (comanda) => {
        const response = await Axios.post(`${baseURL}/solicitar`, {
            comandaMongoId: comanda._id,
            OrderID: comanda.OrderID,
            ComandaId: comanda.ComandaId,
            Platillo: comanda.Platillo,
            Precio: comanda.Precio,
            Imagen: comanda.Imagen,
            Categoria: comanda.Categoria,
        });
        return response.data;
    },

    getPendientes: async () => {
        const response = await Axios.get(`${baseURL}/pendientes`);
        return response.data;
    },

    procederBorrado: async (solicitudId) => {
        const response = await Axios.post(`${baseURL}/proceder/${solicitudId}`);
        return response.data;
    },

    rechazarBorrado: async (solicitudId) => {
        const response = await Axios.post(`${baseURL}/rechazar/${solicitudId}`);
        return response.data;
    },
};

export default borradosApi;
