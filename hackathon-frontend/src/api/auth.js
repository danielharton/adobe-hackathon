import { getToken } from "../utils/utilFunctions";

export const apiCheckLogin = async (errorCallBack, setUser) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/users/checkLogin`, {
            method: 'GET', // or 'GET' depending on your APIS
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!data.success) {
            // errorCallBack()
        } else {
            setUser(data)
        }
    } catch (error) {
        console.error('Error:', error);
        // errorCallBack()
    }
}