const WINNING_SCORE = 5;

/* eslint-disable id-length*/
const WEAPONS = {
  r: {
    name: "Rock",
    beats: ["s"]
  },
  p: {
    name: "Paper",
    beats: ["r"]
  },
  s: {
    name: "Scissors",
    beats: ["p"]
  }
};

/*
const WEAPONS = {
  r: {
    name: "Rock",
    beats: ["ss", "l"]
  },
  p: {
    name: "Paper",
    beats: ["r", "s"]
  },
  ss: {
    name: "Scissors",
    beats: ["p", "l"]
  },
  l: {
    name: "Lizard",
    beats: ["s", "p"]
  },
  s: {
    name: "Spock",
    beats: ["r", "ss"]
  }
};
*/

/* eslint-enable id-length*/

let weaponNames = Object.values(WEAPONS)
                        .map(weapon => weapon.name);


const rlsync = require('readline-sync');


const Help = {
  joinOr(arr, delimiter = ", ", word = "or ") {
    if (arr.length === 2) {
      return `${arr[0]} ${word} ${arr[1]}`;
    }

    let result = "";
    for (let index = 0; index < arr.length - 1; index += 1) {
      result += arr[index] + delimiter;
    }

    result += word + arr[arr.length - 1];
    return result;
  },

  getValidAnswer(allowedAnswers) {
    let answer = rlsync.question("> ").trim().toLowerCase();

    while (!allowedAnswers.includes(answer)) {
      console.log(`Please enter ${Help.joinOr(allowedAnswers)}.`);
      answer = rlsync.question("> ").trim().toLowerCase();
    }

    return answer;
  },

  getRnd(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  weaponsThatBeat(weapon) {
    let beaters = [];
    for (let key in WEAPONS) {
      if (WEAPONS[key].beats.includes(weapon)) {
        beaters.push(key);
      }
    }
    return beaters;
  }
};


const Display = {
  welcomeMessage() {
    console.clear();
    console.log(`Welcome to ${Help.joinOr(weaponNames, ", ", "")}!`);
    console.log(`The first to win ${WINNING_SCORE} rounds wins the match!`);
  },

  promptToChoose() {
    console.log();
    console.log(`Choose one of ${Help.joinOr(weaponNames).toLowerCase()}`);
    console.log(`by entering ${Help.joinOr(Object.keys(WEAPONS))}.`);
    console.log("Enter 'h' for history of moves.");
  },

  scores(game) {
    console.log();
    console.log(`>>> PLAYER   ${game.human.score} : ${game.computer.score}   COMPUTER <<<`);
  },

  choices(game) {
    console.clear();
    console.log(`You chose: ${WEAPONS[game.human.choice].name}`);
    console.log(`Computer chose: ${WEAPONS[game.computer.choice].name}`);
  },

  roundWinner(game) {
    console.log();

    if (!game.roundWinner) {
      console.log("It's a tie.");
      console.log();
      return;
    }

    switch (game.roundWinner.name) {
      case "you":
        console.log(`${WEAPONS[game.human.choice].name} beats ${WEAPONS[game.computer.choice].name}!`);
        console.log("You win this round.");
        break;
      case "computer":
        console.log(`${WEAPONS[game.computer.choice].name} beats ${WEAPONS[game.human.choice].name}!`);
        console.log("The computer wins this round.");
    }
  },

  matchWinner(winner) {
    console.log();
    switch (winner.name) {
      case "you":
        console.log("CONGRATULATIONS! You have won this match.");
        break;
      case "computer":
        console.log("Sorry, the computer has won this match.");
    }
  },

  goodbyeMessage() {
    console.log("Thank you for playing Rock, Paper, Scissors. Goodbye!");
  },

  history(game) {
    let history = game.history;
    console.log();
    console.log("YOU      | COMPUTER | WINNER");
    for (let index = history.winners.length - 1; index >= 0; index -= 1) {
      console.log(`${WEAPONS[history.humanChoices[index]].name.padEnd(8)} | ` +
                  `${WEAPONS[history.computerChoices[index]].name.padEnd(8)} | ` +
                  `${history.winners[index]}`);
    }
  }
};


const Create = {
  player() {
    return {
      choice: null,
      score: 0,

      incrementScore() {
        this.score += 1;
      },

      resetScore() {
        this.score = 0;
      }
    };
  },

// eslint-disable-next-line max-lines-per-function, max-statements
  computer() {
    let playerObject = this.player();

    let computerObject = {
      name: "computer",

      choose(game) {
        let humanChoices = game.history.humanChoices;

        if (humanChoices.length === 0) {
          this.choice = Help.getRnd(["p", "p", "p", "r", "s"]);
          // bias towards paper for first move

        } else if (humanChoices.length === 1) {
          this.choice = Help.getRnd(Object.keys(WEAPONS));
          // random choice for second move

        } else if (humanChoices[0] === humanChoices[1] &&
                   humanChoices[0] !== humanChoices[2]) {
          this.choice = history.humanChoices[0];
          // three in a row are statistically unlikely

        } else if (humanChoices.length < 6) {
          this.choice = Help.getRnd(Object.keys(WEAPONS));
          // random choice until enough moves in history

        } else {
          let likelyHumanChoice = Help.getRnd(humanChoices);
          this.choice = Help.getRnd(Help.weaponsThatBeat(likelyHumanChoice));
          // computer favours weapons that beat human's more common choice.
        }
      }
    };
    return Object.assign(playerObject, computerObject);
  },

  human() {
    let playerObject = this.player();

    let humanObject = {
      name: "you",

      choose(game) {
        Display.promptToChoose();

        let choice = Help.getValidAnswer(Object.keys(WEAPONS).concat("h"));

        if (choice === "h") {
          Display.history(game);
          this.choose();
        } else {
          this.choice = choice;
        }

      }
    };
    return Object.assign(playerObject, humanObject);
  },

  history() {
    return {
      humanChoices: [],
      computerChoices: [],
      winners: [],

      update(humanChoice, computerChoice, winner) {
        this.humanChoices.unshift(humanChoice);
        this.computerChoices.unshift(computerChoice);
        this.winners.unshift(winner ? winner.name : "");
      }
    };
  }
};


const RPSGame = {
  human: Create.human(),
  computer: Create.computer(),
  history: Create.history(),
  roundWinner: null,
  matchWinner: null,

  setRoundWinner() {
    if (this.human.choice === this.computer.choice) {
      this.roundWinner = null;
    } else if (WEAPONS[this.human.choice].beats
                                         .includes(this.computer.choice)) {
      this.roundWinner = this.human;
    } else {
      this.roundWinner = this.computer;
    }
  },

  setMatchWinner() {
    if (this.human.score === WINNING_SCORE) {
      this.matchWinner = this.human;
    } else {
      this.matchWinner = this.computer;
    }
  },

  resetMatch() {
    this.human.resetScore();
    this.computer.resetScore();
    this.roundWinner = null;
    this.matchWinner = null;
  },

  playAgain() {
    console.log();
    console.log("Play again (y/n)?");
    return Help.getValidAnswer(["y", "n"]) === "y";
  },

// eslint-disable-next-line max-lines-per-function, max-statements
  play() {
    while (true) {
      Display.welcomeMessage();

      while (this.human.score < WINNING_SCORE &&
             this.computer.score < WINNING_SCORE) {

        Display.scores(this);

        this.human.choose(this);
        this.computer.choose(this);
        Display.choices(this);

        this.setRoundWinner();
        Display.roundWinner(this);

        if (this.roundWinner) this.roundWinner.incrementScore();
        this.history.update(this.human.choice,
                            this.computer.choice,
                            this.roundWinner);
      }

      Display.scores(this);

      this.setMatchWinner();
      Display.matchWinner(this.matchWinner);

      this.resetMatch();

      if (!this.playAgain()) break;
    }

    Display.goodbyeMessage();
  },
};


RPSGame.play();