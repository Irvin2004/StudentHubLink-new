export async function getDashboard(userId) {
    void userId;

    return {
        greeting: {
            name: "Amogelang",
            message: "Ready to continue learning?"
        },
        studyStreak: {
            current: 12,
            longest: 25,
            progress: 80
        },
        focusTask: {
            id: "robotics-assignment",
            title: "Finish Robotics Assignment",
            subject: "Robotics",
            due: "Tomorrow",
            estimatedTime: "45 min",
            priority: "high",
            progress: 60
        },
        stats: {
            communities: 8,
            resources: 42,
            messages: 12,
            assignments: 3
        },
        continueLearning: [
            {
                id: "robotics-1",
                title: "Robotics Fundamentals",
                subject: "Robotics",
                progress: 65,
                lastOpened: "2 hours ago"
            },
            {
                id: "python-1",
                title: "Python Programming",
                subject: "Programming",
                progress: 40,
                lastOpened: "Yesterday"
            },
            {
                id: "database-1",
                title: "Database Systems",
                subject: "Database",
                progress: 90,
                lastOpened: "3 days ago"
            }
        ],
        activity: [
            {
                id: "1",
                type: "upload",
                title: "Uploaded Robotics Notes",
                time: "2 hours ago"
            },
            {
                id: "2",
                type: "community",
                title: "Joined Programming Community",
                time: "Yesterday"
            },
            {
                id: "3",
                type: "completed",
                title: "Completed Python Quiz",
                time: "2 days ago"
            }
        ],
        deadlines: [
            {
                id: "python-project",
                title: "Python Project",
                subject: "Programming",
                due: "Tomorrow",
                priority: "high"
            },
            {
                id: "robotics-ipo",
                title: "Robotics Practical",
                subject: "Robotics",
                due: "Friday",
                priority: "medium"
            },
            {
                id: "database-assignment",
                title: "Database Assignment",
                subject: "Database",
                due: "Next Monday",
                priority: "low"
            }
        ],
        quickActions: [
            {
                id: "join-community",
                title: "Join Community",
                description: "Find a class group"
            },
            {
                id: "upload-resource",
                title: "Upload Resource",
                description: "Share notes or files"
            },
            {
                id: "message-classmate",
                title: "Message Classmate",
                description: "Start a quick conversation"
            },
            {
                id: "plan-study-session",
                title: "Plan Study Session",
                description: "Set a focused block"
            }
        ],
        aiSuggestions: [
            {
                id: "summarise-notes",
                title: "Summarise Notes",
                description: "Turn your latest upload into key points."
            },
            {
                id: "generate-quiz",
                title: "Generate Quiz",
                description: "Check your understanding with practice questions."
            },
            {
                id: "generate-flashcards",
                title: "Generate Flashcards",
                description: "Build a quick review set from your material."
            },
            {
                id: "ask-ai",
                title: "Ask AI",
                description: "Get help with a course question."
            }
        ]
    };
}
