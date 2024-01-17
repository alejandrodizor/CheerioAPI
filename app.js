const express = require("express");
const basicAuth = require('express-basic-auth');
const bodyParser = require("body-parser");
const cheerio = require("cheerio");
const request = require("request");

let app = express();
app.use(bodyParser.text({ 
    type: 'text/html',
    limit: '50mb'
}));

const users = {
    'mauro': 'vsk745jsfpGW46Lm'
};

app.use(basicAuth({
    users: users,
    challenge: true
}));

let json;

// Function to extract various elements from a webpage using Cheerio
function extract(input) {
  // Load the input HTML into Cheerio
  let $ = cheerio.load(input);

  // Extract the template title using the <h1> tag
  const title = $("h1").text().trim();

  // Extract the template author's name from the specified class
  const author = $(".template-designer-name").text().trim();

  // Extract the author's link, using the class and retrieving the href attribute
  const authorLink = $(".template-designer-link.w-inline-block")
    .attr("href")
    .trim();

  // Extract the list of tags, where each tag is within a <div> inside the anchor tag <a> which is inside divs with the class .w-dyn-item inside the element with id #hero-tag-list
  // The tags are concatenated into a single string, separated by commas
  const tagList = $("#hero-tag-list .w-dyn-item a")
    .map((i, el) => $(el).find("div").first().text().trim())
    .get()
    .join(", ");

  // Extract the long description using the specified class
  const longDescription = $(".templates_rtf.w-richtext").text().trim();

  // Extract the template price from the specified class
  // and use a regular expression to extract the price in the format $XXX USD
  const rawPriceText = $(".button_buy-price").text();
  const priceRegex = /$\d+\sUSD/;
  const priceMatch = rawPriceText.match(priceRegex);
  const price = priceMatch ? priceMatch[0] : "Price not found";

  // Extract the URL of the template preview, using the id and retrieving the href attribute
  const previewLink = $("#hero-browser-preview").attr("href").trim();

  // Extract the URL of the read-only link, using the id and retrieving the href attribute
  const readOnlyLink = $("#hero-designer-preview").attr("href").trim();

  // Extract the image source URLs, where each image is within a specific class structure
  // The src attributes are concatenated into a single string, separated by commas
  const images = $(".owl-slider_item.w-dyn-item.w-dyn-repeater-item > img")
    .map((i, el) => $(el).attr("src").trim())
    .get()
    .join(", ");

  // Return an object containing all the extracted values
  return {
    title,
    author,
    authorLink,
    tagList,
    longDescription,
    price,
    previewLink,
    readOnlyLink,
    images,
  };
}

app.get("/extract", function (req, res) {
  // allow access from other domains
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");

  if (req.query.url) {
    request(
      {
        method: "GET",
        url: req.query.url,
      },
      function (err, response, body, callback) {
        if (err) return console.error(err);

        json = extract(body);
      }
    );
  } else {
    const html = req.body;
    if (!html) {
      res.send("No URL or HTML provided");
      return;
    }
    json = extract(html);
  }

  res.send(JSON.stringify(json));
});

let port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("listening on port " + port);
});
