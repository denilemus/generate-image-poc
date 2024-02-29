const axios = require("axios");
const ImageWrapper = require("./image");

class DalleWrapper extends ImageWrapper {
  constructor({ apiUrl, apiKey }) {
    super({ apiUrl, apiKey });
  }

  async imagine({ prompt, size = "1024x1024" }) {
    console.log("imagine...");

    const options = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      data: {
        model: "dall-e-3",
        n: 1,
        prompt: prompt,
        size,
      },
      url: `${this.apiUrl}/generations`,
      method: "post",
    };

    try {
      const response = await axios(options);
      return response.data.data[0].url;;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}

module.exports = DalleWrapper;
