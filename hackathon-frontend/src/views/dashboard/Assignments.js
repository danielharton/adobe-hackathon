import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import GenericTable from "../../components/GenericTable";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import { apiGetAssignmentsBySubjectIdByStudentId, apiAddAssignmentSolution, apiDeleteAssignment, apiDeleteAssignmentSolution } from "../../api/assignments";
import { RIGHTS_MAPPING } from "../../utils/utilConstants";
import dayjs from "dayjs";
import { apiGetClassStudentsByTeacherId } from "../../api/classStudents";
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import AddBoxIcon from '@mui/icons-material/AddBox';

const Assignments = ({ userRights }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [actions, setActions] = useState([]);
    const rightCode = userRights[0]?.right_code;

    const [childrenActions, setChildrenActions] = useState([]);
    const [formData, setFormData] = useState({
        solution_file_path: null,
        assignment_id: null
    });
    const [openAddAssignmentDialog, setOpenAddAssignmentDialog] = useState(false);

    const [openDeleteAssignmentDialog, setOpenDeleteAssignmentDialog] = useState(false);
    let columns = [];

    if (rightCode === RIGHTS_MAPPING.TEACHER) {
        columns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },
            { field: 'class_name', headerName: 'Clasa', type: 'string' },
            {
                field: 'created_at', headerName: 'Data', type: 'date', renderCell: ({ value }) => {
                    return dayjs(value).format('DD.MM.YYYY');
                }
            },

        ];
    } else if (rightCode === RIGHTS_MAPPING.STUDENT) {
        columns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },

            { field: 'subject', headerName: 'Disciplina', type: 'string' },

            {
                field: 'Data', headerName: 'Data', type: 'date', renderCell: ({ value }) => {
                    return dayjs(value).format('DD.MM.YYYY');
                }
            },

        ];
    }



    useEffect(() => {
        if (rightCode === RIGHTS_MAPPING.STUDENT) {
            apiGetAssignmentsBySubjectIdByStudentId((response) => {
                setData(response.data)

            }, showErrorToast);
            const childrenActionsTmp = [
                {
                    icon: <AddBoxIcon />,
                    onClick: (id, row) => handleAddAssignment(id, row),
                    color: 'green'
                },
                {
                    icon: <DeleteIcon />,
                    onClick: (id, row) => handleDeleteAssignment(id, row),
                    color: 'red'
                }
            ]


            setChildrenActions(childrenActionsTmp);
        } else if (rightCode === RIGHTS_MAPPING.TEACHER) {
            apiGetClassStudentsByTeacherId((response) => {
                setData(response.data)
            }, showErrorToast);

            let actionsTmp = [];

            actionsTmp = [
                { icon: (<PeopleAltIcon />), color: 'black', onClick: (id) => navigate(`/dashboard/studentAssignments/${id}`) },


            ];

            setActions(actionsTmp);
        }


    }, [data.length, rightCode]);



    let childrenData = [];

    let childrenColumns = [];
    if (rightCode === RIGHTS_MAPPING.TEACHER) {
        childrenData = data.reduce((acc, item) => {
            const classId = item.id;

            if (!acc[classId]) {
                acc[classId] = [];
            }
            if (item.students && Array.isArray(item.students)) {
                acc[classId].push(
                    ...item.students.map((student, idx) => ({
                        id: student.id || `${classId}-${idx}`,
                        name: student.name,
                        photo: student.photo,
                        email: student.email,
                        phone: student.phone,
                        created_at: dayjs(student.created_at).format('DD.MM.YYYY'),

                    }))
                );

            }
            return acc;
        }, {});
        childrenColumns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },
            { field: 'name', headerName: 'Student' },
            { field: 'photo', headerName: 'Foto', type: 'filepath' },
            { field: 'email', headerName: 'Email' },
            { field: 'phone', headerName: 'Telefon' },
            { field: 'created_at', headerName: 'Data', type: 'date' },

        ];
    } else if (rightCode === RIGHTS_MAPPING.STUDENT) {
        childrenData = data.reduce((acc, student) => {
            const studentId = student.id;

            if (!acc[studentId]) {
                acc[studentId] = [];
            }
            if (student.assignments && Array.isArray(student.assignments)) {
                acc[studentId].push(
                    ...student.assignments.map((assignment, idx) => ({
                        id: assignment.id || `${studentId}-${idx}`,
                        subject: assignment.subject,
                        requirement_file_path: assignment.requirement_file_path,
                        solution_file_path: assignment.solution_file_path,
                        created_at: dayjs(assignment.created_at).format('DD.MM.YYYY'),


                    }))
                );

            }
            return acc;
        }, {});

        childrenColumns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },
            { field: 'subject', headerName: 'Disciplina' },
            { field: 'requirement_file_path', headerName: 'Cerinta', type: 'filepath' },
            { field: 'solution_file_path', headerName: 'Solutie', type: 'filepath' },
            { field: 'created_at', headerName: 'Data', type: 'date' },


        ];
    }


    const [assignmentId, setAssignmentId] = useState(null);


    const handleDeleteAssignment = (id, row) => {
        console.log('id', id);
        console.log('row', row);

        setAssignmentId(id);

        setOpenDeleteAssignmentDialog(true);
    }

    const handleCloseDeleteAssignmentDialog = () => {
        setOpenDeleteAssignmentDialog(false);
    }

    const handleAddAssignment = (id, row) => {
        console.log('id', id);
        console.log('row', row);

        setFormData({
            solution_file_path: null,
            assignment_id: id
        });

        setAssignmentId(id);
        setOpenAddAssignmentDialog(true);
    }


    const handleSubmit = () => {

        console.log('formData', formData.solution_file_path);
        console.log('assignmentId', assignmentId);

        if (openAddAssignmentDialog) {


            apiAddAssignmentSolution((response) => {
                showSuccessToast(response.message);
                // setData(response.data)

                apiGetAssignmentsBySubjectIdByStudentId((response) => {
                    setData(response.data)
                }, showErrorToast);
            }, showErrorToast, { assignment_id: assignmentId, solution_file_path: formData.solution_file_path });
            setOpenAddAssignmentDialog(false);
        }


        if (openDeleteAssignmentDialog) {
            apiDeleteAssignmentSolution((response) => {
                setOpenDeleteAssignmentDialog(false);
                console.log('data', data);

                showSuccessToast(response.message);


                apiGetAssignmentsBySubjectIdByStudentId((response) => {
                    setData(response.data)
                }, showErrorToast);
            }, showErrorToast, assignmentId);

            setOpenDeleteAssignmentDialog(false);
        }


        apiGetAssignmentsBySubjectIdByStudentId((response) => {
            setData(response.data)
        }, showErrorToast);


    }

    const handleCloseAddAssignmentDialog = () => {
        setOpenAddAssignmentDialog(false);
        setFormData({
            solution_file_path: null,
            assignment_id: null
        });
    }

    return (
        <>
            <GenericTable
                actions={rightCode === RIGHTS_MAPPING.TEACHER && actions}
                title={"Teme"}
                columns={columns}
                data={data}
                childrenColumns={childrenColumns}
                childrenData={childrenData}
                isExtendedTable={true}
                childrenActions={childrenActions}
            />


            {/* Add Employee Dialog */}
            <Dialog open={openAddAssignmentDialog} onClose={handleCloseAddAssignmentDialog} fullWidth maxWidth="sm">
                {/* <form onSubmit={handleSubmit}> */}
                <DialogTitle>Adauga solutie</DialogTitle>
                <DialogContent>


                    {/* File upload button */}
                    <Button
                        variant="outlined"
                        component="label"
                        sx={{ mb: 2, mt: 2 }}
                    >
                        Încarcă fișier
                        <input
                            type="file"
                            hidden
                            name="file"
                            onChange={e => setFormData({ ...formData, solution_file_path: e.target.files[0] })}
                        />
                    </Button>
                    {/* Show selected file name */}
                    {formData.solution_file_path && (
                        <div style={{ marginBottom: 8 }}>
                            Fișier selectat: {formData.solution_file_path.name}
                        </div>
                    )}

                </DialogContent>

                <DialogActions>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                        <Button variant="contained" sx={{ mr: 1, mb: 1, backgroundColor: '#6d071a', color: 'white' }} onClick={handleSubmit}>
                            {'Adauga solutie'}
                        </Button>
                        <Button variant="contained" color="error" sx={{ mb: 1 }} onClick={() => handleCloseAddAssignmentDialog()}>
                            Renunta
                        </Button>
                    </Box>

                </DialogActions>
                {/* </form> */}
            </Dialog>


            <Dialog open={openDeleteAssignmentDialog} onClose={handleCloseDeleteAssignmentDialog}>

                <DialogTitle>Sterge solutia</DialogTitle>
                <DialogContent>
                    Esti sigur ca vrei sa stergi solutia?
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteAssignmentDialog} sx={{ backgroundColor: '#6d071a', color: 'white' }} >
                        Anuleaza
                    </Button>
                    <Button sx={{ backgroundColor: 'red', color: 'white' }} onClick={handleSubmit}>
                        Sterge
                    </Button>
                </DialogActions>

            </Dialog>

        </>
    );
};
export default Assignments;