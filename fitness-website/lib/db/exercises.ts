import { db } from "@/firebase-config";
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp, writeBatch,
} from "firebase/firestore";

export type ExerciseCategory = "posture" | "strength" | "flexibility" | "balance" | "cardio";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  difficulty: Difficulty;
  duration: number; // minutes
  instructions: string[];
  tags: string[];
  isActive: boolean;
  createdAt?: any;
}

const COL = "exercises";

export async function getAllExercises(): Promise<Exercise[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Exercise))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Exercise) : null;
}

export async function createExercise(data: Omit<Exercise, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateExercise(id: string, data: Partial<Omit<Exercise, "id">>): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteExercise(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

// Seed exercises — call once from admin
export const SEED_EXERCISES: Omit<Exercise, "id" | "createdAt">[] = [
  {
    name: "Chin Tuck", category: "posture", difficulty: "beginner", duration: 5, isActive: true,
    description: "Corrects forward head posture by strengthening deep cervical flexors.",
    instructions: ["Sit tall with shoulders back", "Gently pull chin straight back", "Hold 5 seconds", "Repeat 10 times"],
    tags: ["neck", "posture", "desk"],
  },
  {
    name: "Wall Angel", category: "posture", difficulty: "beginner", duration: 5, isActive: true,
    description: "Opens chest and improves thoracic spine mobility.",
    instructions: ["Stand with back flat against wall", "Raise arms to 90°", "Slide arms up wall keeping contact", "Lower slowly", "Repeat 10 times"],
    tags: ["shoulders", "posture", "thoracic"],
  },
  {
    name: "Cat-Cow Stretch", category: "flexibility", difficulty: "beginner", duration: 5, isActive: true,
    description: "Mobilises the entire spine and reduces back stiffness.",
    instructions: ["Start on hands and knees", "Inhale — arch back, lift head (Cow)", "Exhale — round spine, tuck chin (Cat)", "Alternate 10 times"],
    tags: ["spine", "flexibility", "back"],
  },
  {
    name: "Thoracic Extension", category: "posture", difficulty: "beginner", duration: 5, isActive: true,
    description: "Counteracts upper back rounding from prolonged sitting.",
    instructions: ["Sit in chair, hands behind head", "Extend upper back over chair backrest", "Hold 3 seconds", "Repeat 8 times"],
    tags: ["thoracic", "upper back", "desk"],
  },
  {
    name: "Shoulder Blade Squeeze", category: "posture", difficulty: "beginner", duration: 3, isActive: true,
    description: "Activates mid-back muscles to pull shoulders back.",
    instructions: ["Sit or stand tall", "Squeeze shoulder blades together", "Hold 5 seconds", "Release and repeat 15 times"],
    tags: ["shoulders", "posture", "rhomboids"],
  },
  {
    name: "Hip Flexor Stretch", category: "flexibility", difficulty: "beginner", duration: 5, isActive: true,
    description: "Releases tight hip flexors common in people who sit for long periods.",
    instructions: ["Kneel on one knee", "Shift weight forward until stretch felt in front hip", "Hold 30 seconds each side"],
    tags: ["hips", "flexibility", "sitting"],
  },
  {
    name: "Plank Hold", category: "strength", difficulty: "intermediate", duration: 5, isActive: true,
    description: "Builds core stability essential for good posture.",
    instructions: ["Start in push-up position on forearms", "Keep body in straight line", "Engage core — don't let hips sag", "Hold 30 seconds, rest, repeat 3 times"],
    tags: ["core", "strength", "stability"],
  },
  {
    name: "Bird Dog", category: "strength", difficulty: "beginner", duration: 5, isActive: true,
    description: "Improves spinal stability and balance.",
    instructions: ["On hands and knees", "Extend opposite arm and leg simultaneously", "Hold 3 seconds", "Alternate sides — 10 reps each"],
    tags: ["core", "balance", "spine"],
  },
  {
    name: "Dead Bug", category: "strength", difficulty: "intermediate", duration: 5, isActive: true,
    description: "Trains deep core stability while protecting the lower back.",
    instructions: ["Lie on back, arms up, knees at 90°", "Slowly lower opposite arm and leg", "Keep lower back pressed to floor", "Return and alternate — 10 reps"],
    tags: ["core", "strength", "lower back"],
  },
  {
    name: "Glute Bridge", category: "strength", difficulty: "beginner", duration: 5, isActive: true,
    description: "Activates glutes and supports lumbar spine alignment.",
    instructions: ["Lie on back, knees bent", "Squeeze glutes and lift hips", "Hold 2 seconds at top", "Lower slowly — 3 sets of 12"],
    tags: ["glutes", "strength", "lower back"],
  },
  {
    name: "Doorway Chest Stretch", category: "flexibility", difficulty: "beginner", duration: 3, isActive: true,
    description: "Opens tight chest muscles that contribute to rounded shoulders.",
    instructions: ["Stand in doorway with arms at 90°", "Step forward gently until chest stretch felt", "Hold 30 seconds", "Repeat 3 times"],
    tags: ["chest", "flexibility", "shoulders"],
  },
  {
    name: "Seated Spinal Twist", category: "flexibility", difficulty: "beginner", duration: 3, isActive: true,
    description: "Releases spinal tension and improves rotational mobility.",
    instructions: ["Sit tall in chair", "Place right hand on left knee", "Gently rotate left", "Hold 20 seconds each side"],
    tags: ["spine", "flexibility", "rotation"],
  },
  {
    name: "Neck Side Stretch", category: "flexibility", difficulty: "beginner", duration: 3, isActive: true,
    description: "Relieves tension in neck and upper trapezius muscles.",
    instructions: ["Sit or stand tall", "Tilt ear toward shoulder", "Hold 20-30 seconds each side", "Breathe slowly"],
    tags: ["neck", "flexibility", "tension"],
  },
  {
    name: "Superman Hold", category: "strength", difficulty: "intermediate", duration: 5, isActive: true,
    description: "Strengthens the entire posterior chain to support upright posture.",
    instructions: ["Lie face down, arms extended", "Lift arms, chest, and legs off floor", "Hold 3 seconds", "Lower and repeat 10 times"],
    tags: ["back", "strength", "posture"],
  },
  {
    name: "Single Leg Balance", category: "balance", difficulty: "beginner", duration: 5, isActive: true,
    description: "Improves proprioception and ankle/hip stability.",
    instructions: ["Stand on one leg", "Maintain upright posture", "Hold 30 seconds each side", "Progress to eyes closed"],
    tags: ["balance", "stability", "ankles"],
  },
  {
    name: "Lat Stretch", category: "flexibility", difficulty: "beginner", duration: 3, isActive: true,
    description: "Releases tight latissimus dorsi that can pull spine into lateral flexion.",
    instructions: ["Raise one arm overhead", "Lean to opposite side", "Hold 20 seconds each side"],
    tags: ["back", "flexibility", "shoulders"],
  },
  {
    name: "Squat Hold", category: "strength", difficulty: "beginner", duration: 5, isActive: true,
    description: "Builds leg and core strength while improving ankle mobility.",
    instructions: ["Feet shoulder-width apart, toes slightly out", "Sit back and down", "Keep chest up and knees over toes", "3 sets of 10"],
    tags: ["legs", "strength", "mobility"],
  },
  {
    name: "Live Bicep Curl", category: "strength", difficulty: "intermediate", duration: 10, isActive: true,
    description: "AI-guided bicep curl with real-time rep counting and form correction.",
    instructions: ["Stand with dumbbells at sides", "Curl weights keeping elbows tucked", "Follow the AI rep counter", "Aim for 3 sets of 12"],
    tags: ["arms", "strength", "AI-guided"],
  },
  {
    name: "Live Lunge Analysis", category: "strength", difficulty: "intermediate", duration: 10, isActive: true,
    description: "AI-powered lunge with real-time knee tracking and posture feedback.",
    instructions: ["Stand upright", "Step forward into lunge position", "Follow AI form guidance", "Alternate legs — 3 sets of 10 each"],
    tags: ["legs", "strength", "AI-guided"],
  },
  {
    name: "Live Plank Check", category: "strength", difficulty: "intermediate", duration: 8, isActive: true,
    description: "AI monitors your plank alignment in real time.",
    instructions: ["Get into plank position", "Start AI monitoring", "Maintain straight line from head to heels", "Hold as long as form allows"],
    tags: ["core", "strength", "AI-guided"],
  },
  {
    name: "Live Push-up Counter", category: "strength", difficulty: "intermediate", duration: 10, isActive: true,
    description: "AI counts reps and checks push-up form automatically.",
    instructions: ["Start in push-up position", "Start AI counter", "Lower chest to floor with control", "Push up maintaining rigid core"],
    tags: ["chest", "strength", "AI-guided"],
  },
  {
    name: "Posture Check Session", category: "posture", difficulty: "beginner", duration: 15, isActive: true,
    description: "Full posture analysis session — side, front, and back view detection.",
    instructions: ["Position camera at shoulder height", "Sit sideways for neck/torso angles", "Face camera for symmetry check", "Session saves your posture score"],
    tags: ["posture", "AI-guided", "assessment"],
  },
];
