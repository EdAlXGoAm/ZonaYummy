import Axios from "axios";
const baseURL = `${process.env.REACT_APP_API_URL}/api/comandas`;

const comandasApi = {
    getComandas : async () => {
        try {
            const response = await Axios.get(`${baseURL}/get`);
            return response.data;
        } catch (error) {
            console.error("comandasAPI error: ", error);
            throw error;
        }
    },

    getComandasByOrderId : async (OrderID) => {
        try {
            const response = await Axios.get(`${baseURL}/getByOrderId/${OrderID}`);
            return response.data;
        } catch (error) {
            console.error("comandasAPI error: ", error);
            throw error;
        }
    },

    getComanda : async (id) => {
        try {
            const response = await Axios.get(`${baseURL}/get/${id}`);
            return response.data;
        } catch (error) {
            console.error("comandasAPI error: ", error);
            throw error;
        }
    },

    addComanda : async (comanda) => {
        try {
            const response = await Axios.post(`${baseURL}/add`, comanda);
            return response.data;
        } catch (error) {
            console.error("comandasAPI error: ", error);
            throw error;
        }
    },

    updateComanda : async (comanda) => {
        try {
            const response = await Axios.put(`${baseURL}/update`, comanda)
            return response.data;
        } catch (error) {
            console.error("comandaAPI error: ", error);
            throw error;
        }
    },

    deleteComanda : async (id) => {
        try {
            const response = await Axios.delete(`${baseURL}/delete/${id}`);
            return response.data;
        } catch (error) {
            console.error("comandasAPI error: ", error);
        }
    }
}

export default comandasApi;