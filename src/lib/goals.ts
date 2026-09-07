export type PredefinedGoal = { label: string; goal: string; icon: "chart" | "rocket" | "scale" | "pen" | "plane" | "code" };

export const PREDEFINED_GOALS: PredefinedGoal[] = [
  {
    label: "Market report",
    icon: "chart",
    goal: "Write a short market report on electric scooters in India: market size, top players, customer segments, and risks.",
  },
  {
    label: "Product launch plan",
    icon: "rocket",
    goal: "Plan the launch of a mobile banking app for students: target audience, key features, marketing channels, and a 90-day timeline.",
  },
  {
    label: "Competitor analysis",
    icon: "scale",
    goal: "Compare three leading project management tools for a 50-person software company: pricing, strengths, weaknesses, and a recommendation.",
  },
  {
    label: "Blog post",
    icon: "pen",
    goal: "Write a 600-word blog post on how small businesses can use AI in 2026, with real examples and a practical checklist.",
  },
  {
    label: "Travel itinerary",
    icon: "plane",
    goal: "Create a 3-day trip plan for Jaipur for a family of four: sights, food, budget, and travel tips.",
  },
  {
    label: "Code review brief",
    icon: "code",
    goal: "Review a proposal to move a monolith Node.js app to microservices: benefits, risks, migration steps, and team impact.",
  },
];
