const ViberBot = require("viber-bot").Bot;
const BotEvents = require("viber-bot").Events;
const TextMessage = require("viber-bot").Message.Text;
const winston = require("winston");
const toYAML = require("winston-console-formatter");
var request = require("request");

function createLogger() {
  const logger = new winston.Logger({
    level: "debug", // We recommend using the debug level for development
  });

  logger.add(winston.transports.Console, toYAML.config());
  return logger;
}

const logger = createLogger();

// Creating the bot with access token, name and avatar
const bot = new ViberBot(logger, {
  authToken: "4c1ca1ddf2e7d202-1822fb6126208aab-235cf9c48328f72a", // <--- Paste your token here
  name: "Is It Up", // <--- Your bot name here
  avatar: "http://api.adorable.io/avatar/200/isitup", // It is recommended to be 720x720, and no more than 100kb.
});

if (process.env.NOW_URL || process.env.HEROKU_URL) {
  const http = require("http");
  const port = process.env.PORT || 8080;

  http
    .createServer(bot.middleware())
    .listen(port, () =>
      bot.setWebhook(process.env.NOW_URL || process.env.HEROKU_URL)
    );
} else {
  logger.debug(
    "Could not find the now.sh/Heroku environment variables. Please make sure you followed readme guide."
  );
}

function say(response, message) {
  response.send(new TextMessage(message));
}

bot.onSubscribe((response) => {
  say(
    response,
    `Hi there ${response.userProfile.name}. I am ${bot.name}! Feel free to ask me if a web site is down for everyone or just you. Just send me a name of a website and I'll do the rest!`
  );
});

function checkUrlAvailability(botResponse, urlToCheck) {
  if (urlToCheck === "") {
    say(botResponse, "I need a URL to check");
    return;
  }

  say(botResponse, "One second...Let me check!");

  var url = urlToCheck.replace(/^http:\/\//, "");
  request("http://isup.me/" + url, function (error, requestResponse, body) {
    if (error || requestResponse.statusCode !== 200) {
      say(botResponse, "Something is wrong with isup.me.");
      return;
    }

    if (!error && requestResponse.statusCode === 200) {
      if (body.search("is up") !== -1) {
        say(botResponse, "Hooray! " + urlToCheck + ". looks good to me.");
      } else if (body.search("Huh") !== -1) {
        say(
          botResponse,
          "Hmmmmm " +
            urlToCheck +
            ". does not look like a website to me. Typo? please follow the format `test.com`"
        );
      } else if (body.search("down from here") !== -1) {
        say(botResponse, "Oh no! " + urlToCheck + ". is broken.");
      } else {
        say(botResponse, "Snap...Something is wrong with isup.me.");
      }
    }
  });
}

bot.onTextMessage(/./, (message, response) => {
    checkUrlAvailability(response, message.text);
}
