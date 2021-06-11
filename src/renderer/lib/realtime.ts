import {
  ConnectionEvent,
  ConnectionStatus,
  SlpFolderStream,
  SlpLiveStream,
  SlpRealTime,
  EventManager,
  EventManagerConfig,
  ComboEventPayload,
} from "@vinceau/slp-realtime";

import log from "electron-log";
import { dispatcher } from "@/store";
import { eventActionManager } from "../containers/actions";
import { notify } from "./utils";

//Start % used   =   Flcn,  DK , Fox , G&W , Krby, Bwsr, Link, Luig, Mrio, Mrth, Mew2, Ness, Pech, Pika, Ices, Puff, Smus, Yshi, Zlda, Shik, Flco, Ylnk, DMro, Roy , Pchu, Gnon, 
const comboAvg   = [ 12.5, 10.5,  8.5, 11.5, 11.5,    8,    9,   10,   12,   11,  8.5,    7, 10.5,    7,  8.5, 14.5, 11.5,   12,  8.5,    8, 10.5,  8.5,  7.5, 10.5,    7, 12.5];
const tierBoost  = [    0,-0.75,  0.5,   -1, -1.5, -1.5,-0.75, -0.5, -0.5,  0.5,-0.75,   -1,    0,-0.25,-0.25,  0.5,-0.25,-0.25, -1.5, 0.25, 0.25,-0.75, -0.5,   -1,   -1, -0.5];
/*  S Tier       =                ^^                                        ^^                                  ^^
    A Tier       =                                                                                                                      ^^    ^^
    B Tier       =    ^^                                                                      ^^
    C Tier       =                                                                                  ^^    ^^          ^^    ^^
    D Tier       =                                              ^^    ^^                                                                                  ^^                ^^
    E Tier       =          ^^                            ^^                      ^^                                                                ^^
    F Tier       =                      ^^                                              ^^                                                                      ^^    ^^
    G Tier       =                            ^^    ^^                                                                            ^^
*/

var minimumHits = 5; //expected hits
var pointBuffer = 40;
var comboLeniency = 0.5; //comboAvg - this value, lower means more leniency

function checkCombo(payload: ComboEventPayload): boolean {
  if (!payload.combo.didKill) {
    return false;
  }

  let comboId = payload.settings.players[payload.combo.playerIndex].characterId as any;

  let algorithm = (-1 * (((Math.pow((payload.combo.startPercent - 58.5), (3)) + (10 * Math.pow(payload.combo.startPercent, 1.85)))) / 5000) + 40) + (payload.combo.moves.length * ((payload.combo.endPercent - payload.combo.startPercent) / ((payload.combo.endFrame - payload.combo.startFrame) / 60)) * 1.35);

  const goodScore = (algorithm >= (((comboAvg[comboId] + tierBoost[comboId] + comboLeniency) * (minimumHits + 1)) + pointBuffer));

  if (goodScore) {
      return true;
  }
  return false;
}

class SlpStreamManager {
  private stream: SlpLiveStream | SlpFolderStream | null = null;
  private realtime: SlpRealTime;
  private eventManager: EventManager;

  public constructor() {
    this.realtime = new SlpRealTime();
    this.eventManager = new EventManager(this.realtime);
    this.eventManager.events$.subscribe((event) => {
      switch (event.id) {
        case "default-combo": {
          // Do something with event.payload which is of type ComboEventPayload
          if (checkCombo(event.payload)) {
            eventActionManager.emitEvent("someCustomIdForYourCombo");
          }
          break;
        }
        case "default-conversion": {
          // Do something with event.payload which is of type ComboEventPayload
          if (checkCombo(event.payload)) {
            eventActionManager.emitEvent("someCustomIdForYourConversion");
          }
          break;
        }
        default: {
          eventActionManager.emitEvent(event.id);
          break;
        }
      }
    });
  }

  public testRunEvent(eventId: string) {
    eventActionManager.emitEvent(eventId);
  }

  public updateEventConfig(config: EventManagerConfig) {
    const newConfig = { ...config };
    newConfig.events.push(
      {
        id: "default-combo",
        type: "combo-end",
        filter: {
          comboCriteria: "none",
        }
      },
      {
        id: "default-conversion",
        type: "conversion",
        filter: {
          comboCriteria: "none",
        }
      }
    );
    console.log("using config:");
    console.log(newConfig);
    this.eventManager.updateConfig(newConfig);
  }

  public async connectToSlippi(
    address = "0.0.0.0",
    slpPort = 1667,
    type: "dolphin" | "console" = "console"
  ): Promise<void> {
    console.log(`attempt to connect to slippi on port: ${slpPort}`);
    const stream = new SlpLiveStream(type);
    stream.connection.on(ConnectionEvent.ERROR, (err) => {
      log.error(err);
    });
    stream.connection.once(ConnectionEvent.CONNECT, () => {
      dispatcher.tempContainer.setSlippiConnectionType(type);
      const connType = type === "dolphin" ? "Slippi Dolphin" : "Slippi relay";
      stream.connection.on(ConnectionEvent.STATUS_CHANGE, (status: ConnectionStatus) => {
        dispatcher.tempContainer.setSlippiConnectionStatus(status);
        if (status === ConnectionStatus.CONNECTED) {
          notify(`Connected to ${connType}`);
        } else if (status === ConnectionStatus.DISCONNECTED) {
          notify(`Disconnected from ${connType}`);
        }
      });
    });
    console.log(stream.connection);
    await stream.start(address, slpPort);
    this.realtime.setStream(stream);
    this.stream = stream;
  }

  public disconnectFromSlippi(): void {
    if (this.stream && "connection" in this.stream) {
      this.stream.connection.disconnect();
    }
    this.stream = null;
  }

  public async monitorSlpFolder(filepath: string): Promise<void> {
    try {
      const stream = new SlpFolderStream();
      await stream.start(filepath);
      this.realtime.setStream(stream);
      this.stream = stream;
      dispatcher.tempContainer.setSlpFolderStream(filepath);
    } catch (err) {
      console.error(err);
      notify("Could not monitor folder. Are you sure it exists?");
    }
  }

  public stopMonitoringSlpFolder(): void {
    if (this.stream && "stop" in this.stream) {
      this.stream.stop();
    }
    this.stream = null;
    dispatcher.tempContainer.clearSlpFolderStream();
  }
}

export const streamManager = new SlpStreamManager();