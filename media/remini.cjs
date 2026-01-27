const FormData = require("form-data");

async function remini(imageBuffer, mode) {
  return new Promise(async (resolve, reject) => {
    let availableModes = ["enhance", "recolor", "dehaze"];
    
    // Ensure mode is valid
    if (!availableModes.includes(mode)) {
      mode = "enhance"; // Default to 'enhance'
    }

    let formData = new FormData();
    let apiUrl = `https://inferenceengine.vyro.ai/${mode}`;

    formData.append("model_version", 1, {
      'Content-Transfer-Encoding': "binary",
      'contentType': "multipart/form-data; charset=utf-8"
    });

    formData.append("image", Buffer.from(imageBuffer), {
      'filename': "enhance_image_body.jpg",
      'contentType': "image/jpeg"
    });

    formData.submit({
      'url': apiUrl,
      'host': "inferenceengine.vyro.ai",
      'path': `/${mode}`,
      'protocol': "https:",
      'headers': {
        'User-Agent': 'okhttp/4.9.3',
        'Connection': "Keep-Alive",
        'Accept-Encoding': "gzip"
      }
    }, function (error, response) {
      if (error) {
        return reject(error);
      }

      let responseData = [];
      
      response.on("data", (chunk) => {
        responseData.push(chunk);
      });

      response.on("end", () => {
        resolve(Buffer.concat(responseData));
      });

      response.on("error", (err) => {
        reject(err);
      });
    });
  });
}

module.exports.remini = remini;
