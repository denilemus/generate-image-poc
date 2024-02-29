const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const {
  CONTEXTUAL_SECTIONS,
  LITERAL_SECTIONS,
  getRandomItem,
} = require("../utils");
const { ChatOpenAI } = require("@langchain/openai");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

class ImageWrapper {
  constructor({ apiUrl, apiKey }) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.naughtyWords = ["white, high-resolution"];
  }

  static async prompt({ seed, profession, section }) {
    console.log("prompt...");
    let imagePrompt;

    if (CONTEXTUAL_SECTIONS.hasOwnProperty(section)) {
      imagePrompt = PromptTemplate.fromTemplate(
        getRandomItem(CONTEXTUAL_SECTIONS[section])
      );
    } else if (LITERAL_SECTIONS.hasOwnProperty(section)) {
      imagePrompt = PromptTemplate.fromTemplate(
        getRandomItem(LITERAL_SECTIONS[section])
      );
    } else {
      imagePrompt = PromptTemplate.fromTemplate(
        "Turn this text '{seedText}' into an stock image description that will be used as an asset for a {profession} trade professional website. Only return the generated description."
      );
    }

    const cleanPrompt = PromptTemplate.fromTemplate(
      "Remove all the instances of the following words {naughtyWords} found in {imageDescription} and replace them with a synonym word that is not in the list. If not any words, simply return the original prompt."
    );

    const openAi = new ChatOpenAI({
      modelName: "gpt-4-vision-preview",
      maxTokens: 250,
      openAIApiKey: process.env.OPEN_AI_KEY,
    });

    const googleAi = new ChatGoogleGenerativeAI({
      modelName: "gemini-pro",
      maxOutputTokens: 2048,
      apiKey: process.env.GOOGLE_AI_KEY,
    });

    const openAiWithFallback = openAi.withFallbacks({
      fallbacks: [googleAi],
    });

    const chain = imagePrompt
      .pipe(openAiWithFallback)
      .pipe(new StringOutputParser());
    const combinedChain = RunnableSequence.from([
      {
        imageDescription: chain,
        naughtyWords: (input) => input.naughtyWords,
      },
      cleanPrompt,
      openAiWithFallback,
      new StringOutputParser(),
    ]);

    const result = await combinedChain.invoke({
      seedText: seed,
      profession,
      naughtyWords: this.naughtyWords,
    });

    console.log(result);
    return result;
  }
}

module.exports = ImageWrapper;
