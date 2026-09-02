"""In-process WebSocket connection registry for real-time notifications.

Single-process only (a dict kept in memory) — fine for this app's current
single-uvicorn-worker deployment. A multi-worker/multi-instance deployment
would need a shared pub/sub (Redis) behind the same send_to_user() interface;
nothing above this module would need to change.
"""
import uuid
from collections import defaultdict
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._connections: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: uuid.UUID, ws: WebSocket) -> None:
        await ws.accept()
        self._connections[user_id].add(ws)

    def disconnect(self, user_id: uuid.UUID, ws: WebSocket) -> None:
        self._connections[user_id].discard(ws)
        if not self._connections[user_id]:
            self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: uuid.UUID, payload: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self._connections.get(user_id, ()):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(user_id, ws)


manager = ConnectionManager()
