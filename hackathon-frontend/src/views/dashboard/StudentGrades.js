import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import GenericTable from "../../components/GenericTable";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, List,
    ListItemText, Box, ListItemButton
} from '@mui/material';
import {
    apiGetGradesBySubjectIdByStudentId, apiAddGrade, apiDeleteGrade,
    apiUpdateGrade, apiGetGradesByStudentIdByClassId
} from "../../api/grades";
import { RIGHTS_MAPPING } from "../../utils/utilConstants";
import dayjs from "dayjs";
import { addStyleToTextField } from "../../utils/utilFunctions";
import { apiGetSubjectsByTeacherId } from "../../api/subjects";
import EditSquareIcon from '@mui/icons-material/EditSquare';
import DeleteIcon from '@mui/icons-material/Delete';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { useParams } from "react-router-dom";

const StudentGrades = ({ userRights }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [actions, setActions] = useState([]);

    const [studentId, setStudentId] = useState(null);

    const [openAddGradeDialog, setOpenAddGradeDialog] = useState(false);
    const [openEditGradeDialog, setOpenEditGradeDialog] = useState(false);
    const [openDeleteGradeDialog, setOpenDeleteGradeDialog] = useState(false);

    const rightCode = userRights[0]?.right_code;


    const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
    const [subjectSearchResults, setSubjectSearchResults] = useState([]);

    const [subjects, setSubjects] = useState([]);

    const [childrenActions, setChildrenActions] = useState([]);


    const [formData, setFormData] = useState({
        subject_id: '',
        grade: '',
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
    }

    const [className, setClassName] = useState(null);

    useEffect(() => {
        if (rightCode === RIGHTS_MAPPING.STUDENT) {
            apiGetGradesBySubjectIdByStudentId((response) => {
                setData(response.data)

            }, showErrorToast);
        } else if (rightCode === RIGHTS_MAPPING.TEACHER) {
            apiGetGradesByStudentIdByClassId((response) => {
                setData(response.data)
                console.log('response.data', response.data);
                const foundClass = response.data.find((item) => item.class_id === Number(classId));
                console.log('foundClass', foundClass);
                console.log('classId', classId);
                setClassName(foundClass.class_name)
            }, showErrorToast, classId);

            apiGetSubjectsByTeacherId((response) => {
                setSubjects(response.data);
            }, showErrorToast);

            let actionsTmp = [];

            actionsTmp = [
                { icon: (<AddBoxIcon />), color: 'black', onClick: (id) => handleFetchGrades(id) },


            ];

            setActions(actionsTmp);

            const childrenActionsTmp = [
                {
                    icon: <EditSquareIcon />,
                    onClick: (id, row) => handleEditChild(id, row),
                    color: 'black'
                },
                {
                    icon: <DeleteIcon />,
                    onClick: (id, row) => handleDeleteChild(id, row),
                    color: 'red'
                }
            ]


            setChildrenActions(childrenActionsTmp);
        }


    }, [data.length, rightCode]);





    const handleFetchGrades = (id) => {
        setStudentId(id);

        setOpenAddGradeDialog(true)

        setFormData({
            subject_id: '',
            grade: '',
        });
        setSubjectSearchTerm('');
        setSubjectSearchResults([]);
    };


    // Close the add employee dialog
    const handleCloseAddGradeDialog = () => {
        setOpenAddGradeDialog(false);

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
            if (student.grades && Array.isArray(student.grades)) {
                acc[studentId].push(
                    ...student.grades.map((grade, idx) => ({
                        id: grade.id || `${studentId}-${idx}`,
                        subject: grade.subject,
                        grade: grade.grade,
                        created_at: dayjs(grade.created_at).format('DD.MM.YYYY'),


                    }))
                );

            }
            return acc;
        }, {});
        childrenColumns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },
            { field: 'subject', headerName: 'Disciplina' },
            { field: 'grade', headerName: 'Nota' },
            { field: 'created_at', headerName: 'Data', type: 'date' },


        ];
    } else if (rightCode === RIGHTS_MAPPING.STUDENT) {
        childrenData = data.reduce((acc, student) => {
            const studentId = student.id;

            if (!acc[studentId]) {
                acc[studentId] = [];
            }
            if (student.grades && Array.isArray(student.grades)) {
                acc[studentId].push(
                    ...student.grades.map((grade, idx) => ({
                        id: grade.id || `${studentId}-${idx}`,
                        grade: grade.grade,
                        created_at: dayjs(grade.created_at).format('DD.MM.YYYY'),


                    }))
                );

            }
            return acc;
        }, {});

        childrenColumns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },
            { field: 'grade', headerName: 'Nota' },
            { field: 'created_at', headerName: 'Data', type: 'date' },


        ];
    }


    const handleSubmit = () => {

        if (openAddGradeDialog) {

            console.log('formData', formData);
            console.log('studentId', studentId);
            apiAddGrade((response) => {
                showSuccessToast(response.message);
                // setData(response.data)
            }, showErrorToast, studentId, formData.subject_id, formData.grade);
            setOpenAddGradeDialog(false);
        }

        if (openEditGradeDialog) {

            console.log('formData', formData);
            console.log('studentId', studentId);
            apiUpdateGrade((response) => {
                showSuccessToast(response.message);
                // setData(response.data)
            }, showErrorToast, gradeId, formData.grade);
            setOpenEditGradeDialog(false);
        }

        if (openDeleteGradeDialog) {
            apiDeleteGrade((response) => {
                setOpenDeleteGradeDialog(false);
                console.log('data', data);
                // const student = data.find((item) => item.id === studentId);

                // const updatedData = student?.grades.filter((item) => item.id !== gradeId);
                showSuccessToast(response.message);
                // setData(prevData => {
                //     const student = prevData.find((item) => item.id === studentId);
                //     const updatedGrades = student?.grades.filter((item) => item.id !== gradeId);
                //     return prevData.map((item) =>
                //         item.id === studentId ? { ...item, grades: updatedGrades } : item
                //     );
                // });

                apiGetGradesByStudentIdByClassId((response) => {
                    setData(response.data)
                }, showErrorToast, classId);
            }, showErrorToast, gradeId);

            setOpenDeleteGradeDialog(false);
        }


        apiGetGradesByStudentIdByClassId((response) => {
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

    const [gradeId, setGradeId] = useState(null);

    const handleEditChild = (id, row) => {
        console.log('id', id);
        console.log('row', row);

        setGradeId(id);

        setOpenEditGradeDialog(true);

    }

    const handleDeleteChild = (id, row) => {
        console.log('id', id);
        console.log('row', row);

        setGradeId(id);

        setOpenDeleteGradeDialog(true);
    }



    const handleCloseEditGradeDialog = () => {
        setOpenEditGradeDialog(false);
    }

    const handleCloseDeleteGradeDialog = () => {
        setOpenDeleteGradeDialog(false);
    }


    const handleDeleteGradeRequest = () => {

        console.log('gradeId', gradeId);
        apiDeleteGrade((response) => {
            setOpenDeleteGradeDialog(false);
            console.log('data', data);
            // const student = data.find((item) => item.id === studentId);

            // const updatedData = student?.grades.filter((item) => item.id !== gradeId);
            showSuccessToast(response.message);
            // setData(prevData => {
            //     const student = prevData.find((item) => item.id === studentId);
            //     const updatedGrades = student?.grades.filter((item) => item.id !== gradeId);
            //     return prevData.map((item) =>
            //         item.id === studentId ? { ...item, grades: updatedGrades } : item
            //     );
            // });

            apiGetGradesByStudentIdByClassId((response) => {
                setData(response.data)
            }, showErrorToast, classId);
        }, showErrorToast, gradeId);


    }



    return (
        <>
            <GenericTable
                actions={rightCode === RIGHTS_MAPPING.TEACHER && actions}
                title={`Note la clasa ${className}`}
                columns={columns}
                data={data}
                childrenColumns={childrenColumns}
                childrenData={childrenData}
                isExtendedTable={true}
                childrenActions={childrenActions}
                buttonText={rightCode === RIGHTS_MAPPING.TEACHER && "Inapoi"}
                buttonAction={() => {
                    if (rightCode === RIGHTS_MAPPING.TEACHER) {
                        navigate(-1);
                    }
                }}
            />

            {/* Add Employee Dialog */}
            <Dialog open={openAddGradeDialog} onClose={handleCloseAddGradeDialog} fullWidth maxWidth="sm">

                <DialogTitle>Adauga nota la student</DialogTitle>
                <DialogContent>


                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}  >

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
                                    mt: 1
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
                        <Button type="submit" variant="contained" sx={{ mr: 1, mb: 1, backgroundColor: '#6d071a', color: 'white' }} onClick={handleSubmit}>
                            {'Adauga nota'}
                        </Button>
                        <Button variant="contained" color="error" sx={{ mb: 1 }} onClick={() => handleCloseAddGradeDialog()}>
                            Renunta
                        </Button>
                    </Box>

                </DialogActions>

            </Dialog>


            {/* Add Employee Dialog */}
            <Dialog open={openEditGradeDialog} onClose={handleCloseEditGradeDialog} fullWidth maxWidth="sm">

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
                        <Button type="submit" variant="contained" sx={{ mr: 1, mb: 1, backgroundColor: '#6d071a', color: 'white' }} onClick={handleSubmit}>
                            {'Editeaza nota'}
                        </Button>
                        <Button variant="contained" color="error" sx={{ mb: 1 }} onClick={() => handleCloseEditGradeDialog()}>
                            Renunta
                        </Button>
                    </Box>

                </DialogActions>

            </Dialog>


            <Dialog open={openDeleteGradeDialog} onClose={handleCloseDeleteGradeDialog}>

                <DialogTitle>Sterge nota</DialogTitle>
                <DialogContent>
                    Esti sigur ca vrei sa stergi nota?
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteGradeDialog} sx={{ backgroundColor: '#6d071a', color: 'white' }}>
                        Anuleaza
                    </Button>
                    <Button onClick={handleDeleteGradeRequest} sx={{ backgroundColor: 'red', color: 'white' }}>
                        Sterge
                    </Button>
                </DialogActions>

            </Dialog>


        </>
    );
};
export default StudentGrades;