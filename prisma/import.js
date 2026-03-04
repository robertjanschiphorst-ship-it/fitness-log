/**
 * Import script: creates exercises, templates, and recent sessions from CSV
 * Run: node --env-file=.env.local prisma/import.js
 */
const { PrismaClient, Equipment, MovementPattern } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const fs = require("fs");
const path = require("path");

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

// ── Exercise name mapping: CSV name → DB name ─────────────────────────────
const NAME_MAP = {
  "Incline Dumbell Press":     "Incline Dumbbell Press",
  "Incline Dumbbell Press":    "Incline Dumbbell Press",
  "Overhead Dumbbell Press":   "Dumbbell Shoulder Press",
  "Dumbbell Lateral Raise":    "Lateral Raise",
  "Tricep Press Down":         "Triceps Pushdown",
  "Pull ups":                  "Pull-Up",
  "Lat Pull Down":             "Lat Pulldown",
  "Lat Pulldown":              "Lat Pulldown",
  "One Arm Dumbbell Row":      "Dumbbell Row",
  "Single Arm Dumbell Row":    "Dumbbell Row",
  "Dumbell Curl":              "Dumbbell Curl",
  "Skull Crusher":             "Skullcrusher",
  "Chest Fly":                 "Cable Fly",
  "Bulgarian Squat":           "Bulgarian Split Squat",
  "Military Press":            "Overhead Press",
  "Rope Triceps Extention":    "Overhead Triceps Extension",
  "Palloff Press Iso":         null,  // skip
  "Hanging Leg Raise":         null,  // skip
  "Plank":                     null,  // skip
  "Incline Dumbell Curl":      "Dumbbell Curl",
  "Dumbell Step Up":           "Dumbbell Step Up",
  "Standing Calf Raise":       "Calf Raise (Standing)",
  "Seated Calf Raise":         "Calf Raise (Seated)",
  "Barbell Curl":              "Barbell Curl",
};

// Exercises to create if they don't exist
const NEW_EXERCISES = [
  {
    name: "Cable Back Fly",
    equipment: Equipment.CABLE,
    movementPattern: MovementPattern.ISOLATION,
    isLowerBody: false,
    isCompound: false,
    muscles: ["Shoulders", "Back"],
  },
  {
    name: "Glute Bridge",
    equipment: Equipment.BODYWEIGHT,
    movementPattern: MovementPattern.HINGE,
    isLowerBody: true,
    isCompound: true,
    muscles: ["Glutes", "Hamstrings"],
  },
  {
    name: "Dumbbell Step Up",
    equipment: Equipment.DUMBBELL,
    movementPattern: MovementPattern.SQUAT,
    isLowerBody: true,
    isCompound: true,
    muscles: ["Quads", "Glutes"],
  },
  {
    name: "Walking Lunge",
    equipment: Equipment.DUMBBELL,
    movementPattern: MovementPattern.SQUAT,
    isLowerBody: true,
    isCompound: true,
    muscles: ["Quads", "Glutes"],
  },
  {
    name: "Pec Deck",
    equipment: Equipment.MACHINE,
    movementPattern: MovementPattern.ISOLATION,
    isLowerBody: false,
    isCompound: false,
    muscles: ["Chest"],
  },
];

// ── Parse CSV ─────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Simple CSV parse that handles quoted fields
    const fields = [];
    let inQuote = false;
    let field = "";
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { fields.push(field); field = ""; continue; }
      field += ch;
    }
    fields.push(field);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (fields[i] ?? "").trim(); });
    rows.push(obj);
  }
  return rows;
}

function resolveExerciseName(csvName) {
  const trimmed = csvName.trim();
  if (trimmed in NAME_MAP) return NAME_MAP[trimmed];
  return trimmed; // Use as-is
}

async function main() {
  console.log("🚀 Starting import...\n");

  // 1. Create muscle groups lookup
  const muscleNames = ["Chest","Back","Shoulders","Biceps","Triceps","Quads","Hamstrings","Glutes","Calves","Core","Forearms","Traps"];
  const mgRows = await Promise.all(
    muscleNames.map((name) =>
      prisma.muscleGroup.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  const mg = new Map(mgRows.map((m) => [m.name, m.id]));

  // 2. Create any missing exercises
  for (const ex of NEW_EXERCISES) {
    const created = await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: {
        name: ex.name,
        equipment: ex.equipment,
        movementPattern: ex.movementPattern,
        isLowerBody: ex.isLowerBody,
        isCompound: ex.isCompound,
        isGlobal: true,
      },
    });
    // Upsert muscle group links
    await prisma.exerciseMuscleGroup.deleteMany({ where: { exerciseId: created.id } });
    if (ex.muscles.length > 0) {
      await prisma.exerciseMuscleGroup.createMany({
        data: ex.muscles
          .filter((m) => mg.has(m))
          .map((m) => ({ exerciseId: created.id, muscleGroupId: mg.get(m) })),
      });
    }
    console.log(`  ✓ Exercise: ${ex.name}`);
  }

  // 3. Build exercise name → id map
  const allExercises = await prisma.exercise.findMany({ select: { id: true, name: true } });
  const exByName = new Map(allExercises.map((e) => [e.name, e.id]));

  // 4. Create templates (delete existing ones with same names first to avoid duplicates)
  const TEMPLATES = [
    {
      name: "Push Day",
      templateType: "PUSH",
      exercises: [
        { name: "Bench Press",           sets: 3, min: 5,  max: 8  },
        { name: "Incline Dumbbell Press",sets: 3, min: 8,  max: 12 },
        { name: "Dumbbell Shoulder Press",sets: 3, min: 8, max: 10 },
        { name: "Cable Fly",             sets: 3, min: 10, max: 12 },
        { name: "Lateral Raise",         sets: 3, min: 12, max: 15 },
        { name: "Triceps Pushdown",      sets: 3, min: 10, max: 12 },
      ],
    },
    {
      name: "Pull Day",
      templateType: "PULL",
      exercises: [
        { name: "Pull-Up",               sets: 3, min: 3,  max: 8  },
        { name: "Lat Pulldown",          sets: 3, min: 8,  max: 12 },
        { name: "Dumbbell Row",          sets: 3, min: 8,  max: 12 },
        { name: "Cable Back Fly",        sets: 3, min: 10, max: 15 },
        { name: "Face Pull",             sets: 3, min: 12, max: 15 },
        { name: "Dumbbell Curl",         sets: 3, min: 10, max: 12 },
      ],
    },
    {
      name: "Leg Day",
      templateType: "LEGS",
      exercises: [
        { name: "Back Squat",            sets: 3, min: 5,  max: 8  },
        { name: "Romanian Deadlift",     sets: 3, min: 8,  max: 10 },
        { name: "Walking Lunge",         sets: 3, min: 8,  max: 12 },
        { name: "Glute Bridge",          sets: 3, min: 10, max: 12 },
        { name: "Calf Raise (Standing)", sets: 3, min: 12, max: 15 },
      ],
    },
  ];

  for (const tpl of TEMPLATES) {
    const existing = await prisma.workoutTemplate.findFirst({ where: { name: tpl.name } });
    if (existing) {
      console.log(`  ℹ️  Template already exists: ${tpl.name} — skipping`);
      continue;
    }
    const created = await prisma.workoutTemplate.create({
      data: { name: tpl.name, templateType: tpl.templateType },
    });
    let sortOrder = 1;
    for (const ex of tpl.exercises) {
      const exId = exByName.get(ex.name);
      if (!exId) { console.warn(`  ⚠️  Unknown exercise for template: ${ex.name}`); continue; }
      await prisma.templateExercise.create({
        data: {
          templateId: created.id,
          exerciseId: exId,
          sortOrder: sortOrder++,
          targetSets: ex.sets,
          repRangeMin: ex.min,
          repRangeMax: ex.max,
        },
      });
    }
    console.log(`  ✓ Template: ${tpl.name}`);
  }

  // 5. Import workout sessions from CSV (last 6 months: Sept 2025+)
  const csvPath = path.resolve(__dirname, "../..", "mnt/uploads/LiftRep Training Logs 11-09-2018 to 3-04-2026.csv");

  // Try both paths
  let csvData;
  const paths = [
    csvPath,
    "/sessions/ecstatic-modest-franklin/mnt/uploads/LiftRep Training Logs 11-09-2018 to 3-04-2026.csv",
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) { csvData = parseCSV(p); break; }
  }
  if (!csvData) { console.error("CSV not found!"); return; }

  // Group rows by date → exercise → sets
  const sessionsByDate = new Map();
  for (const row of csvData) {
    const d = row["date"]?.trim();
    if (!d) continue;
    const parts = d.split("/");
    if (parts.length !== 3) continue;
    const [month, , year] = parts.map(Number);
    if (!(year === 2025 && month >= 9) && !(year === 2026)) continue;

    if (!sessionsByDate.has(d)) sessionsByDate.set(d, new Map());
    const dayMap = sessionsByDate.get(d);

    const csvName = row["exercise"]?.trim();
    const resolvedName = resolveExerciseName(csvName);
    if (!resolvedName) continue; // skipped

    if (!dayMap.has(resolvedName)) dayMap.set(resolvedName, []);
    const weightKg = parseFloat(row["weight_kg"]) || 0;
    const reps = parseInt(row["reps"]) || 0;
    if (reps > 0 || weightKg > 0) {
      dayMap.get(resolvedName).push({ weightKg, reps });
    }
  }

  console.log(`\n📅 Found ${sessionsByDate.size} workout days to import`);

  let imported = 0;
  let skipped = 0;

  for (const [dateStr, dayMap] of [...sessionsByDate.entries()].sort()) {
    // Parse the date (M/D/YYYY)
    const [m, d, y] = dateStr.split("/").map(Number);
    const sessionDate = new Date(y, m - 1, d, 12, 0, 0); // noon local

    // Check if we already have a session on this date (avoid duplicates)
    const startOfDay = new Date(y, m - 1, d, 0, 0, 0);
    const endOfDay = new Date(y, m - 1, d, 23, 59, 59);
    const existing = await prisma.workoutSession.findFirst({
      where: { startedAt: { gte: startOfDay, lte: endOfDay } },
    });
    if (existing) {
      skipped++;
      continue;
    }

    // Create session
    const session = await prisma.workoutSession.create({
      data: {
        startedAt: sessionDate,
        finishedAt: new Date(sessionDate.getTime() + 90 * 60 * 1000), // +90 min
      },
    });

    let sortOrder = 1;
    for (const [exName, sets] of dayMap.entries()) {
      const exId = exByName.get(exName);
      if (!exId) {
        console.warn(`    ⚠️  Unknown exercise: "${exName}" — skipping`);
        continue;
      }
      if (sets.length === 0) continue;

      const se = await prisma.sessionExercise.create({
        data: {
          sessionId: session.id,
          exerciseId: exId,
          sortOrder: sortOrder++,
          exerciseName: exName,
          targetSets: sets.length,
          repRangeMin: Math.min(...sets.map((s) => s.reps).filter((r) => r > 0)) || 8,
          repRangeMax: Math.max(...sets.map((s) => s.reps).filter((r) => r > 0)) || 12,
        },
      });

      let setNumber = 1;
      for (const set of sets) {
        if (set.reps === 0 && set.weightKg === 0) continue;
        await prisma.set.create({
          data: {
            sessionExerciseId: se.id,
            setNumber: setNumber++,
            reps: set.reps || 1,
            weightKg: set.weightKg,
            rpe: 7, // default RPE
          },
        });
      }
    }

    console.log(`  ✓ ${dateStr} (${dayMap.size} exercises)`);
    imported++;
  }

  console.log(`\n✅ Done! Imported ${imported} sessions, skipped ${skipped} (already existed).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
