const { PrismaClient, Equipment, MovementPattern } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding started...");

  // =========================
  // MUSCLE GROUPS
  // =========================
  const muscleNames = ["Chest","Back","Shoulders","Biceps","Triceps","Quads","Hamstrings","Glutes","Calves","Core","Forearms","Traps"];
  const muscles = await Promise.all(muscleNames.map((name) => prisma.muscleGroup.upsert({ where: { name }, update: {}, create: { name } })));
  const mg = new Map(muscles.map((m) => [m.name, m.id]));

  // =========================
  // EXERCISES
  // =========================
  const exercises = [
    // BARBELL
    { name: "Bench Press",              equipment: Equipment.BARBELL,       movementPattern: MovementPattern.HORIZONTAL_PUSH, isLowerBody: false, isCompound: true,  muscles: ["Chest","Triceps","Shoulders"] },
    { name: "Close Grip Bench Press",   equipment: Equipment.BARBELL,       movementPattern: MovementPattern.HORIZONTAL_PUSH, isLowerBody: false, isCompound: true,  muscles: ["Triceps","Chest"] },
    { name: "Incline Bench Press",      equipment: Equipment.BARBELL,       movementPattern: MovementPattern.HORIZONTAL_PUSH, isLowerBody: false, isCompound: true,  muscles: ["Chest","Shoulders","Triceps"] },
    { name: "Overhead Press",           equipment: Equipment.BARBELL,       movementPattern: MovementPattern.VERTICAL_PUSH,   isLowerBody: false, isCompound: true,  muscles: ["Shoulders","Triceps"] },
    { name: "Back Squat",               equipment: Equipment.BARBELL,       movementPattern: MovementPattern.SQUAT,           isLowerBody: true,  isCompound: true,  muscles: ["Quads","Glutes","Core"] },
    { name: "Front Squat",              equipment: Equipment.BARBELL,       movementPattern: MovementPattern.SQUAT,           isLowerBody: true,  isCompound: true,  muscles: ["Quads","Core"] },
    { name: "Deadlift",                 equipment: Equipment.BARBELL,       movementPattern: MovementPattern.HINGE,           isLowerBody: true,  isCompound: true,  muscles: ["Hamstrings","Glutes","Back","Core","Traps"] },
    { name: "Romanian Deadlift",        equipment: Equipment.BARBELL,       movementPattern: MovementPattern.HINGE,           isLowerBody: true,  isCompound: true,  muscles: ["Hamstrings","Glutes"] },
    { name: "Sumo Deadlift",            equipment: Equipment.BARBELL,       movementPattern: MovementPattern.HINGE,           isLowerBody: true,  isCompound: true,  muscles: ["Glutes","Hamstrings","Back"] },
    { name: "Good Morning",             equipment: Equipment.BARBELL,       movementPattern: MovementPattern.HINGE,           isLowerBody: true,  isCompound: true,  muscles: ["Hamstrings","Glutes","Back"] },
    { name: "Barbell Row",              equipment: Equipment.BARBELL,       movementPattern: MovementPattern.HORIZONTAL_PULL, isLowerBody: false, isCompound: true,  muscles: ["Back","Biceps","Traps"] },
    { name: "Pendlay Row",              equipment: Equipment.BARBELL,       movementPattern: MovementPattern.HORIZONTAL_PULL, isLowerBody: false, isCompound: true,  muscles: ["Back","Biceps"] },
    { name: "Barbell Curl",             equipment: Equipment.BARBELL,       movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Biceps"] },
    { name: "Skullcrusher",             equipment: Equipment.BARBELL,       movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Triceps"] },
    { name: "Hip Thrust",               equipment: Equipment.BARBELL,       movementPattern: MovementPattern.HINGE,           isLowerBody: true,  isCompound: true,  muscles: ["Glutes","Hamstrings"] },
    // DUMBBELL
    { name: "Incline Dumbbell Press",   equipment: Equipment.DUMBBELL,      movementPattern: MovementPattern.HORIZONTAL_PUSH, isLowerBody: false, isCompound: true,  muscles: ["Chest","Shoulders","Triceps"] },
    { name: "Dumbbell Shoulder Press",  equipment: Equipment.DUMBBELL,      movementPattern: MovementPattern.VERTICAL_PUSH,   isLowerBody: false, isCompound: true,  muscles: ["Shoulders","Triceps"] },
    { name: "Arnold Press",             equipment: Equipment.DUMBBELL,      movementPattern: MovementPattern.VERTICAL_PUSH,   isLowerBody: false, isCompound: true,  muscles: ["Shoulders","Triceps"] },
    { name: "Dumbbell Row",             equipment: Equipment.DUMBBELL,      movementPattern: MovementPattern.HORIZONTAL_PULL, isLowerBody: false, isCompound: true,  muscles: ["Back","Biceps"] },
    { name: "Dumbbell Curl",            equipment: Equipment.DUMBBELL,      movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Biceps"] },
    { name: "Hammer Curl",              equipment: Equipment.DUMBBELL,      movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Biceps","Forearms"] },
    { name: "Lateral Raise",            equipment: Equipment.DUMBBELL,      movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Shoulders"] },
    { name: "Rear Delt Fly",            equipment: Equipment.DUMBBELL,      movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Shoulders","Back"] },
    { name: "Bulgarian Split Squat",    equipment: Equipment.DUMBBELL,      movementPattern: MovementPattern.SQUAT,           isLowerBody: true,  isCompound: true,  muscles: ["Quads","Glutes"] },
    { name: "Dumbbell Lunge",           equipment: Equipment.DUMBBELL,      movementPattern: MovementPattern.SQUAT,           isLowerBody: true,  isCompound: true,  muscles: ["Quads","Glutes"] },
    // BODYWEIGHT
    { name: "Pull-Up",                  equipment: Equipment.BODYWEIGHT,    movementPattern: MovementPattern.VERTICAL_PULL,   isLowerBody: false, isCompound: true,  muscles: ["Back","Biceps"] },
    { name: "Chin-Up",                  equipment: Equipment.BODYWEIGHT,    movementPattern: MovementPattern.VERTICAL_PULL,   isLowerBody: false, isCompound: true,  muscles: ["Back","Biceps"] },
    { name: "Dip",                      equipment: Equipment.BODYWEIGHT,    movementPattern: MovementPattern.HORIZONTAL_PUSH, isLowerBody: false, isCompound: true,  muscles: ["Chest","Triceps","Shoulders"] },
    // CABLE
    { name: "Lat Pulldown",             equipment: Equipment.CABLE,         movementPattern: MovementPattern.VERTICAL_PULL,   isLowerBody: false, isCompound: true,  muscles: ["Back","Biceps"] },
    { name: "Seated Cable Row",         equipment: Equipment.CABLE,         movementPattern: MovementPattern.HORIZONTAL_PULL, isLowerBody: false, isCompound: true,  muscles: ["Back","Biceps"] },
    { name: "Face Pull",                equipment: Equipment.CABLE,         movementPattern: MovementPattern.HORIZONTAL_PULL, isLowerBody: false, isCompound: false, muscles: ["Shoulders","Traps"] },
    { name: "Cable Fly",                equipment: Equipment.CABLE,         movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Chest"] },
    { name: "Triceps Pushdown",         equipment: Equipment.CABLE,         movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Triceps"] },
    { name: "Overhead Triceps Extension", equipment: Equipment.CABLE,       movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Triceps"] },
    { name: "Cable Curl",               equipment: Equipment.CABLE,         movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Biceps"] },
    // MACHINE
    { name: "Leg Press",                equipment: Equipment.MACHINE,       movementPattern: MovementPattern.SQUAT,           isLowerBody: true,  isCompound: true,  muscles: ["Quads","Glutes"] },
    { name: "Leg Extension",            equipment: Equipment.MACHINE,       movementPattern: MovementPattern.ISOLATION,       isLowerBody: true,  isCompound: false, muscles: ["Quads"] },
    { name: "Leg Curl (Seated)",        equipment: Equipment.MACHINE,       movementPattern: MovementPattern.ISOLATION,       isLowerBody: true,  isCompound: false, muscles: ["Hamstrings"] },
    { name: "Leg Curl (Lying)",         equipment: Equipment.MACHINE,       movementPattern: MovementPattern.ISOLATION,       isLowerBody: true,  isCompound: false, muscles: ["Hamstrings"] },
    { name: "Calf Raise (Standing)",    equipment: Equipment.MACHINE,       movementPattern: MovementPattern.ISOLATION,       isLowerBody: true,  isCompound: false, muscles: ["Calves"] },
    { name: "Calf Raise (Seated)",      equipment: Equipment.MACHINE,       movementPattern: MovementPattern.ISOLATION,       isLowerBody: true,  isCompound: false, muscles: ["Calves"] },
    { name: "Pec Deck",                 equipment: Equipment.MACHINE,       movementPattern: MovementPattern.ISOLATION,       isLowerBody: false, isCompound: false, muscles: ["Chest"] },
    { name: "Machine Row",              equipment: Equipment.MACHINE,       movementPattern: MovementPattern.HORIZONTAL_PULL, isLowerBody: false, isCompound: true,  muscles: ["Back","Biceps"] },
    { name: "Machine Shoulder Press",   equipment: Equipment.MACHINE,       movementPattern: MovementPattern.VERTICAL_PUSH,   isLowerBody: false, isCompound: true,  muscles: ["Shoulders","Triceps"] },
    { name: "Smith Machine Squat",      equipment: Equipment.SMITH_MACHINE, movementPattern: MovementPattern.SQUAT,           isLowerBody: true,  isCompound: true,  muscles: ["Quads","Glutes"] },
  ];

  for (const ex of exercises) {
    const created = await prisma.exercise.upsert({
      where: { name: ex.name },
      update: { equipment: ex.equipment, movementPattern: ex.movementPattern, isLowerBody: ex.isLowerBody, isCompound: ex.isCompound, isGlobal: true },
      create: { name: ex.name, equipment: ex.equipment, movementPattern: ex.movementPattern, isLowerBody: ex.isLowerBody, isCompound: ex.isCompound, isGlobal: true },
    });
    await prisma.exerciseMuscleGroup.deleteMany({ where: { exerciseId: created.id } });
    await prisma.exerciseMuscleGroup.createMany({
      data: ex.muscles.map((m) => ({ exerciseId: created.id, muscleGroupId: mg.get(m) })),
    });
  }
  console.log("✅ Exercises seeded");

  const exByName = new Map((await prisma.exercise.findMany({ select: { id: true, name: true } })).map((e) => [e.name, e.id]));

  async function createProgram(data, days) {
    let program = await prisma.program.findFirst({ where: { name: data.name } });
    if (!program) program = await prisma.program.create({ data });
    for (const day of days) {
      const workout = await prisma.programWorkout.upsert({
        where: { programId_dayNumber: { programId: program.id, dayNumber: day.dayNumber } },
        update: { title: day.title },
        create: { programId: program.id, dayNumber: day.dayNumber, title: day.title },
      });
      await prisma.programWorkoutExercise.deleteMany({ where: { programWorkoutId: workout.id } });
      await prisma.programWorkoutExercise.createMany({
        data: day.exercises.map((e, i) => ({
          programWorkoutId: workout.id, sortOrder: i + 1,
          exerciseId: exByName.get(e.name),
          targetSets: e.sets, repRangeMin: e.min, repRangeMax: e.max, rpeTarget: e.rpe ?? null,
        })),
      });
    }
    console.log(`✅ ${data.name}`);
  }

  // =========================
  // PHUL
  // =========================
  await createProgram(
    { name: "PHUL (4 days)", goal: "GENERAL", daysPerWeek: 4, isGlobal: true, level: "INTERMEDIATE",
      summary: "Power Hypertrophy Upper Lower — combines heavy strength days with high-volume hypertrophy days.",
      details: "Day 1: Upper Power | Day 2: Lower Power | Day 3: Upper Hypertrophy | Day 4: Lower Hypertrophy. Build rep ranges before increasing weight." },
    [
      { dayNumber: 1, title: "Upper Power", exercises: [
        { name: "Bench Press",            sets: 3, min: 3,  max: 5,  rpe: 8 },
        { name: "Barbell Row",            sets: 3, min: 3,  max: 5,  rpe: 8 },
        { name: "Overhead Press",         sets: 3, min: 5,  max: 8,  rpe: 8 },
        { name: "Pull-Up",                sets: 3, min: 4,  max: 6,  rpe: 8 },
      ]},
      { dayNumber: 2, title: "Lower Power", exercises: [
        { name: "Back Squat",             sets: 3, min: 3,  max: 5,  rpe: 8 },
        { name: "Deadlift",               sets: 3, min: 3,  max: 5,  rpe: 8 },
        { name: "Leg Press",              sets: 2, min: 8,  max: 12 },
        { name: "Calf Raise (Standing)",  sets: 3, min: 10, max: 15 },
      ]},
      { dayNumber: 3, title: "Upper Hypertrophy", exercises: [
        { name: "Incline Dumbbell Press", sets: 3, min: 8,  max: 12, rpe: 8 },
        { name: "Lat Pulldown",           sets: 3, min: 8,  max: 12, rpe: 8 },
        { name: "Dumbbell Shoulder Press",sets: 3, min: 8,  max: 12 },
        { name: "Seated Cable Row",       sets: 3, min: 10, max: 15 },
        { name: "Lateral Raise",          sets: 3, min: 12, max: 20 },
        { name: "Triceps Pushdown",       sets: 3, min: 10, max: 15 },
        { name: "Dumbbell Curl",          sets: 3, min: 10, max: 15 },
      ]},
      { dayNumber: 4, title: "Lower Hypertrophy", exercises: [
        { name: "Romanian Deadlift",      sets: 3, min: 8,  max: 12, rpe: 8 },
        { name: "Leg Press",              sets: 3, min: 10, max: 15 },
        { name: "Leg Curl (Seated)",      sets: 3, min: 12, max: 15 },
        { name: "Leg Extension",          sets: 3, min: 12, max: 15 },
        { name: "Calf Raise (Standing)",  sets: 4, min: 10, max: 15 },
      ]},
    ]
  );

  // =========================
  // StrongLifts 5x5
  // =========================
  await createProgram(
    { name: "StrongLifts 5×5", goal: "STRENGTH", daysPerWeek: 3, isGlobal: true, level: "BEGINNER",
      summary: "The simplest beginner program. 3 days a week, two alternating workouts, linear progression every session.",
      details: "Alternate Workout A and B (e.g. Mon A, Wed B, Fri A). Add 2.5 kg to upper body and 5 kg to squat/deadlift every session. If you fail 3 times, deload 10%." },
    [
      { dayNumber: 1, title: "Workout A", exercises: [
        { name: "Back Squat",             sets: 5, min: 5, max: 5 },
        { name: "Bench Press",            sets: 5, min: 5, max: 5 },
        { name: "Barbell Row",            sets: 5, min: 5, max: 5 },
      ]},
      { dayNumber: 2, title: "Workout B", exercises: [
        { name: "Back Squat",             sets: 5, min: 5, max: 5 },
        { name: "Overhead Press",         sets: 5, min: 5, max: 5 },
        { name: "Deadlift",               sets: 1, min: 5, max: 5 },
      ]},
    ]
  );

  // =========================
  // Starting Strength
  // =========================
  await createProgram(
    { name: "Starting Strength", goal: "STRENGTH", daysPerWeek: 3, isGlobal: true, level: "BEGINNER",
      summary: "Mark Rippetoe's classic beginner barbell program. Simple, proven, effective.",
      details: "Alternate Workout A and B, 3× per week with a rest day between. Add 2.5 kg per session to upper body, 5 kg to squat and deadlift. Focus on form above all else." },
    [
      { dayNumber: 1, title: "Workout A", exercises: [
        { name: "Back Squat",             sets: 3, min: 5, max: 5 },
        { name: "Bench Press",            sets: 3, min: 5, max: 5 },
        { name: "Deadlift",               sets: 1, min: 5, max: 5 },
      ]},
      { dayNumber: 2, title: "Workout B", exercises: [
        { name: "Back Squat",             sets: 3, min: 5, max: 5 },
        { name: "Overhead Press",         sets: 3, min: 5, max: 5 },
        { name: "Deadlift",               sets: 1, min: 5, max: 5 },
      ]},
    ]
  );

  // =========================
  // Reddit PPL
  // =========================
  await createProgram(
    { name: "Reddit PPL (6 days)", goal: "HYPERTROPHY", daysPerWeek: 6, isGlobal: true, level: "INTERMEDIATE",
      summary: "High-frequency Push/Pull/Legs split running twice per week. Huge on volume and frequency.",
      details: "Mon: Push A | Tue: Pull A | Wed: Legs | Thu: Push B | Fri: Pull B | Sat: Legs | Sun: Rest. Complete all sets at a weight before adding more." },
    [
      { dayNumber: 1, title: "Push A", exercises: [
        { name: "Bench Press",            sets: 4, min: 5,  max: 5,  rpe: 8 },
        { name: "Overhead Press",         sets: 3, min: 8,  max: 12 },
        { name: "Incline Dumbbell Press", sets: 3, min: 8,  max: 12 },
        { name: "Lateral Raise",          sets: 3, min: 15, max: 20 },
        { name: "Triceps Pushdown",       sets: 4, min: 10, max: 15 },
        { name: "Overhead Triceps Extension", sets: 3, min: 10, max: 15 },
      ]},
      { dayNumber: 2, title: "Pull A", exercises: [
        { name: "Deadlift",               sets: 4, min: 5,  max: 5,  rpe: 8 },
        { name: "Barbell Row",            sets: 4, min: 5,  max: 5,  rpe: 8 },
        { name: "Lat Pulldown",           sets: 3, min: 10, max: 15 },
        { name: "Face Pull",              sets: 3, min: 15, max: 20 },
        { name: "Dumbbell Curl",          sets: 4, min: 10, max: 15 },
        { name: "Hammer Curl",            sets: 3, min: 10, max: 15 },
      ]},
      { dayNumber: 3, title: "Legs", exercises: [
        { name: "Back Squat",             sets: 4, min: 5,  max: 5,  rpe: 8 },
        { name: "Romanian Deadlift",      sets: 3, min: 8,  max: 12 },
        { name: "Leg Press",              sets: 3, min: 10, max: 15 },
        { name: "Leg Curl (Lying)",       sets: 3, min: 10, max: 15 },
        { name: "Calf Raise (Standing)",  sets: 5, min: 10, max: 20 },
      ]},
      { dayNumber: 4, title: "Push B", exercises: [
        { name: "Overhead Press",         sets: 4, min: 5,  max: 5,  rpe: 8 },
        { name: "Bench Press",            sets: 3, min: 8,  max: 12 },
        { name: "Cable Fly",              sets: 3, min: 12, max: 15 },
        { name: "Lateral Raise",          sets: 3, min: 15, max: 20 },
        { name: "Skullcrusher",           sets: 3, min: 8,  max: 12 },
        { name: "Triceps Pushdown",       sets: 3, min: 10, max: 15 },
      ]},
      { dayNumber: 5, title: "Pull B", exercises: [
        { name: "Barbell Row",            sets: 4, min: 5,  max: 5,  rpe: 8 },
        { name: "Pull-Up",                sets: 4, min: 4,  max: 8 },
        { name: "Seated Cable Row",       sets: 3, min: 10, max: 15 },
        { name: "Face Pull",              sets: 3, min: 15, max: 20 },
        { name: "Barbell Curl",           sets: 3, min: 8,  max: 12 },
        { name: "Hammer Curl",            sets: 3, min: 10, max: 15 },
      ]},
      { dayNumber: 6, title: "Legs B", exercises: [
        { name: "Back Squat",             sets: 4, min: 5,  max: 5,  rpe: 8 },
        { name: "Romanian Deadlift",      sets: 3, min: 8,  max: 12 },
        { name: "Leg Press",              sets: 3, min: 10, max: 15 },
        { name: "Leg Curl (Seated)",      sets: 3, min: 10, max: 15 },
        { name: "Leg Extension",          sets: 3, min: 12, max: 15 },
        { name: "Calf Raise (Seated)",    sets: 4, min: 10, max: 20 },
      ]},
    ]
  );

  // =========================
  // 5/3/1 BBB
  // =========================
  await createProgram(
    { name: "5/3/1 BBB (4 days)", goal: "STRENGTH", daysPerWeek: 4, isGlobal: true, level: "INTERMEDIATE",
      summary: "Jim Wendler's 5/3/1 with Boring But Big — build a massive strength and size base over 4-week cycles.",
      details: "Week 1: 3×5 (65/75/85%). Week 2: 3×3 (70/80/90%). Week 3: 5/3/1 (75/85/95%). Week 4: Deload. After main sets, do 5×10 @ 50-60% for volume. Base % on 90% of your 1RM." },
    [
      { dayNumber: 1, title: "Press Day", exercises: [
        { name: "Overhead Press",         sets: 3, min: 3,  max: 5,  rpe: 9 },
        { name: "Overhead Press",         sets: 5, min: 10, max: 10 },
        { name: "Chin-Up",                sets: 5, min: 8,  max: 12 },
        { name: "Face Pull",              sets: 3, min: 15, max: 20 },
        { name: "Dumbbell Curl",          sets: 3, min: 10, max: 15 },
      ]},
      { dayNumber: 2, title: "Deadlift Day", exercises: [
        { name: "Deadlift",               sets: 3, min: 3,  max: 5,  rpe: 9 },
        { name: "Romanian Deadlift",      sets: 5, min: 10, max: 10 },
        { name: "Leg Press",              sets: 5, min: 10, max: 15 },
        { name: "Leg Curl (Lying)",       sets: 3, min: 10, max: 15 },
        { name: "Calf Raise (Standing)",  sets: 5, min: 10, max: 20 },
      ]},
      { dayNumber: 3, title: "Bench Day", exercises: [
        { name: "Bench Press",            sets: 3, min: 3,  max: 5,  rpe: 9 },
        { name: "Bench Press",            sets: 5, min: 10, max: 10 },
        { name: "Barbell Row",            sets: 5, min: 10, max: 10 },
        { name: "Face Pull",              sets: 3, min: 15, max: 20 },
        { name: "Triceps Pushdown",       sets: 3, min: 10, max: 15 },
      ]},
      { dayNumber: 4, title: "Squat Day", exercises: [
        { name: "Back Squat",             sets: 3, min: 3,  max: 5,  rpe: 9 },
        { name: "Back Squat",             sets: 5, min: 10, max: 10 },
        { name: "Romanian Deadlift",      sets: 3, min: 10, max: 12 },
        { name: "Leg Curl (Seated)",      sets: 3, min: 10, max: 15 },
        { name: "Calf Raise (Seated)",    sets: 5, min: 10, max: 20 },
      ]},
    ]
  );

  // =========================
  // GZCLP
  // =========================
  await createProgram(
    { name: "GZCLP (4 days)", goal: "STRENGTH", daysPerWeek: 4, isGlobal: true, level: "BEGINNER",
      summary: "4-day linear progression program using the Tier system. Perfect transition from beginner to intermediate.",
      details: "T1 = 5×3+ AMRAP last set (heavy). T2 = 3×10 (moderate). T3 = 3×15+ (light). Progress T1 by 5 kg when successful. T2 by 2.5 kg." },
    [
      { dayNumber: 1, title: "Day 1", exercises: [
        { name: "Back Squat",             sets: 5, min: 3,  max: 5,  rpe: 9 },
        { name: "Bench Press",            sets: 3, min: 10, max: 10 },
        { name: "Lat Pulldown",           sets: 3, min: 15, max: 15 },
      ]},
      { dayNumber: 2, title: "Day 2", exercises: [
        { name: "Overhead Press",         sets: 5, min: 3,  max: 5,  rpe: 9 },
        { name: "Deadlift",               sets: 3, min: 10, max: 10 },
        { name: "Barbell Row",            sets: 3, min: 15, max: 15 },
      ]},
      { dayNumber: 3, title: "Day 3", exercises: [
        { name: "Bench Press",            sets: 5, min: 3,  max: 5,  rpe: 9 },
        { name: "Back Squat",             sets: 3, min: 10, max: 10 },
        { name: "Lat Pulldown",           sets: 3, min: 15, max: 15 },
      ]},
      { dayNumber: 4, title: "Day 4", exercises: [
        { name: "Deadlift",               sets: 5, min: 3,  max: 5,  rpe: 9 },
        { name: "Overhead Press",         sets: 3, min: 10, max: 10 },
        { name: "Pull-Up",                sets: 3, min: 15, max: 15 },
      ]},
    ]
  );

  // =========================
  // Arnold Split
  // =========================
  await createProgram(
    { name: "Arnold Split (6 days)", goal: "HYPERTROPHY", daysPerWeek: 6, isGlobal: true, level: "ADVANCED",
      summary: "Arnold Schwarzenegger's legendary 6-day split. Each muscle group trained twice per week with maximum volume.",
      details: "Days 1&4: Chest + Back | Days 2&5: Shoulders + Arms | Days 3&6: Legs. Rest 60-90s between sets. Not for beginners." },
    [
      { dayNumber: 1, title: "Chest & Back I", exercises: [
        { name: "Bench Press",            sets: 4, min: 8,  max: 12 },
        { name: "Incline Dumbbell Press", sets: 4, min: 8,  max: 12 },
        { name: "Cable Fly",              sets: 3, min: 12, max: 15 },
        { name: "Pull-Up",                sets: 4, min: 6,  max: 10 },
        { name: "Barbell Row",            sets: 4, min: 8,  max: 12 },
        { name: "Seated Cable Row",       sets: 3, min: 10, max: 15 },
      ]},
      { dayNumber: 2, title: "Shoulders & Arms I", exercises: [
        { name: "Arnold Press",           sets: 4, min: 8,  max: 12 },
        { name: "Lateral Raise",          sets: 4, min: 12, max: 15 },
        { name: "Rear Delt Fly",          sets: 3, min: 12, max: 15 },
        { name: "Barbell Curl",           sets: 4, min: 8,  max: 12 },
        { name: "Dumbbell Curl",          sets: 3, min: 10, max: 15 },
        { name: "Skullcrusher",           sets: 4, min: 8,  max: 12 },
        { name: "Triceps Pushdown",       sets: 3, min: 10, max: 15 },
      ]},
      { dayNumber: 3, title: "Legs I", exercises: [
        { name: "Back Squat",             sets: 4, min: 8,  max: 12 },
        { name: "Romanian Deadlift",      sets: 3, min: 10, max: 12 },
        { name: "Leg Press",              sets: 3, min: 10, max: 15 },
        { name: "Leg Extension",          sets: 4, min: 12, max: 15 },
        { name: "Leg Curl (Lying)",       sets: 4, min: 12, max: 15 },
        { name: "Calf Raise (Standing)",  sets: 5, min: 15, max: 20 },
      ]},
      { dayNumber: 4, title: "Chest & Back II", exercises: [
        { name: "Incline Bench Press",    sets: 4, min: 8,  max: 12 },
        { name: "Dumbbell Row",           sets: 4, min: 8,  max: 12 },
        { name: "Pec Deck",               sets: 3, min: 12, max: 15 },
        { name: "Lat Pulldown",           sets: 4, min: 10, max: 15 },
        { name: "Cable Fly",              sets: 3, min: 12, max: 15 },
        { name: "Face Pull",              sets: 3, min: 15, max: 20 },
      ]},
      { dayNumber: 5, title: "Shoulders & Arms II", exercises: [
        { name: "Dumbbell Shoulder Press",sets: 4, min: 8,  max: 12 },
        { name: "Lateral Raise",          sets: 4, min: 12, max: 15 },
        { name: "Rear Delt Fly",          sets: 3, min: 12, max: 15 },
        { name: "Hammer Curl",            sets: 4, min: 10, max: 15 },
        { name: "Cable Curl",             sets: 3, min: 12, max: 15 },
        { name: "Overhead Triceps Extension", sets: 4, min: 10, max: 15 },
        { name: "Dip",                    sets: 3, min: 8,  max: 12 },
      ]},
      { dayNumber: 6, title: "Legs II", exercises: [
        { name: "Front Squat",            sets: 4, min: 8,  max: 12 },
        { name: "Bulgarian Split Squat",  sets: 3, min: 10, max: 12 },
        { name: "Hip Thrust",             sets: 4, min: 10, max: 15 },
        { name: "Leg Press",              sets: 3, min: 10, max: 15 },
        { name: "Leg Curl (Seated)",      sets: 4, min: 12, max: 15 },
        { name: "Calf Raise (Seated)",    sets: 5, min: 15, max: 20 },
      ]},
    ]
  );

  // =========================
  // Upper/Lower 4-Day
  // =========================
  await createProgram(
    { name: "Upper/Lower Split (4 days)", goal: "GENERAL", daysPerWeek: 4, isGlobal: true, level: "INTERMEDIATE",
      summary: "Balanced 4-day upper/lower split mixing strength and hypertrophy across the week.",
      details: "Mon: Upper A | Wed: Lower A | Fri: Upper B | Sat: Lower B. Great balance of frequency, volume and recovery for consistent progress." },
    [
      { dayNumber: 1, title: "Upper A — Strength", exercises: [
        { name: "Bench Press",            sets: 4, min: 4,  max: 6,  rpe: 8 },
        { name: "Barbell Row",            sets: 4, min: 4,  max: 6,  rpe: 8 },
        { name: "Overhead Press",         sets: 3, min: 6,  max: 8 },
        { name: "Pull-Up",                sets: 3, min: 5,  max: 8 },
        { name: "Lateral Raise",          sets: 3, min: 12, max: 15 },
        { name: "Triceps Pushdown",       sets: 3, min: 10, max: 12 },
        { name: "Dumbbell Curl",          sets: 3, min: 10, max: 12 },
      ]},
      { dayNumber: 2, title: "Lower A — Strength", exercises: [
        { name: "Back Squat",             sets: 4, min: 4,  max: 6,  rpe: 8 },
        { name: "Romanian Deadlift",      sets: 3, min: 6,  max: 8 },
        { name: "Leg Press",              sets: 3, min: 8,  max: 12 },
        { name: "Leg Curl (Seated)",      sets: 3, min: 10, max: 12 },
        { name: "Calf Raise (Standing)",  sets: 4, min: 12, max: 15 },
      ]},
      { dayNumber: 3, title: "Upper B — Volume", exercises: [
        { name: "Incline Dumbbell Press", sets: 4, min: 8,  max: 12 },
        { name: "Seated Cable Row",       sets: 4, min: 8,  max: 12 },
        { name: "Dumbbell Shoulder Press",sets: 3, min: 10, max: 15 },
        { name: "Lat Pulldown",           sets: 3, min: 10, max: 15 },
        { name: "Face Pull",              sets: 3, min: 15, max: 20 },
        { name: "Skullcrusher",           sets: 3, min: 10, max: 12 },
        { name: "Hammer Curl",            sets: 3, min: 10, max: 12 },
      ]},
      { dayNumber: 4, title: "Lower B — Volume", exercises: [
        { name: "Deadlift",               sets: 4, min: 4,  max: 6,  rpe: 8 },
        { name: "Leg Press",              sets: 3, min: 10, max: 15 },
        { name: "Bulgarian Split Squat",  sets: 3, min: 8,  max: 12 },
        { name: "Leg Extension",          sets: 3, min: 12, max: 15 },
        { name: "Leg Curl (Lying)",       sets: 3, min: 12, max: 15 },
        { name: "Calf Raise (Seated)",    sets: 4, min: 12, max: 15 },
      ]},
    ]
  );

  console.log("🌱 All done!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect().finally(() => process.exit(1)); });
