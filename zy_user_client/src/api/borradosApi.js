import Axios from 'axios';

const baseURL = `${process.env.REACT_APP_API_URL}/api/comandas/borrados`;

const wrapBorradosError = (err) => {
    if (err.response?.status === 404) {
        const url = err.config?.url || baseURL;
        throw new Error(
            `Ruta no encontrada (${url}). Despliega en zy_server: comandaRoutes.js, borradoController.js y borradoSolicitudModel.js, luego reinicia el servidor.`,
        );
    }
    throw err;
};

const borradosApi = {
    solicitarBorrado: async (comanda) => {
        try {
            if (!comanda?._id) {
                throw new Error('La comanda no tiene _id (debe existir en la base de datos).');
            }
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
        } catch (err) {
            wrapBorradosError(err);
        }
    },

    getPendientes: async () => {
        try {
            const response = await Axios.get(`${baseURL}/pendientes`);
            return response.data;
        } catch (err) {
            wrapBorradosError(err);
        }
    },

    procederBorrado: async (solicitudId) => {
        try {
            const response = await Axios.post(`${baseURL}/proceder/${solicitudId}`);
            return response.data;
        } catch (err) {
            wrapBorradosError(err);
        }
    },

    rechazarBorrado: async (solicitudId) => {
        try {
            const response = await Axios.post(`${baseURL}/rechazar/${solicitudId}`);
            return response.data;
        } catch (err) {
            wrapBorradosError(err);
        }
    },
};

export default borradosApi;
