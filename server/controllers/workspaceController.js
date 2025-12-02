import prisma from "../configs/prisma.js";
import { clerkClient } from '@clerk/clerk-sdk-node';

// Get all workspaces for user
export const getUserWorkspaces = async (req, res) => {
    try {
        const { userId } = await req.auth();
        console.log("Fetching workspaces for user:", userId);

        // --- Lazy Sync Start ---
        // 1. Sync User (using upsert to prevent race conditions)
        const clerkUser = await clerkClient.users.getUser(userId);
        await prisma.user.upsert({
            where: { id: userId },
            update: {
                email: clerkUser.emailAddresses[0].emailAddress,
                name: `${clerkUser.firstName} ${clerkUser.lastName}`,
                image: clerkUser.imageUrl,
            },
            create: {
                id: userId,
                email: clerkUser.emailAddresses[0].emailAddress,
                name: `${clerkUser.firstName} ${clerkUser.lastName}`,
                image: clerkUser.imageUrl,
            }
        });
        console.log("User synced.");

        // 2. Sync Workspaces
        console.log("Syncing workspaces from Clerk...");
        const response = await clerkClient.users.getOrganizationMembershipList({ userId });
        const memberships = Array.isArray(response) ? response : response.data;
        console.log("Found memberships:", memberships?.length);
        
        if (memberships) {
            for (const membership of memberships) {
                const orgId = membership.organization.id;
                
                // Upsert workspace to prevent race conditions
                await prisma.workspace.upsert({
                    where: { id: orgId },
                    update: {
                        name: membership.organization.name,
                        slug: membership.organization.slug,
                        image_url: membership.organization.imageUrl,
                    },
                    create: {
                        id: orgId,
                        name: membership.organization.name,
                        slug: membership.organization.slug,
                        image_url: membership.organization.imageUrl,
                        ownerId: membership.organization.createdBy,
                    }
                });

                // Upsert membership to prevent race conditions
                await prisma.workspaceMember.upsert({
                    where: {
                        userId_workspaceId: {
                            userId: userId,
                            workspaceId: orgId
                        }
                    },
                    update: {
                        role: membership.role.split(':')[1].toUpperCase() // org:admin -> ADMIN
                    },
                    create: {
                        userId: userId,
                        workspaceId: orgId,
                        role: membership.role.split(':')[1].toUpperCase() // org:admin -> ADMIN
                    }
                });
            }
        }
        // --- Lazy Sync End ---

        const workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId: userId } }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });
        res.json({ workspaces });
    } catch (error) {
        console.log("Error in getUserWorkspaces:", error);
        res.status(500).json({ message: error.code || error.message });
    }
};