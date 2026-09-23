import { prisma } from "../../db/prisma.js";

/** Removes the user and records created for one isolated integration test. */
export async function cleanUpTestUser(userId: string): Promise<void> {
    const [user, friends] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { personId: true },
        }),
        prisma.friend.findMany({
            where: { ownerUserId: userId },
            select: { id: true, targetPersonId: true },
        }),
    ]);

    const friendIds = friends.map((friend) => friend.id);
    const personIds = new Set(
        friends.map((friend) => friend.targetPersonId),
    );

    if (user?.personId) {
        personIds.add(user.personId);
    }

    if (friendIds.length > 0) {
        const submissions = await prisma.knowledgeIntakeSubmission.findMany({
            where: { friendId: { in: friendIds } },
            select: {
                id: true,
                targetPersonId: true,
                submittedByPersonId: true,
            },
        });

        for (const submission of submissions) {
            personIds.add(submission.targetPersonId);
            if (submission.submittedByPersonId) {
                personIds.add(submission.submittedByPersonId);
            }
        }

        await prisma.personFact.deleteMany({
            where: {
                OR: [
                    { targetPersonId: { in: [...personIds] } },
                    { authorPersonId: { in: [...personIds] } },
                ],
            },
        });
        await prisma.knowledgeIntakeAnswer.deleteMany({
            where: { submissionId: { in: submissions.map(({ id }) => id) } },
        });
        await prisma.knowledgeIntakeSubmission.deleteMany({
            where: { friendId: { in: friendIds } },
        });
        await prisma.searchableDocument.deleteMany({
            where: { friendId: { in: friendIds } },
        });
        await prisma.assessment.deleteMany({
            where: { event: { friendId: { in: friendIds } } },
        });
        await prisma.event.deleteMany({
            where: { friendId: { in: friendIds } },
        });
        await prisma.rule.deleteMany({
            where: { friendId: { in: friendIds } },
        });
        await prisma.friend.deleteMany({
            where: { id: { in: friendIds } },
        });
    }

    await prisma.user.deleteMany({ where: { id: userId } });

    if (personIds.size > 0) {
        await prisma.person.deleteMany({
            where: { id: { in: [...personIds] } },
        });
    }
}
