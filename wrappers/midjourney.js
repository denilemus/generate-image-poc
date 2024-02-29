const axios = require("axios");
const ImageWrapper = require("./image");

class MidjourneyWrapper extends ImageWrapper {
  constructor({
    apiUrl,
    apiKey,
    webhookUrl,
    processMode = "fast",
    fallbacks = [],
  }) {
    super({ apiUrl, apiKey });
    this.webhookUrl = webhookUrl;
    this.processMode = processMode;
    this.fallbacks = fallbacks;
  }

  async imagine({ prompt, aspectRatio = "1:1" }) {
    console.log("imagine...");

    const options = {
      headers: {
        "X-API-KEY": this.apiKey,
      },
      data: {
        prompt,
        aspect_ratio: aspectRatio,
        process_mode: this.processMode,
        webhook_endpoint: this.webhookUrl,
      },
      url: `${this.apiUrl}/imagine`,
      method: "post",
    };

    try {
      const response = await axios(options);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(error);

      for (const fallback of this.fallbacks) {
        try {
          return fallback.imagine({ prompt });
        } catch (error) {
          console.log(error);
        }
      }

      return null;
    }
  }

  async upscale({ taskId, index }) {
    console.log("upscale...");

    const options = {
      headers: {
        "X-API-KEY": this.apiKey,
      },
      data: {
        origin_task_id: taskId,
        index,
        webhook_endpoint: this.webhookUrl,
      },
      url: `${this.apiUrl}/upscale`,
      method: "post",
    };

    try {
      const response = await axios(options);
      return response.data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = MidjourneyWrapper;
