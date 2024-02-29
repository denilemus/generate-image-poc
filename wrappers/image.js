const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const {
  MODELS,
  CONTEXTUAL_SECTIONS,
  LITERAL_SECTIONS,
  getRandomItem,
} = require("../utils");

class ImageWrapper {
  constructor({ apiUrl, apiKey }) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
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

    for (const { model, name } of MODELS) {
      const chain = imagePrompt.pipe(model).pipe(new StringOutputParser());

      const combinedChain = RunnableSequence.from([
        {
          imageDescription: chain,
          naughtyWords: (input) => input.naughtyWords,
        },
        cleanPrompt,
        model,
        new StringOutputParser(),
      ]);

      try {
        const result = await combinedChain.invoke({
          seedText: seed,
          profession,
          naughtyWords: this.naughtyWords,
        });

        console.log(`${name}: ${result}`);
        return result;
      } catch (error) {
        console.error(`${name} failed! Trying next model...`);
      }
    }

    return null;
  }
}

module.exports = ImageWrapper;
