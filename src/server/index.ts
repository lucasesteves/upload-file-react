import axios from 'axios';

export const uri = "http://localhost:4000";

export const sendUpload = (body: any) => {
    return axios.post(`${uri}/upload`, body).then(response => {
        if (response.status === 200) {
            return response.data;
        } else {
            return null;
        }
    }).catch(() => {
        console.log("error")
        return null;
    })
}
