import Axios from "axios";
const baseURL = `${process.env.REACT_APP_API_URL}/api/platillos`;

const platillosApi = {
    getPlatillos : async () => {
        try {
            const response = await Axios.get(`${baseURL}/get`);
            return response.data;
        } catch (error) {
            console.log("platillosAPI error: ", error);
            throw error;
        }
    },

    getPlatillo : async (id) => {
        try {
            const response = await Axios.get(`${baseURL}/get/${id}`);
            return response.data;
        } catch (error) {
            console.log("platillosAPI error: ", error);
            throw error;
        }
    },

    addPlatillo : async (platillo) => {
        try {
            const response = await Axios.post(`${baseURL}/add`, platillo);
            return response.data;
        } catch (error) {
            console.log("platillosAPI error: ", error);
            throw error;
        }
    },

    updatePlatillo : async (platillo) => {
        try {
            const response = await Axios.put(`${baseURL}/update`, platillo);
            return response.data;
        } catch (error) {
            console.log("platillosAPI error: ", error);
            throw error;
        }
    },

    deletePlatillo : async (id) => {
        try {
            const response = await Axios.delete(`${baseURL}/delete/${id}`);
            return response.data;
        } catch (error) {
            console.log("platillosAPI error: ", error);
            throw error;
        }
    },

    getLastPlatilloId : async () => {
        try {
            const response = await Axios.get(`${baseURL}/getLastPlatilloId/`);
            return response.data;
        } catch (error) {
            console.log("platillosAPI error: ", error);
            throw error;
        }
    }
}

export default platillosApi;