const cheerio = require("cheerio");
const axios = require("axios");

const html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <img src="data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUA
    AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO
        9TXL0Y4OHwAAAABJRU5ErkJggg==" alt="Red dot" />
    <p>Text</p>
    <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png">
</body>

</html>
`;

const downloadAttachmentFile = async (fileUrl) => {
  try {
    const res = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    return {
      data: res.data,
      contentType: res.headers["content-type"],
    };
  } catch (err) {
    console.log(err, {
      package: "send-email",
      module: "Consumer",
      action: "getAttachmentDownload",
    });
    throw err;
  }
};

const handleBase64Attachments = (src) => {
  const [header, encoded] = src.split(";base64,");
  const contentType = header.replace("data:", "");
  const content = Buffer.from(encoded, "base64");
  return { content, contentType };
};

const handleLinkAttachments = async (fileUrl) => {
  return downloadAttachmentFile(fileUrl);
};

(async () => {
  const $ = cheerio.load(html);

  let attachmentsSrc = [];
  $("img").each(async function () {
    const src = $(this).attr("src");
    console.log({ src });
    attachmentsSrc.push(src);
  });

  console.log({ attachmentsSrc });

  const attachments = await Promise.all(
    attachmentsSrc.map(async (src) => {
      const attachment = src.includes(";base64,")
        ? handleBase64Attachments(src)
        : await handleLinkAttachments(src);

      console.log({ attachment });

      return attachment;
    })
  );

  $("img").remove();

  console.log($.html());

  console.log({ attachments });
})();
