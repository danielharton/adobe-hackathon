
import { RIGHTS_MAPPING } from './utilConstants';
import SchoolIcon from '@mui/icons-material/School';
import GradingIcon from '@mui/icons-material/Grading';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import TitleIcon from '@mui/icons-material/Title';
import PersonIcon from '@mui/icons-material/Person';

export const menus = [

    {
        id: 1,
        parentId: null,
        name: "Clase",
        to: "/dashboard/classStudents",
        icon: SchoolIcon,
        isCategory: false,
        excludelocationsType: [],
        rights: [RIGHTS_MAPPING.TEACHER],
        order: 90,
        children: [

        ]
    },

    {
        id: 2,
        parentId: null,
        name: "Note",
        to: "/dashboard/grades",
        icon: GradingIcon,
        isCategory: false,
        excludelocationsType: [],
        rights: [RIGHTS_MAPPING.TEACHER, RIGHTS_MAPPING.STUDENT],
        order: 90,
        children: [

        ]
    },
    {
        id: 3,
        parentId: null,
        name: "Assignments",
        to: "/dashboard/assignments",
        icon: AssignmentIcon,
        isCategory: false,
        excludelocationsType: [],
        rights: [RIGHTS_MAPPING.TEACHER, RIGHTS_MAPPING.STUDENT],
        order: 90,
        children: [

        ]
    },
    // {
    //     id: 4,
    //     parentId: null,
    //     name: "Absente",
    //     to: "/dashboard/absences",
    //     icon: PersonRemoveIcon,
    //     isCategory: false,
    //     excludelocationsType: [],
    //     rights: [RIGHTS_MAPPING.TEACHER, RIGHTS_MAPPING.STUDENT],
    //     order: 90,
    //     children: [

    //     ]
    // },

    {
        id: 5,
        parentId: null,
        name: "Clase",
        to: "/dashboard/classStudents",
        icon: SchoolIcon,
        isCategory: true,
        excludelocationsType: [],
        rights: [RIGHTS_MAPPING.ADMIN],
        order: 90,
        children: [
            {
                id: 501,
                parentId: 5,
                name: "Profesori",
                to: "/dashboard/classTeachers",
                icon: PersonIcon,
                isCategory: false,
                excludelocationsType: [],
                rights: [RIGHTS_MAPPING.ADMIN],
                order: 90,
            },
            {
                id: 502,
                parentId: 5,
                name: "Studenti",
                to: "/dashboard/classStudents",
                icon: PersonIcon,
                isCategory: false,
                excludelocationsType: [],
                rights: [RIGHTS_MAPPING.ADMIN],
                order: 90,
            }
        ]
    },
    {
        id: 6,
        parentId: null,
        name: "Discipline",
        to: "/dashboard/subjects",
        icon: TitleIcon,
        isCategory: false,
        excludelocationsType: [],
        rights: [RIGHTS_MAPPING.ADMIN],
        order: 90,
        children: [

        ]
    },
    {
        id: 7,
        parentId: null,
        name: "Utilizatori",
        to: "/dashboard/users",
        icon: PersonIcon,
        isCategory: false,
        excludelocationsType: [],
        rights: [RIGHTS_MAPPING.ADMIN],
        order: 90,
        children: [

        ]
    },


]
