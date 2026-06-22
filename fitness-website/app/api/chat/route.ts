import { NextResponse } from 'next/server';
import { generateAIResponse, extractTraitsFromMessage } from '@/lib/ai-client';
import { findRecommendations } from '@/lib/rag';
import { MemoryClient } from 'mem0ai';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase-config';

// Lazy singleton — only created when a request arrives, not at build time
let memoryClient: MemoryClient | null = null;
function getMemoryClient(): MemoryClient {
  if (!memoryClient) {
    memoryClient = new MemoryClient({ apiKey: process.env.MEM0_API_KEY! });
  }
  return memoryClient;
}

export async function POST(req: Request) {
  try {
    // --- Auth Check ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to use the AI Coach.' },
        { status: 401 }
      );
    }

    const { messages, userId, profile, todaysMeals } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // --- Build user traits from profile ---
    let dbTraits: any = {};
    if (profile) {
      const data = profile;
      let age;
      if (data.dob) {
        const birthDate = new Date(data.dob);
        age = new Date().getFullYear() - birthDate.getFullYear();
      }

      dbTraits = {
        name: data.displayName || data.firstName || "Athlete",
        age,
        sex: data.gender === "female" ? "Female" : (data.gender === "male" ? "Male" : undefined),
        weight: data.weight,
        height: data.height ? data.height / 100 : undefined,
        goal: data.fitnessGoal,
        activeMealPlanId: data.activeMealPlanId,
        nutritionGoals: data.nutritionGoals
      };
    }

    // --- Format Today's Logged Meals from Client Payload ---
    let todayMealsContext = "";
    if (todaysMeals && Array.isArray(todaysMeals) && todaysMeals.length > 0) {
      todayMealsContext = "Today's Logged Meals in App Database:\n";
      todaysMeals.forEach((meal: any) => {
        todayMealsContext += `- ${meal.name} at ${meal.time}: `;
        if (meal.items && Array.isArray(meal.items)) {
          todayMealsContext += meal.items.map((i: any) => `${i.quantity}x ${i.name} (${Math.round(i.calories * i.quantity)} cal)`).join(', ');
        }
        todayMealsContext += '\n';
      });
    }

    // --- Mem0 Integration: Save and Search Memory ---
    let memoryContext = "";
    if (userId) {
      try {
        // Add the latest user message to memory
        await getMemoryClient().add([{ role: "user", content: lastMessage }], { user_id: userId });

        // Search for relevant past memories based on the current query
        const memories = await getMemoryClient().search(lastMessage, { user_id: userId });
        if (memories && memories.length > 0) {
          // Extract memory text
          memoryContext = memories.map((m: any) => m.memory).join('\n');
        }
      } catch (err) {
        console.error('Mem0 Integration Error:', err);
      }
    }

    // --- Extract traits from message using AI (with Groq fallback) ---
    const extractedTraits = await extractTraitsFromMessage(lastMessage);

    // Merge: extracted traits override DB traits (user explicitly states a change)
    const combinedTraits = { ...dbTraits, ...extractedTraits };

    // --- RAG: Fetch matches from compressed dataset ---
    const matchedData = findRecommendations(combinedTraits);

    // --- Build context for AI ---
    const contextStr = matchedData.map((row: any) =>
      `Profile Match:
Level: ${row.level || row.Level}
Goal: ${row.goal || row['Fitness Goal']}
Exercises to recommend: ${row.exercises || row.Exercises}
Equipment needed: ${row.equipment || row.Equipment}
Diet to recommend: ${row.diet || row.Diet}
General Advice: ${row.recommendation || row.Recommendation}`
    ).join('\n\n');

    const promptText = `You are an expert fitness and diet chatbot. You are polite, encouraging, and highly knowledgeable.
Use the following context from our dataset, the user's explicit profile, the user's logged meals today, and the user's past memory to help answer their question. If the dataset provides specific workouts, diets, or advice for their profile, incorporate them into your answer naturally. Do not explicitly say "the dataset says", but rather "I recommend" or "Based on your focus...". If the dataset context is empty or irrelevant, just provide standard fitness advice. If the user asks what they ate today, refer specifically to "Today's Logged Meals in App Database". 

CRITICAL MEAL PLAN INSTRUCTION: You MUST strictly align your food recommendations with the user's "Active Meal Plan" and "Daily Nutrition Targets". If the user is on a "Keto" plan or their carb target is very low, DO NOT recommend high-carb foods like apples, bananas, whole grains, or rice. Recommend keto-friendly foods instead (fats, proteins, low-carb veggies).

CRITICAL FORMATTING INSTRUCTION: DO NOT use any Markdown formatting whatsoever. Do not use asterisks (* or **) for bold/italics, do not use hashes (#) for headers, and do not use lists. Respond entirely in plain text, using normal paragraph breaks for structure.

---
User's Real Profile:
Name: ${combinedTraits.name || 'Unknown'}
Age: ${combinedTraits.age || 'Unknown'}
Sex: ${combinedTraits.sex || 'Unknown'}
Weight: ${combinedTraits.weight ? combinedTraits.weight + 'kg' : 'Unknown'}
Height: ${combinedTraits.height ? combinedTraits.height + 'm' : 'Unknown'}
Fitness Goal: ${combinedTraits.goal || 'Unknown'}
Active Meal Plan: ${combinedTraits.activeMealPlanId || 'None'}
Daily Nutrition Targets: ${combinedTraits.nutritionGoals ? 'Calories: ' + combinedTraits.nutritionGoals.calories + ', Protein: ' + combinedTraits.nutritionGoals.protein + 'g, Carbs: ' + combinedTraits.nutritionGoals.carbs + 'g, Fat: ' + combinedTraits.nutritionGoals.fat + 'g' : 'Unknown'}
---
${todayMealsContext || "No meals logged yet today."}
---
User's Memory Context (e.g., past logged foods from chat conversations, preferences):
${memoryContext || 'No past memory found.'}
---
Dataset RAG Context:
${contextStr}
---
User's Question: ${lastMessage}`;

    // --- Generate response with Gemini → Groq fallback ---
    const aiResponse = await generateAIResponse(promptText);

    return NextResponse.json({
      role: 'assistant',
      content: aiResponse.text,
      provider: aiResponse.provider, // Let the client know which AI answered
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
