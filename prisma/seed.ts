import { PrismaClient, Equipment, MovementPattern } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  /*
   ============================================
   MUSCLE GROUPS
   ============================================
  */

  const muscleNames = [
    "Chest",
    "Back",
    "Shoulders",
    "Biceps",
    "Triceps",
    "Quads",
    "Hamstrings",
    "Glutes",
    "Calves",
    "Core",
  ];

  const muscles = await Promise.all(
    muscleNames.map((name) =>
      prisma.muscleGroup.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const muscleByName = new Map(muscles.map((m) => [m.name, m.id]));

  /*
   ============================================
   EXERCISES
   ============================================
  */

  const exercises = [
    {
      name: "Bench Press",
      equipment: Equipment.BARBELL,
      movementPattern: MovementPattern.HORIZONTAL_PUSH,
      isLowerBody: false,
      isCompound: true,
      muscles: ["Chest", "Triceps", "Shoulders"],
    },
    {
      name: "Back Squat",
      equipment: Equipment.BARBELL,
      movementPattern: MovementPattern.SQUAT,
      isLowerBody: true,
      isCompound: true,
      muscles: ["Quads", "Glutes", "Core"],
    },
    {
      name: "Deadlift",
      equipment: Equipment.BARBELL,
      movementPattern: MovementPattern.HINGE,
      isLowerBody: true,
      isCompound: true,
      muscles: ["Hamstrings", "Glutes", "Back", "Core"],
    },
    {
      name: "Overhead Press",
      equipment: Equipment.BARBELL,
      movementPattern: MovementPattern.VERTICAL_PUSH,
      isLowerBody: false,
      isCompound: true,
      muscles: ["Shoulders", "Triceps"],
    },
    {
      name: "Barbell Row",
      equipment: Equipment.BARBELL,
      movementPattern: MovementPattern.HORIZONTAL_PULL,
      isLowerBody: false,
      isCompound: true,
      muscles: ["Back", "Biceps"],
    },
    {
      name: "Pull-Up",
      equipment: Equipment.BODYWEIGHT,
      movementPattern: MovementPattern.VERTICAL_PULL,
      isLowerBody: false,
      isCompound: true,
      muscles: ["Back", "Biceps"],
    },
    {
      name: "Incline Dumbbell Press",
      equipment: Equipment.DUMBBELL,
      movementPattern: MovementPattern.HORIZONTAL_PUSH,
      isLowerBody: false,
      isCompound: true,
      muscles: ["Chest", "Shoulders", "Triceps"],
    },
    {
      name: "Lat Pulldown",
      equipment: Equipment.CABLE,
      movementPattern: MovementPattern.VERTICAL_PULL,
      isLowerBody: false,
      isCompound: true,
      muscles: ["Back", "Biceps"],
    },
    {
      name: "Romanian Deadlift",
      equipment: Equipment.BARBELL,
      movementPattern: MovementPattern.HINGE,
      isLowerBody: true,
      isCompound: true,
      muscles: ["Hamstrings", "Glutes"],
    },
    {
      name: "Leg Extension",
      equipment: Equipment.MACHINE,
      movementPattern: MovementPattern.ISOLATION,
      isLowerBody: true,
      isCompound: false,
      muscles: ["Quads"],
    },
    {
      name: "Leg Curl (Seated)",
      equipment: Equipment.MACHINE,
      movementPattern: MovementPattern.ISOLATION,
      isLowerBody: true,
      isCompound: false,
      muscles: ["Hamstrings"],
    },
    {
      name: "Calf Raise (Standing)",
      equipment: Equipment.MACHINE,
      movementPattern: MovementPattern.ISOLATION,
      isLowerBody: true,
      isCompound: false,
      muscles: ["Calves"],
    },
    {
      name: "Lateral Raise",
      equipment: Equipment.DUMBBELL,
      movementPattern: MovementPattern.ISOLATION,
      isLowerBody: false,
      isCompound: false,
      muscles: ["Shoulders"],
    },
    {
      name: "Triceps Pushdown",
      equipment: Equipment.CABLE,
      movementPattern: MovementPattern.ISOLATION,
      isLowerBody: false,
      isCompound: false,
      muscles: ["Triceps"],
    },
    {
      name: "Dumbbell Curl",
      equipment: Equipment.DUMBBELL,
      movementPattern: MovementPattern.ISOLATION,
      isLowerBody: false,
      isCompound: false,
      muscles: ["Biceps"],
    },
  ];

  for (const ex of exercises) {
    const created = await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {
        equipment: ex.equipment,
        movementPattern: ex.movementPattern,
        isLowerBody: ex.isLowerBody,
        isCompound: ex.isCompound,
        isGlobal: true,
      },
      create: {
        name: ex.name,
        equipment: ex.equipment,
        movementPattern: ex.movementPattern,
        isLowerBody: ex.isLowerBody,
        isCompound: ex.isCompound,
        isGlobal: true,
      },
    });

    await prisma.exerciseMuscleGroup.deleteMany({
      where: { exerciseId: created.id },
    });

    await prisma.exerciseMuscleGroup.createMany({
      data: ex.muscles.map((m) => ({
        exerciseId: created.id,
        muscleGroupId: muscleByName.get(m)!,
      })),
    });
  }

  /*
   ============================================
   PROGRAM: PHUL
   ============================================
  */

  const exByName = new Map(
    (await prisma.exercise.findMany()).map((e) => [e.name, e.id])
  );

let program = await prisma.program.findFirst({
  where: { name: "PHUL (4 days)" },
});

if (!program) {
  program = await prisma.program.create({
    data: {
      name: "PHUL (4 days)",
      goal: "GENERAL",
      daysPerWeek: 4,
      isGlobal: true,
    },
  });
}

  const upperPower = await prisma.programWorkout.upsert({
    where: { programId_dayNumber: { programId: program.id, dayNumber: 1 } },
    update: { title: "Upper Power" },
    create: {
      programId: program.id,
      dayNumber: 1,
      title: "Upper Power",
    },
  });

  await prisma.programWorkoutExercise.createMany({
    data: [
      {
        programWorkoutId: upperPower.id,
        sortOrder: 1,
        exerciseId: exByName.get("Bench Press")!,
        targetSets: 3,
        repRangeMin: 3,
        repRangeMax: 5,
        rpeTarget: 7,
      },
      {
        programWorkoutId: upperPower.id,
        sortOrder: 2,
        exerciseId: exByName.get("Barbell Row")!,
        targetSets: 3,
        repRangeMin: 3,
        repRangeMax: 5,
        rpeTarget: 7,
      },
    ],
  });

  console.log("🌱 Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });