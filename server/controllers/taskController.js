import prisma from "../configs/prisma.js";

// Create task
export const createTask = async (req, res) => {
    try {

        const { userId } = await req.auth();
        const { projectId, title, description, type, status, priority, assigneeId, due_date } = req.body;
        const origin = req.get('origin');

        // Check if user has admin role for project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" });
        }
        else if (assigneeId && !project.members.find((member) => member.user.id === assigneeId)) {
            return res.status(403).json({ message: "assignee is not a member of the project / workspace" });
        }

        // Lazy Sync Assignee
        if (assigneeId) {
            const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
            if (!assignee) {
                console.log("Assignee not found locally, syncing from Clerk...");
                const { clerkClient } = await import('@clerk/clerk-sdk-node');
                const clerkUser = await clerkClient.users.getUser(assigneeId);
                await prisma.user.create({
                    data: {
                        id: assigneeId,
                        email: clerkUser.emailAddresses[0].emailAddress,
                        name: `${clerkUser.firstName} ${clerkUser.lastName}`,
                        image: clerkUser.imageUrl,
                    }
                });
                console.log("Assignee synced.");
            }
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                type,
                priority,
                assigneeId,
                status,
                due_date: new Date(due_date),
            }
        });

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true, project: true },
        });

        // Send email directly if task has an assignee
        if (taskWithAssignee.assignee) {
            try {
                console.log("Sending email to:", taskWithAssignee.assignee.email);
                
                const { default: sendEmail } = await import("../configs/nodemailer.js");
                
                await sendEmail({
                    to: taskWithAssignee.assignee.email,
                    subject: `New Task Assignment in ${taskWithAssignee.project.name}`,
                    body: `
                        <div style="max-width: 600px;">
                        <h2>Hi ${taskWithAssignee.assignee.name}, 👋</h2>
                        
                        <p style="font-size: 16px;">You've been assigned a new task:</p>
                        <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">${taskWithAssignee.title}</p>
                        
                        <div style="border: 1px solid #ddd; padding: 12px 16px; border-radius: 6px; margin-bottom: 30px;">
                            <p style="margin: 6px 0;"><strong>Description:</strong> ${taskWithAssignee.description}</p>
                            <p style="margin: 6px 0;"><strong>Due Date:</strong> ${new Date(taskWithAssignee.due_date).toLocaleDateString()}</p>
                            <p style="margin: 6px 0;"><strong>Priority:</strong> ${taskWithAssignee.priority}</p>
                            <p style="margin: 6px 0;"><strong>Status:</strong> ${taskWithAssignee.status}</p>
                        </div>
                        
                        <a href="${origin}" style="background-color: #007bff; padding: 12px 24px; border-radius: 5px; color: #fff; font-weight: 600; font-size: 16px; text-decoration: none;">
                            View Task
                        </a>

                        <p style="margin-top: 20px; font-size: 14px; color: #6c757d;">
                            Please make sure to review and complete it before the due date.
                        </p>
                        </div>
                    `,
                });
                
                console.log("Email sent successfully to:", taskWithAssignee.assignee.email);
            } catch (emailError) {
                console.error("Error sending email (non-fatal):", emailError.message);
                // Don't fail the request if email fails
            }
        } else {
            console.log("Task has no assignee, skipping email notification");
        }

        res.json({ task: taskWithAssignee, message: "Task created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};


// Update task
export const updateTask = async (req, res) => {
    try {

        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const { userId } = await req.auth();

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" });
        }

        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: req.body,
        });

        res.json({ message: "Task updated successfully", task: updatedTask });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete task
export const deleteTask = async (req, res) => {
    try {

        const { userId } = await req.auth();
        const { tasksIds } = req.body;

        const tasks = await prisma.task.findMany({
            where: { id: { in: tasksIds } },
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" });
        }

        await prisma.task.deleteMany({
            where: { id: { in: tasksIds } },
        });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};