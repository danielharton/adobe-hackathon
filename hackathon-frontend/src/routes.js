import Login from "./views/Login.js";
import Dashboard from "./views/dashboard/Index.js";
import AddEditSubject from "./views/dashboard/AddEditSubjects.js";
import Subjects from "./views/dashboard/Subjects.js";
import ClassStudents from "./views/dashboard/ClassStudents.js";
import AddEditClass from "./views/dashboard/AddEditClass.js";
import Grades from "./views/dashboard/Grades.js";
import Assignments from "./views/dashboard/Assignments.js";
import Users from "./views/dashboard/Users.js";
import AddUser from "./views/dashboard/AddUser.js";
import ClassTeachers from "./views/dashboard/ClassTeachers.js";
import StudentGrades from "./views/dashboard/StudentGrades.js";
import StudentAssignments from "./views/dashboard/StudentAssignments.js";
var routes = [
    {
        path: "/login",
        name: "Login",
        icon: "ni ni-key-25 text-info",
        component: <Login />,
        layout: "/auth",
    },

    {
        path: "/index",
        name: "Dashboard",
        icon: "ni ni-tv-2 text-primary",
        component: Dashboard,
        layout: "/dashboard",
    },
    {
        path: "/addEditSubject/:subjectId",
        name: "AddEditSubject",
        component: AddEditSubject,
        layout: "/dashboard",
    },
    {
        path: "/subjects",
        name: "Subjects",
        component: Subjects,
        layout: "/dashboard",
    },
    {
        path: "/classStudents",
        name: "ClassStudents",
        component: ClassStudents,
        layout: "/dashboard",
    },
    {
        path: "/addEditClass/:classId",
        name: "AddEditClass",
        component: AddEditClass,
        layout: "/dashboard",
    },
    {
        path: "/grades",
        name: "Grades",
        component: Grades,
        layout: "/dashboard",
    },
    {
        path: "/assignments",
        name: "Assignments",
        component: Assignments,
        layout: "/dashboard",
    },
    {
        path: "/users",
        name: "Users",
        component: Users,
        layout: "/dashboard",
    },
    {
        path: "/addUser",
        name: "AddUser",
        component: AddUser,
        layout: "/dashboard",
    },
    {
        path: "/classTeachers",
        name: "ClassTeachers",
        component: ClassTeachers,
        layout: "/dashboard",
    },
    {
        path: "/studentGrades/:classId",
        name: "StudentGrades",
        component: StudentGrades,
        layout: "/dashboard",
    },
    {
        path: "/studentAssignments/:classId",
        name: "StudentAssignments",
        component: StudentAssignments,
        layout: "/dashboard",
    },


]

export default routes;  