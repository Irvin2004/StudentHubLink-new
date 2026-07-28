export async function getDashboard(userId) {
    void userId;

    return {
        greeting: {
            name: "Amogelang",
            message: "Ready to continue learning?"
        },
        stats: {
            communities: 8,
            resources: 45,
            messages: 18,
            assignments: 3
        },
        continueLearning: [
            {
                id: "robotics-level-2",
                title: "Robotics Level 2",
                subtitle: "Weekly build session",
                progress: 78
            },
            {
                id: "programming-fundamentals",
                title: "Programming Fundamentals",
                subtitle: "Revision and exercises",
                progress: 64
            },
            {
                id: "database-systems",
                title: "Database Systems",
                subtitle: "Schema practice",
                progress: 41
            }
        ],
        activity: [
            {
                id: "uploaded-robotics-notes",
                title: "Uploaded Robotics Notes",
                description:
                    "Shared the latest workshop summary with your community.",
                time: "2h ago"
            },
            {
                id: "joined-community",
                title: "Joined Programming Community",
                description:
                    "You became part of the intro cohort discussion space.",
                time: "Yesterday"
            },
            {
                id: "top-contributor",
                title: "Received Top Contributor Badge",
                description: "Your help in the study chat was appreciated.",
                time: "This week"
            }
        ],
        deadlines: [
            {
                id: "python-project",
                title: "Python Project",
                due: "Tomorrow",
                note: "Submit the final draft and code review notes."
            },
            {
                id: "robotics-ipo",
                title: "Robotics IPO",
                due: "Friday",
                note: "Prepare the input-process-output breakdown."
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
