export type WellnessCategory = "exercise" | "nutrition" | "habit";
export type WellnessStage = "infant" | "child" | "adolescent" | "adult" | "senior";

export type WellnessSuggestion = {
  id: string;
  category: WellnessCategory;
  title: string;
  why: (stage: WellnessStage) => string;
  ageGroup: (stage: WellnessStage) => string;
  limitation: string;
  sourceLabel: string;
  sourceUrl: string;
};

const whoActivity = "https://www.who.int/initiatives/behealthy/physical-activity";
const whoDiet = "https://www.who.int/news-room/fact-sheets/detail/healthy-diet";

export const wellnessSuggestions: WellnessSuggestion[] = [
  {
    id: "comfortable-movement",
    category: "exercise",
    title: "Notice a comfortable movement opportunity",
    why: (stage) => stage === "infant" ? "For infants, follow the child's own pediatric care guidance; use this only to record caregiver observations." : stage === "child" ? "Children can record play and movement they already enjoy." : stage === "adolescent" ? "Adolescents can record activities that feel comfortable and enjoyable." : stage === "senior" ? "Older adults can record movement suited to their own abilities and care plan." : "Adults can record movement that fits their routine and abilities.",
    ageGroup: (stage) => stage === "infant" ? "Infants · caregiver observation only" : stage === "senior" ? "Older adults" : stage === "child" || stage === "adolescent" ? "Children and adolescents" : "Adults",
    limitation: "Do not use this suggestion to start or increase exercise when activity is restricted, after a recent fall or surgery, or during new or worsening symptoms. Ask a clinician first; use Emergency Help for urgent symptoms.",
    sourceLabel: "WHO physical activity guidance",
    sourceUrl: whoActivity,
  },
  {
    id: "gentle-mobility",
    category: "exercise",
    title: "Record a gentle mobility or balance activity",
    why: () => "This is a place to track an activity already approved for the person's abilities and care plan.",
    ageGroup: () => "Older adults or people whose clinician has approved the activity",
    limitation: "Requires clinician approval for balance or mobility limitations, falls, recent surgery, serious conditions, or activity restrictions. Use support already recommended by the care team.",
    sourceLabel: "WHO physical activity guidance",
    sourceUrl: whoActivity,
  },
  {
    id: "balanced-meal",
    category: "nutrition",
    title: "Explore balanced-meal education",
    why: (stage) => stage === "infant" ? "Infant feeding needs individual pediatric guidance; use the profile's child-care feeding log instead." : "WHO describes healthy diets as varied and built around a range of foods; individual needs and restrictions still apply.",
    ageGroup: (stage) => stage === "infant" ? "Not a meal recommendation for infants" : stage === "child" ? "Children · caregiver guided" : stage === "adolescent" ? "Adolescents" : stage === "senior" ? "Older adults" : "Adults",
    limitation: "This is general education, not a meal prescription. Follow clinician-directed diets. Check every ingredient against recorded allergies and personal dietary restrictions; no food is automatically declared safe by this app.",
    sourceLabel: "WHO healthy diet guidance",
    sourceUrl: whoDiet,
  },
  {
    id: "meal-observation",
    category: "nutrition",
    title: "Keep a simple meal or snack log",
    why: () => "A dated, user-entered record can help someone remember what they chose to share with their care team.",
    ageGroup: () => "All life stages · caregiver may record for a child",
    limitation: "Avoid entering sensitive details. The log does not assess nutrition, allergy risk, or food-related symptoms. Follow the patient's care plan.",
    sourceLabel: "WHO healthy diet guidance",
    sourceUrl: whoDiet,
  },
  {
    id: "steady-sleep-routine",
    category: "habit",
    title: "Choose a steady wind-down reminder",
    why: () => "A personal reminder can make it easier to keep a routine that already works for the individual.",
    ageGroup: () => "All life stages · caregiver support where appropriate",
    limitation: "This is a routine prompt, not sleep treatment. Follow clinician guidance for sleep concerns and use emergency services for urgent symptoms.",
    sourceLabel: "Personal routine prompt",
    sourceUrl: "",
  },
  {
    id: "hydration-observation",
    category: "habit",
    title: "Record a drink or hydration observation",
    why: () => "Logging what was offered or consumed can support an accurate care conversation without setting a target.",
    ageGroup: () => "All life stages · caregiver may record for a child",
    limitation: "No fluid target is provided. Follow clinician-directed fluid limits or plans, especially when a medical condition affects fluid intake.",
    sourceLabel: "Patient-entered log",
    sourceUrl: "",
  },
];

export const wellnessCategoryLabels: Record<WellnessCategory, string> = {
  exercise: "Exercise",
  nutrition: "Food & nutrition",
  habit: "Habits & lifestyle",
};
