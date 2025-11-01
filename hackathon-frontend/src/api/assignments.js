import { getToken } from '../utils/utilFunctions';

export const apiAddAssignment = async (successCallback, errorCallback, reqData) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const token = getToken();
    try {

        const formData = new FormData();

        formData.append('file', reqData.requirement_file_path);
        formData.append('class_id', reqData.class_id);
        formData.append('subject_id', reqData.subject_id);
        formData.append('assignment', reqData.assignment);


        const response = await fetch(`${apiUrl}/api/assignments/addAssignment`, {
            method: 'POST',
            headers: {
                // 'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to add grade" });
    }
};


export const apiDeleteAssignment = async (successCallback, errorCallback, assignmentId) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/assignments/deleteAssignment/${assignmentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to delete assignment" });
    }
};


export const apiGetAssignmentsByStudentIdByClassId = async (successCallback, errorCallback, classId) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/assignments/getAssignmentsByStudentIdByClassId/${classId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!data.success) {
            // errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to fetch assignments" });
    }
};

export const apiGetAssignmentsBySubjectIdByStudentId = async (successCallback, errorCallback) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/assignments/getAssignmentsBySubjectIdByStudentId`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });


        const data = await response.json();
        if (!data.success) {
            // errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to fetch assignments" });
    }
};


export const apiAddAssignmentSolution = async (successCallback, errorCallback, reqData) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const token = getToken();
    try {

        const formData = new FormData();

        formData.append('file', reqData.solution_file_path);
        formData.append('assignment_id', reqData.assignment_id);

        console.log('formData', formData);

        const response = await fetch(`${apiUrl}/api/assignments/addAssignmentSolution`, {
            method: 'POST',
            headers: {
                // 'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to add grade" });
    }
};


export const apiDeleteAssignmentSolution = async (successCallback, errorCallback, assignmentId) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/assignments/deleteAssignmentSolution/${assignmentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to delete assignment" });
    }
};
