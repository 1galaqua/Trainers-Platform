import { prisma } from "@/lib/prisma";

export async function archiveQuestionnaireIfExists(traineeId: string) {
  const existing = await prisma.questionnaireResponse.findUnique({
    where: { traineeId },
  });
  if (!existing) return;

  await prisma.questionnaireSubmission.create({
    data: {
      traineeId,
      answers: existing.answers ?? undefined,
      age: existing.age,
      heightCm: existing.heightCm,
      weightKg: existing.weightKg,
      goal: existing.goal,
      experience: existing.experience,
      injuries: existing.injuries,
      sessionsPerWeek: existing.sessionsPerWeek,
      equipment: existing.equipment,
      completedAt: existing.completedAt,
    },
  });
}

export async function archiveAgreementIfExists(traineeId: string) {
  const existing = await prisma.agreement.findUnique({
    where: { traineeId },
  });
  if (!existing) return;

  await prisma.agreementSubmission.create({
    data: {
      traineeId,
      agreedAt: existing.agreedAt,
      ipAddress: existing.ipAddress,
      signatureUrl: existing.signatureUrl,
      agreementTextSnapshot: existing.agreementTextSnapshot,
      contentVersion: existing.contentVersion,
    },
  });
}
