const studyTasks = [
    {
        id: "programming-assignment",
        title: "Programming Assignment",
        subject: "Programming",
        dueGroup: "today",
        dueLabel: "Today",
        estimatedTime: "90 min",
        priority: "High",
        completed: false
    },
    {
        id: "robotics-revision",
        title: "Robotics Revision",
        subject: "Robotics",
        dueGroup: "today",
        dueLabel: "Today",
        estimatedTime: "45 min",
        priority: "Medium",
        completed: false
    },
    {
        id: "database-project",
        title: "Database Project",
        subject: "Database",
        dueGroup: "tomorrow",
        dueLabel: "Tomorrow",
        estimatedTime: "60 min",
        priority: "High",
        completed: false
    },
    {
        id: "python-quiz-review",
        title: "Python Quiz Review",
        subject: "Programming",
        dueGroup: "week",
        dueLabel: "This Week",
        estimatedTime: "30 min",
        priority: "Low",
        completed: true
    },
    {
        id: "database-reading",
        title: "Database Reading",
        subject: "Database",
        dueGroup: "week",
        dueLabel: "This Week",
        estimatedTime: "45 min",
        priority: "Medium",
        completed: true
    },
    {
        id: "robotics-practice",
        title: "Robotics Practice",
        subject: "Robotics",
        dueGroup: "week",
        dueLabel: "This Week",
        estimatedTime: "30 min",
        priority: "Low",
        completed: true
    }
];

export async function getStudyPlanner() {
    return {
        tasks: studyTasks
    };
}
