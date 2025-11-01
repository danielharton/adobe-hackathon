import { getToken } from "../utils/utilFunctions";


export const apiGetUserRights = async (setUserRights) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/rights/getUserRights`, {
            method: 'GET', // or 'GET' depending on your APIS
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('userRights API response:', data);
        if (!data.success) {
        } else {
            setUserRights(data.data)
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
