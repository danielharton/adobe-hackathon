import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import GenericTable from "../../components/GenericTable";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, List,
    ListItemText, Box, ListItemButton
} from '@mui/material';
import { apiGetAssignmentsBySubjectIdByStudentId, apiGetAssignmentsByStudentIdByClassId, apiAddAssignment, apiDeleteAssignment } from "../../api/assignments";
import { RIGHTS_MAPPING } from "../../utils/utilConstants";
import dayjs from "dayjs";
import { addStyleToTextField } from "../../utils/utilFunctions";
import { apiGetSubjectsByTeacherId } from "../../api/subjects";
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams } from "react-router-dom";
import FileUploadIcon from '@mui/icons-material/FileUpload';

const StudentAssignments = ({ userRights }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [actions, setActions] = useState([]);

    const [openAddAssignmentDialog, setOpenAddAssignmentDialog] = useState(false);
    const [openDeleteAssignmentDialog, setOpenDeleteAssignmentDialog] = useState(false);

    const rightCode = userRights[0]?.right_code;

    const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
    const [subjectSearchResults, setSubjectSearchResults] = useState([]);

    const [subjects, setSubjects] = useState([]);

    const [childrenActions, setChildrenActions] = useState([]);


    const [formData, setFormData] = useState({
        subject_id: '',
        requirement_file_path: '',
        assignment: ''
    });

    const { classId } = useParams();

    let columns = [];

    if (rightCode === RIGHTS_MAPPING.TEACHER) {
        columns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },
            { field: 'name', headerName: 'Nume', type: 'string' },
            { field: 'photo', headerName: 'Foto', type: 'filepath' },
            { field: 'email', headerName: 'Email', type: 'string' },
            { field: 'phone', headerName: 'Telefon', type: 'string' },

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
        } else if (rightCode === RIGHTS_MAPPING.TEACHER) {
            apiGetAssignmentsByStudentIdByClassId((response) => {
                setData(response.data)
            }, showErrorToast, classId);

            apiGetSubjectsByTeacherId((response) => {
                setSubjects(response.data);
            }, showErrorToast);

            const childrenActionsTmp = [

                {
                    icon: <DeleteIcon />,
                    onClick: (id, row) => handleDeleteChild(id, row),
                    color: 'red'
                }
            ]

            setChildrenActions(childrenActionsTmp);
        }

    }, [data.length, rightCode]);



    // Close the add employee dialog
    const handleCloseAddAssignmentDialog = () => {
        setOpenAddAssignmentDialog(false);

        // apiGetGradesByStudentId((response) => {
        //     setData(response.data)
        // }, showErrorToast);

    };

    let childrenData = [];

    let childrenColumns = [];
    if (rightCode === RIGHTS_MAPPING.TEACHER) {
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
                        assignment: assignment.assignment

                    }))
                );

            }
            return acc;
        }, {});
        childrenColumns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },
            { field: 'subject', headerName: 'Disciplina' },
            { field: 'assignment', headerName: 'Tema', type: 'string' },
            { field: 'requirement_file_path', headerName: 'Cerinta', type: 'filepath' },
            { field: 'solution_file_path', headerName: 'Solutie', type: 'filepath' },
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
                        requirement_file_path: assignment.requirement_file_path,
                        solution_file_path: assignment.solution_file_path,
                        created_at: dayjs(assignment.created_at).format('DD.MM.YYYY'),
                        assignment: assignment.assignment

                    }))
                );

            }
            return acc;
        }, {});

        childrenColumns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },
            { field: 'assignment', headerName: 'Tema', type: 'string' },
            { field: 'requirement_file_path', headerName: 'Cerinta', type: 'filepath' },
            { field: 'solution_file_path', headerName: 'Solutie', type: 'filepath' },
            { field: 'created_at', headerName: 'Data', type: 'date' },


        ];
    }


    const handleSubmit = () => {

        if (openAddAssignmentDialog) {

            apiAddAssignment((response) => {
                showSuccessToast(response.message);
                // setData(response.data)

                apiGetAssignmentsByStudentIdByClassId((response) => {
                    setData(response.data)
                }, showErrorToast, classId);
            }, showErrorToast, { class_id: classId, subject_id: formData.subject_id, requirement_file_path: formData.requirement_file_path, assignment: formData.assignment });
            setOpenAddAssignmentDialog(false);
        }


        if (openDeleteAssignmentDialog) {
            apiDeleteAssignment((response) => {
                setOpenDeleteAssignmentDialog(false);
                console.log('data', data);

                showSuccessToast(response.message);

                apiGetAssignmentsByStudentIdByClassId((response) => {
                    setData(response.data)
                }, showErrorToast, classId);
            }, showErrorToast, assignmentId);

            setOpenDeleteAssignmentDialog(false);
        }


        apiGetAssignmentsByStudentIdByClassId((response) => {
            setData(response.data)
        }, showErrorToast, classId);

    }

    const handleSubjectSearchChange = (event) => {
        const value = event.target.value;
        setSubjectSearchTerm(value);

        console.log('subjects', subjects);

        if (value.trim()) {
            const searchTermLower = value.trim().toLowerCase();
            const filtered = subjects.filter(subject => {

                if (subject && subject.subject) {
                    return subject.subject.toLowerCase().includes(searchTermLower);
                }
                return false;
            });
            setSubjectSearchResults(filtered);
        } else {
            setSubjectSearchResults([]);
        }
    };

    const handleAddSubject = (subject) => {

        setSubjectSearchTerm(subject.subject);
        setSubjectSearchResults([]);

        formData.subject_id = subject.id;

        setSubjectSearchResults([]);

    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const [assignmentId, setAssignmentId] = useState(null);


    const handleDeleteChild = (id, row) => {
        console.log('id', id);
        console.log('row', row);

        setAssignmentId(id);

        setOpenDeleteAssignmentDialog(true);
    }

    const handleCloseDeleteAssignmentDialog = () => {
        setOpenDeleteAssignmentDialog(false);
    }


    return (
        <>
            <GenericTable
                actions={rightCode === RIGHTS_MAPPING.TEACHER && actions}
                title={`Teme la clasa ${classId}`}
                columns={columns}
                data={data}
                childrenColumns={childrenColumns}
                childrenData={childrenData}
                isExtendedTable={true}
                childrenActions={childrenActions}
                buttonText={rightCode === RIGHTS_MAPPING.TEACHER && "Adauga tema"}
                buttonAction={() => {
                    if (rightCode === RIGHTS_MAPPING.TEACHER) {
                        setOpenAddAssignmentDialog(true);
                    }
                }}
                secondButtonText={rightCode === RIGHTS_MAPPING.TEACHER && "Inapoi"}
                secondButtonAction={() => {
                    if (rightCode === RIGHTS_MAPPING.TEACHER) {
                        navigate(-1);
                    }
                }}
                uploadIcon={<FileUploadIcon />}
            />

            {/* Add Employee Dialog */}
            <Dialog open={openAddAssignmentDialog} onClose={handleCloseAddAssignmentDialog} fullWidth maxWidth="sm">
                {/* <form onSubmit={handleSubmit}> */}
                <DialogTitle>Adauga tema la student</DialogTitle>
                <DialogContent>


                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <TextField
                            label="Cauta disciplina"
                            variant="outlined"
                            fullWidth
                            value={subjectSearchTerm}
                            onChange={handleSubjectSearchChange}
                            sx={{ ...addStyleToTextField(subjectSearchTerm), mt: 1 }}

                        />


                        {subjectSearchResults.length > 0 && (
                            <List sx={{
                                position: 'absolute',
                                width: '100%',
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                borderRadius: '8px',
                                zIndex: 1300,
                                mt: 1,

                            }}>
                                {subjectSearchResults.map((subject) => (
                                    <ListItemButton
                                        key={subject.id}
                                        onClick={() => handleAddSubject(subject)}
                                    >
                                        <ListItemText
                                            primary={subject.subject}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        )}
                    </Box>
                    <Box sx={{ position: 'relative', width: '100%' }}>

                        <TextField
                            label="Tema"
                            name="assignment"
                            type='text'
                            value={formData.assignment || ''}
                            fullWidth
                            onChange={handleChange}
                            sx={{ ...addStyleToTextField(formData.assignment), mt: 2 }}
                        >
                        </TextField>
                    </Box>


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
                            onChange={e => setFormData({ ...formData, requirement_file_path: e.target.files[0] })}
                        />
                    </Button>
                    {/* Show selected file name */}
                    {formData.requirement_file_path && (
                        <div style={{ marginBottom: 8 }}>
                            Fișier selectat: {formData.requirement_file_path.name}
                        </div>
                    )}




                </DialogContent>

                <DialogActions>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                        <Button variant="contained" sx={{ mr: 1, mb: 1, backgroundColor: '#6d071a', color: 'white' }} onClick={handleSubmit}>
                            {'Adauga tema'}
                        </Button>
                        <Button variant="contained" color="error" sx={{ mb: 1 }} onClick={() => handleCloseAddAssignmentDialog()}>
                            Renunta
                        </Button>
                    </Box>

                </DialogActions>
                {/* </form> */}
            </Dialog>


            {/* Add Employee Dialog */}
            {/* <Dialog open={openEditAssignmentDialog} onClose={handleCloseEditAssignmentDialog} fullWidth maxWidth="sm">
                <form onSubmit={handleSubmit}>
                    <DialogTitle>Editeaza nota la student</DialogTitle>
                    <DialogContent>


                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}  >

                            <TextField
                                label="Nota"
                                name="grade"
                                type='number'
                                value={formData.grade || ''}
                                fullWidth
                                margin="normal"
                                onChange={handleChange}
                                sx={addStyleToTextField(formData.grade)}
                            >
                            </TextField>

                        </Box>

                    </DialogContent>

                    <DialogActions>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                            <Button type="submit" variant="contained" sx={{ mr: 1, mb: 1, backgroundColor: 'rgb(235, 71, 17)', color: 'white' }}>
                                {'Editeaza nota'}
                            </Button>
                            <Button variant="contained" color="error" sx={{ mb: 1 }} onClick={() => handleCloseEditAssignmentDialog()}>
                                Renunta
                            </Button>
                        </Box>

                    </DialogActions>
                </form>
            </Dialog> */}


            <Dialog open={openDeleteAssignmentDialog} onClose={handleCloseDeleteAssignmentDialog}>

                <DialogTitle>Sterge tema</DialogTitle>
                <DialogContent>
                    Esti sigur ca vrei sa stergi tema?
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
export default StudentAssignments;