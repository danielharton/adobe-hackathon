import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import GenericTable from "../../components/GenericTable";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import { apiGetGradesBySubjectIdByStudentId } from "../../api/grades";
import { RIGHTS_MAPPING } from "../../utils/utilConstants";
import dayjs from "dayjs";
import { apiGetClassStudentsByTeacherId } from "../../api/classStudents";
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

const Grades = ({ userRights }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [actions, setActions] = useState([]);
    const rightCode = userRights[0]?.right_code;


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
            apiGetGradesBySubjectIdByStudentId((response) => {
                setData(response.data)

            }, showErrorToast);
        } else if (rightCode === RIGHTS_MAPPING.TEACHER) {
            apiGetClassStudentsByTeacherId((response) => {
                setData(response.data)
            }, showErrorToast);

            let actionsTmp = [];

            actionsTmp = [
                { icon: (<PeopleAltIcon />), color: 'black', onClick: (id) => navigate(`/dashboard/studentGrades/${id}`) },


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


    return (
        <>
            <GenericTable
                actions={rightCode === RIGHTS_MAPPING.TEACHER && actions}
                title={"Note"}
                columns={columns}
                data={data}
                childrenColumns={childrenColumns}
                childrenData={childrenData}
                isExtendedTable={true}
            />

        </>
    );
};
export default Grades;