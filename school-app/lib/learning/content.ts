import type { Lesson, TodayPlan } from "./types";

export const LESSON_ID = "greener-career-fair-001";

export const lesson: Lesson = {
  id: LESSON_ID,
  title: "A Greener Career Fair",
  description: "Read a practical campus story, notice three useful words, hear them in a new conversation, and use them yourself.",
  level: "B2",
  duration: "12–15 min",
  articleTitle: "Small choices, shared impact",
  articleParagraphs: [
    "The student committee had one month to organize a career fair for six hundred visitors. Its original plan relied on printed maps, disposable name badges, and individual water bottles. Those choices seemed convenient, but they also created a trade-off: the team could save preparation time, or it could reduce the event’s environmental impact.",
    "After reading public guidance on greener meetings, the committee reconsidered its priorities. Digital maps could replace most handouts. Reusable badges could be collected at the exit, and water stations could replace hundreds of bottles. The organizers decided to prioritize the changes that were easy for visitors to understand and simple for volunteers to manage.",
    "The committee also involved every major stakeholder. Employers needed clear instructions before the event. Campus staff needed accurate attendance numbers to plan food and recycling. Students needed to know where to refill bottles and return badges. Listening to these different groups revealed practical problems that the planning team had missed.",
    "The final plan was not perfect. A small number of printed maps remained available for accessibility and emergencies. However, the committee made its reasoning visible and measured what happened. That turned sustainability from a slogan into a series of choices that the team could explain, test, and improve next year."
  ],
  sourceLabel: "U.S. EPA · Green Meetings",
  sourceUrl: "https://www.epa.gov/p2/green-meetings",
  sourceNote: "This is an original learning article informed by the EPA’s public guidance on greener meetings. It is not a copy of the source page.",
  vocabulary: [
    {
      id: "trade-off",
      term: "trade-off",
      definition: "a situation in which gaining one benefit means accepting a disadvantage elsewhere",
      chineseMeaning: "权衡；取舍",
      example: "There is a trade-off between a larger venue and a shorter commute.",
      cloze: "The team discussed the ______ between convenience and waste reduction.",
      clozeAnswer: "trade-off",
      meaningChoices: ["a balance between competing benefits", "a list of people attending", "a final deadline"],
      meaningAnswer: 0,
      targetDimensions: ["meaningRecognition", "readingRecognition", "listeningRecognition", "activeRecall", "speakingProduction", "writingProduction"]
    },
    {
      id: "prioritize",
      term: "prioritize",
      definition: "to decide which task or goal is more important and should be handled first",
      chineseMeaning: "优先处理；确定优先级",
      example: "We should prioritize the changes that help the largest number of visitors.",
      cloze: "With one week left, we need to ______ the most important tasks.",
      clozeAnswer: "prioritize",
      meaningChoices: ["to delay every decision", "to decide what matters first", "to invite more people"],
      meaningAnswer: 1,
      targetDimensions: ["meaningRecognition", "readingRecognition", "listeningRecognition", "activeRecall", "speakingProduction", "writingProduction"]
    },
    {
      id: "stakeholder",
      term: "stakeholder",
      definition: "a person or group affected by, interested in, or able to influence a decision",
      chineseMeaning: "利益相关者；相关方",
      example: "Each stakeholder saw a different risk in the event plan.",
      cloze: "The facilities team is an important ______ because it manages the venue.",
      clozeAnswer: "stakeholder",
      meaningChoices: ["a person affected by a decision", "a reusable container", "a written schedule"],
      meaningAnswer: 0,
      targetDimensions: ["meaningRecognition", "readingRecognition", "listeningRecognition", "activeRecall", "speakingProduction", "writingProduction"]
    }
  ],
  transcript: [
    { id: "s1", speaker: "Maya", audioSrc: "/audio/segment-1.wav", text: "We have two weeks before the career fair, and the budget is tighter than we expected." },
    { id: "s2", speaker: "Daniel", audioSrc: "/audio/segment-2.wav", text: "Then we need to prioritize. Which decision will make the biggest difference for students?" },
    { id: "s3", speaker: "Maya", audioSrc: "/audio/segment-3.wav", text: "I would replace printed guides with a mobile schedule, but that creates a trade-off for visitors who need paper." },
    { id: "s4", speaker: "Daniel", audioSrc: "/audio/segment-4.wav", text: "We can keep a small number of printed copies at the welcome desk instead of giving one to everyone." },
    { id: "s5", speaker: "Maya", audioSrc: "/audio/segment-5.wav", text: "Good. We should also ask each stakeholder what could go wrong before we announce the plan." },
    { id: "s6", speaker: "Daniel", audioSrc: "/audio/segment-6.wav", text: "The employers may care about clear directions, while campus staff will probably focus on waste and access." },
    { id: "s7", speaker: "Maya", audioSrc: "/audio/segment-7.wav", text: "Let us send them three specific questions today and prioritize the problems that appear more than once." },
    { id: "s8", speaker: "Daniel", audioSrc: "/audio/segment-8.wav", text: "That sounds realistic. We are not choosing between a perfect event and a bad one; we are making the best trade-off with the information we have." }
  ]
};

export const todayPlan: TodayPlan = {
  lessonId: LESSON_ID,
  title: lesson.title,
  minutes: 15,
  stages: [
    { label: "Understand", detail: "Read and listen" },
    { label: "Activate", detail: "Recall three expressions" },
    { label: "Use", detail: "Speak and write" }
  ]
};

export const readingQuestions = [
  { id: "r1", prompt: "Why did the committee keep a few printed maps?", options: ["Employers requested souvenirs.", "They were useful for accessibility and emergencies.", "Digital maps were more expensive."], answer: 1, explanation: "The final paragraph gives accessibility and emergencies as the reason." },
  { id: "r2", prompt: "What did involving stakeholders help the team discover?", options: ["Practical problems the team had missed.", "A way to avoid measuring results.", "A larger event budget."], answer: 0, explanation: "Different groups revealed practical issues from their own perspectives." },
  { id: "r3", prompt: "What is the article’s main message?", options: ["A sustainable event must eliminate all paper.", "Visible, testable choices can make an event more sustainable.", "Only campus staff should make event decisions."], answer: 1, explanation: "The article emphasizes explainable priorities, stakeholder input, measurement, and improvement." }
];

export const listeningQuestions = [
  { id: "l1", prompt: "What solution do Maya and Daniel choose for printed guides?", options: ["Print one for every visitor.", "Cancel the mobile schedule.", "Keep a small number at the welcome desk."], answer: 2, explanation: "They keep limited paper copies while using a mobile schedule for most visitors." },
  { id: "l2", prompt: "Why do they contact stakeholders?", options: ["To identify risks before announcing the plan.", "To ask for more money.", "To reduce the number of employers."], answer: 0, explanation: "Maya suggests asking what could go wrong before the plan is announced." },
  { id: "l3", prompt: "How will they prioritize problems?", options: ["By choosing the cheapest idea.", "By focusing on issues mentioned more than once.", "By asking students only."], answer: 1, explanation: "Repeated problems become the priority." }
];

export const dictationSegmentIds = ["s3", "s5"];

export const speakingPrompt = "Maya asks: We cannot change everything before the event. What should we prioritize, and what trade-off would you accept?";
export const writingPrompt = "Write 90–140 words recommending one improvement for the career fair. Explain the trade-off, identify at least one stakeholder, and state what the team should prioritize.";
