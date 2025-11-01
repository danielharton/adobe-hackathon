import { Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import { RIGHTS_MAPPING } from "../../utils/utilConstants";
const Dashboard = ({ userRights }) => {

    const rightCode = userRights[0]?.right_code;
    return (
        <>
            <Typography variant="h4">
                {/* <span className="font-bold text-black">{'dashboard'}</span> */}

                {rightCode === RIGHTS_MAPPING.ADMIN && (
                    <Navigate to="/dashboard/classStudents" />
                )}
                {rightCode === RIGHTS_MAPPING.TEACHER && (
                    <Navigate to="/dashboard/classStudents" />
                )}
                {rightCode === RIGHTS_MAPPING.STUDENT && (
                    <Navigate to="/dashboard/grades" />
                )}
            </Typography>
        </>
    )
}
export default Dashboard;