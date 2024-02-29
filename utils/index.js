const { ChatOpenAI } = require("@langchain/openai");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

const MODELS = [
  {
    model: new ChatOpenAI({
      modelName: "gpt-4-vision-preview",
      maxTokens: 250,
      openAIApiKey: process.env.OPEN_AI_KEY
    }),
    name: "🟢OpenAI",
  },
  {
    model: new ChatGoogleGenerativeAI({
      modelName: "gemini-pro",
      maxOutputTokens: 2048,
      apiKey: process.env.GOOGLE_AI_KEY,
    }),
    name: "🔵GoogleAI",
  },
];

const SECTIONS = [
  "aboutUsSection",
  "ctaSection",
  "faqsSection",
  "footerSection",
  "guaranteeSection",
  "headerSection",
  "heroSection",
  "highlightedFeaturesSection",
  "highlightedServicesSection",
  "ourTeamSection",
  "ourWorkSection",
  "ourProcessSection",
  "qualificationsSection",
  "requestQuoteSection",
  "serviceAreaSection",
  "testimonialsSection",
  "tradeCategoriesSection",
];

const CONTEXTUAL_SECTIONS = {
  aboutUsSection: [
    "Return a stock image description of a {profession} trade professional working on a common task of their profession. Only return the generated description.",
    "Return a stock image description of a {profession} trade professional's completed project. Only return the generated description.",
  ],
  guaranteeSection: [
    "Return the name of a material commonly used by {profession} trade professionals. Only return the generated material",
    "Return the name of a tool commonly used by {profession} trade professionals. Only return the generated tool",
  ],
  faqsSection: [
    "Return a stock image description of a {profession} trade professional engaging in a discussion with a client. Only return the generated description.",
    "Return a stock image description of a {profession} trade professional demonstrating the functionality of a project to a client. Only return the generated description.",
  ],
  heroSection: [
    "Return a stock image description of a {profession} trade professional in action. Only return the generated image description.",
    "Return a stock image description of a {profession} trade professional striking a pose. Only return the generated image description.",
  ],
  highlightedFeaturesSection: [
    "Return a stock image description of a {profession} trade professional delivering a finished project to a client. Only return the generated description.",
    "Return a stock image description of a {profession} trade professional delivering a finished project to a client. Only return the generated description.",
  ],
};

const LITERAL_SECTIONS = {
  headerSection: [
    "Return a logo description for a {profession} trade professional business named {seedText}. Only return the generated description.",
  ],
  footerSection: [
    "Return a logo description for a {profession} trade professional business named {seedText}. Only return the generated description.",
  ],
  ourTeamSection: [
    "Return a stock image description of a professional photography headshot of a person named {seedText}. Only return the generated description.",
  ],
  testimonialsSection: [
    "Return a stock image description of a professional photography headshot of a person named {seedText}. Only return the generated description.",
  ],
};

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
  MODELS,
  SECTIONS,
  CONTEXTUAL_SECTIONS,
  LITERAL_SECTIONS,
  getRandomItem,
};
