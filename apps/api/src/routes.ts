import type { Handler } from "./types";
import {
  handleGameCreate,
  handleGameDelete,
  handleGameList,
  handleGameUpdate
} from "./handlers/game";
import {
  handleEventCreate,
  handleEventDelete,
  handleEventList,
  handleEventUpdate
} from "./handlers/event";
import {
  handleActionCreate,
  handleActionDelete,
  handleActionList,
  handleActionUpdate
} from "./handlers/action";

export const routes: Record<string, Handler> = {
  "/api/v1/game/create": handleGameCreate,
  "/api/v1/game/list": handleGameList,
  "/api/v1/game/update": handleGameUpdate,
  "/api/v1/game/delete": handleGameDelete,
  "/api/v1/event/create": handleEventCreate,
  "/api/v1/event/list": handleEventList,
  "/api/v1/event/update": handleEventUpdate,
  "/api/v1/event/delete": handleEventDelete,
  "/api/v1/action/create": handleActionCreate,
  "/api/v1/action/list": handleActionList,
  "/api/v1/action/update": handleActionUpdate,
  "/api/v1/action/delete": handleActionDelete
};
