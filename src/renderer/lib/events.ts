import log from "electron-log";
import {
  ComboEvent,
  ComboEventFilter,
  EventConfig,
  GameEvent,
  InputEvent,
  StockEvent,
  StockEventFilter,
} from "@vinceau/slp-realtime";
import { CustomInputEventFilter, generateButtonComboPreview } from "./inputs";

const randomEvents: string[] = [
  "Wizzrobe lands a grab",
  "Zain misses a pivot",
  "n0ne does something sick",
  "the wind blows",
  "you feeling kinda cute",
  "you feel so tired but you can't sleep",
  "nobody laughs at your joke",
  "you try your best but you don't succeed",
  "Jesus returns",
  "Natalie Tran makes a lamington video",
  "Hungrybox lands a rest",
  "you get what you want but not what you need",
  "someone says that Melee is a dead game",
  "aMSa wins a major",
  "you get left on read",
  "Shippiddge releases Starter Squad 10",
];

export const generateRandomEvent = () => {
  const d = new Date();
  // Start at current day + month
  const offset = d.getDate() + d.getMonth();
  // If the current hour is odd, add one, else minus one
  const switcher = d.getHours() % 2 ? 1 : -1;
  const index = (offset + switcher) % randomEvents.length;
  return randomEvents[index] + "...";
};

export const generateEventName = (event: EventConfig): string => {
  try {
    switch (event.type) {
      case GameEvent.GAME_START:
        return "When the game starts";
      case GameEvent.GAME_END:
        return "When the game ends";
      case ComboEvent.END:
        return generateComboEventName("combo", event);
      case ComboEvent.CONVERSION:
        return generateComboEventName("conversion", event);
      case InputEvent.BUTTON_COMBO:
        return generateButtonComboEventName(event);
      case StockEvent.PLAYER_SPAWN:
        return generateStockEventName("spawns", event);
      case StockEvent.PLAYER_DIED:
        return generateStockEventName("dies", event);
    }
  } catch (err) {
    log.error(err);
  }
  return event.type;
};

const generatePlayerText = (players?: string | number | number[]): [string, number] => {
  if (!players) {
    return ["a player", 4];
  }
  if (typeof players === "string") {
    return [players, 1];
  }
  if (typeof players === "number") {
    return [`P${players + 1}`, 1];
  }

  return [players.map((i) => `P${i + 1}`).join(", "), players.length];
};

const generateComboEventName = (comboOrConversion: string, event: EventConfig) => {
  const filter = event.filter as ComboEventFilter;
  const players = filter ? filter.playerIndex : undefined;
  const [playerText, numPlayers] = generatePlayerText(players);
  const profileName = (filter.comboCriteria as string).substring(1);
  const profileText = profileName === "default" ? comboOrConversion : `${profileName} ${comboOrConversion}`;
  if (numPlayers === 4) {
    return `When a ${profileText} occurs`;
  }
  return `When ${playerText} does a ${profileText}`;
};

const generateStockEventName = (spawnOrDies: string, event: EventConfig): string => {
  const players = event.filter ? (event.filter as StockEventFilter).playerIndex : undefined;
  const [playerText, numPlayers] = generatePlayerText(players);
  if (numPlayers === 4) {
    return `When a player ${spawnOrDies}`;
  }
  return `When ${playerText} ${spawnOrDies}`;
};

const generateButtonComboEventName = (event: EventConfig): string => {
  const filter = event.filter as CustomInputEventFilter;
  const buttons = generateButtonComboPreview(filter.buttonCombo, ", ");
  const holdText = filter.inputButtonHold === "held" ? "holds" : "presses";
  const [playerText] = generatePlayerText(filter.playerIndex);

  let holdInfo = "";
  if (filter.inputButtonHold === "held") {
    holdInfo = ` for ${filter.inputButtonHoldDelay} ${filter.inputButtonHoldUnits}`;
  }

  return `When ${playerText} ${holdText} ${buttons}${holdInfo}`;
};
