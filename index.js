const express = require("express");
const { ChatOpenAI } = require("@langchain/openai");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { MODELS } = require("./utils");

const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");

const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { Document } = require("@langchain/core/documents");
const {
  createStuffDocumentsChain,
} = require("langchain/chains/combine_documents");

const { JsonOutputParser } = require("@langchain/core/output_parsers");

const { BufferMemory } = require("langchain/memory");
const { MessagesPlaceholder } = require("@langchain/core/prompts");

const { PipelinePromptTemplate } = require("@langchain/core/prompts");

const ImageWrapper = require("./wrappers/image");
const MidjourneyWrapper = require("./wrappers/midjourney");
const DalleWrapper = require("./wrappers/dalle");

const app = express();
const port = 3000;

// ■■■■■■■ FUNCTIONS ■■■■■■■

const tryOpenAi = async (prompt) => {
  try {
    const openAi = new ChatOpenAI({
      modelName: "gpt-4-vision-preview",
      maxTokens: 250,
      openAIApiKey: process.env.OPEN_AI_KEY,
    });

    const response = await openAi.invoke(prompt);
    return response;
  } catch (error) {
    console.error("❌ Error: OpenAI:", error);
    return null;
  }
};

const tryGoogleAi = async (prompt) => {
  try {
    const googleAi = new ChatGoogleGenerativeAI({
      modelName: "gemini-pro",
      maxOutputTokens: 2048,
      apiKey: process.env.GOOGLE_AI_KEY,
    });

    const response = await googleAi.invoke(prompt);
    return response;
  } catch (error) {
    console.error("❌ Error: GoogleAI:", error);
    return null;
  }
};

async function invokeAI(prompt) {
  let response = await tryOpenAi(prompt);

  if (!response) {
    response = await tryGoogleAi(prompt);
  }

  return response;
}

// ■■■■■■■ SERVER ■■■■■■■

app.listen(port, () => {
  console.log(`Running on port ${port}...`);
});

// ■■■■■■■ ENDPOINTS ■■■■■■■

app.get("/chains", async (req, res) => {
  const imageDescriptionPrompt = PromptTemplate.fromTemplate(
    "Turn this text {seedText} into an stock image description that will be used as an asset for a {profession} trade professional website. Only return the generated description"
  );
  const cleanDescriptionPrompt = PromptTemplate.fromTemplate(
    `Remove the following words {naughtyWords} form the {imageDescription} and replace them with a synonym word that is not in the list. If not any words on the list were found, simply return the original prompt`
  );

  for (const { model, name } of MODELS) {
    const chain = imageDescriptionPrompt
      .pipe(model)
      .pipe(new StringOutputParser());
    const combinedChain = RunnableSequence.from([
      {
        imageDescription: chain,
        naughtyWords: (input) => input.naughtyWords,
      },
      cleanDescriptionPrompt,
      model,
      new StringOutputParser(),
    ]);

    try {
      const result = await combinedChain.invoke({
        seedText: "A man working on a roof",
        profession: "Electrician",
        naughtyWords: "[electrician, roof, helmet]",
      });

      console.log(`- ${name}: ${result}`);
      break;
    } catch (error) {
      console.error(`Error with ${name} model. Trying next model...`);
    }
  }
});

app.get("/docs", async (req, res) => {
  const CALL_SCRIPT = `
    Agent: Good morning/afternoon, may I sp
    eak with John Doe?
    Client: Speaking, how can I help you?
    Agent: Hi John, this is Tony Trades calling from trade.org. I hope you're doing well today.
    Client: Yes, thank you. What is this regarding?
    Agent: I'm reaching out because we offer a specialized website platform for trade professionals like yourself, and I'd like to learn more about your business to see if our services would be a good fit for you. Do you have a few minutes to chat?
    Client: Sure, go ahead.
    Agent: Great, thank you. To start, could you tell me a bit about your business? What's the name of your company and what type of services do you provide?
    Client: Of course. My company is called J&D Plumbing Co, and we specialize in residential and commercial plumbing services.
    Agent: Excellent, thank you. And how long have you been in business?
    Client: We've been operating for 7 years.
    Agent: That's impressive. Could you tell me about some of the projects your company has completed recently?
    Client: "Sure, we've recently completed projects such as bathroom remodels, pipe installations, and water heater replacements.
    Agent: Thank you. How many staff members do you currently have?
    Client: We have a team of 10 staff members, including licensed technicians and administrative staff.
    Agent: Got it. And do you hold any specific certifications or memberships related to your industry?
    Client: Yes, we're certified in plumbing licenses, safety certifications, and various plumbing techniques.
    Agent: Perfect. Lastly, could you tell me a bit about your goals or challenges in terms of online presence or marketing for your business?
    Client: Well, we're always looking to expand our customer base and increase our visibility online.
    Agent: I see. Our platform offers features that can help with that, such as online booking, portfolio showcase, and customer review management. Based on what you've shared, I think our services could be beneficial for your business. Would you be interested in scheduling a demo to see how our platform works?
    Client: Yes, that sounds interesting. Can you provide more details about the demo?
    Agent: Absolutely, I can walk you through our platform and demonstrate how it can streamline your online presence and help grow your business. How does [suggest a date and time for the demo] sound for you?
    Client: That works for me.
    Agent: Perfect, I'll send you a calendar invite with all the details. Thank you for your time, John. I look forward to speaking with you again during the demo.
    Client: Thank you, looking forward to it as well. Goodbye.
    Agent: Goodbye, have a great day.
  `;
  const QUESTIONS = [
    "Generate a text that could be put in a 'About' section for a website for that business",
    "Generate a text that could be put in a 'Projects' section for a website for that business",
  ];

  const prompt = ChatPromptTemplate.fromTemplate(`
    Answer the following question based only on the provided context:

    <context>
      {context}
    </context>

    Question: {input}
  `);
  const conversationContext = new Document({
    pageContent: CALL_SCRIPT,
  });

  for (const { model, name } of MODELS) {
    const chain = await createStuffDocumentsChain({
      llm: model,
      prompt,
    });

    try {
      for (const question of QUESTIONS) {
        const result = await chain.invoke({
          input: question,
          context: [conversationContext],
        });

        console.log(`${name}:\n${result}`);
        console.log();
      }
      break;
    } catch (error) {
      console.error(`Error with ${name} model. Trying next model...`);
    }
  }
});

app.get("/stream", async (req, res) => {
  for (const { model, name } of MODELS) {
    const promptTemplate = PromptTemplate.fromTemplate(
      "Generate text content for a section '{section}' in a trade professional {profession}'s website"
    );

    const chain = promptTemplate.pipe(model);

    try {
      const stream = await chain.stream({
        section: "About",
        profession: "plumber",
      });

      console.log(`- ${name}:`);
      for await (const chunk of stream) {
        console.log(chunk?.content);
      }
      break;
    } catch (error) {
      console.error(`Error with ${name} model. Trying next model...`);
    }
  }
});

app.get("/batches", async (req, res) => {
  for (const { model, name } of MODELS) {
    const promptTemplate = PromptTemplate.fromTemplate(
      "Generate text content for a section '{section}' in a trade professional {profession}'s website"
    );

    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

    try {
      const result = await chain.batch([
        { section: "About", profession: "electrician" },
        { section: "Contact", profession: "electrician" },
      ]);
      console.log(`${name}:\n${result}`);
      break;
    } catch (error) {
      console.error(`Error with ${name} model. Trying next model...`);
    }
  }
});

app.get("/json", async (req, res) => {
  for (const { model, name } of MODELS) {
    const chain = model.pipe(new JsonOutputParser());
    try {
      const stream = await chain.stream(
        `Output a list of the professions roofer, welder and gardener and a list of common projects they work on in JSON format. 
        Use a dict with an outer key of "professions_projects" which contains a list of professions.
        Each profession should have the key "profession" and "projects"`
      );
      console.log(`- ${name}:`);
      for await (const chunk of stream) {
        console.log(chunk);
      }
      break;
    } catch (error) {
      console.error(`Error with ${name} model. Trying next model...`);
    }
  }
});

app.get("/events", async (req, res) => {
  for (const { model, name } of MODELS) {
    try {
      const eventStream = await model.streamEvents("hello", { version: "v1" });

      console.log(`- ${name}:`);
      for await (const event of eventStream) {
        console.log(event);
      }
      break;
    } catch (error) {
      console.error(`Error with ${name} model. Trying next model...`);
    }
  }
});

app.get("/memory", async (req, res) => {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a helpful assistant that returns different variations of a specific color",
    ],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  const memory = new BufferMemory({
    returnMessages: true,
  });

  console.log(await memory.loadMemoryVariables({}));

  for (const { model, name } of MODELS) {
    try {
      const chain = RunnableSequence.from([
        {
          input: (initialInput) => initialInput.input,
          memory: () => memory.loadMemoryVariables({}),
        },
        {
          input: (previousOutput) => previousOutput.input,
          history: (previousOutput) => previousOutput.memory.history,
        },
        prompt,
        model,
      ]);

      const inputs = {
        input: "Do color blue",
      };

      const response = await chain.invoke(inputs);
      console.log(response);

      await memory.saveContext(inputs, {
        output: response.content,
      });

      console.log(await memory.loadMemoryVariables({}));

      const inputs2 = {
        input: "What is the main color?",
      };

      const response2 = await chain.invoke(inputs2);
      console.log(response2);
      break;
    } catch (error) {
      console.error(`Error with ${name} model. Trying next model...`);
    }
  }
});

app.get("/composed", async (req, res) => {
  const fullPrompt = PromptTemplate.fromTemplate(`
    {introduction}
    {example}
    {start}
  `);

  const introductionPrompt = PromptTemplate.fromTemplate(
    `You generate descriptions for stock images for trades professional {profession}'s wesbites from seeds of text`
  );

  const examplePrompt = PromptTemplate.fromTemplate(`
    Here's an example of a seed and the generated stock image description:
    Seed: {exampleSeed}
    Description: {exampleDesc}
  `);

  const startPrompt = PromptTemplate.fromTemplate(`
    Now, generate a description for this seed
    Seed: {input}
    Description:
  `);

  const composedPrompt = new PipelinePromptTemplate({
    pipelinePrompts: [
      {
        name: "introduction",
        prompt: introductionPrompt,
      },
      {
        name: "example",
        prompt: examplePrompt,
      },
      {
        name: "start",
        prompt: startPrompt,
      },
    ],
    finalPrompt: fullPrompt,
  });

  const formattedPrompt = await composedPrompt.format({
    profession: "Carpenter",
    exampleSeed: "Building fences",
    exampleDesc:
      "A carpenter building a fence in a sunny day, color green predominates",
    input: "Building kitchen cabinets",
  });

  console.log(formattedPrompt);
});

app.get("/generateImage", async (req, res) => {
  const DATA = [
    {
      seed: "Beth's Electrician Services",
      profession: "electrician",
      section: "headerSection",
    },
    {
      seed: "",
      profession: "electrician",
      section: "aboutUsSection",
    },
    {
      seed: "",
      profession: "electrician",
      section: "heroSection",
    },
    {
      seed: "Beth Hernandez",
      profession: "electrician",
      section: "ourTeamSection",
    },
    {
      seed: "Safety inspections",
      profession: "electrician",
      section: "highlightedServicesSection",
    },
  ];

  const prompt = await ImageWrapper.prompt({
    seed: "",
    profession: "mason",
    section: "headerSection",
  });

  const dalleModel = new DalleWrapper({
    apiUrl: "https://api.openai.com/v1/images",
    apiKey: process.env.OPEN_AI_KEY,
  });

  const midjourneyModelWithFallback = new MidjourneyWrapper({
    apiUrl: "https://api.midjourneyapi.xyz/mj/v2",
    apiKey: process.env.GO_API_KEY,
    webhookUrl: "",
    fallbacks: [dalleModel],
  });

  midjourneyModelWithFallback.imagine({ prompt });
});
