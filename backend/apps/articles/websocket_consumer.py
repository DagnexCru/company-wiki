import json
import logging
from typing import Dict, Set

logger = logging.getLogger(__name__)

# In-memory registry of active WebSocket send channels partitioned by article room
ROOMS: Dict[str, Set] = {}


async def broadcast_to_room(room_name: str, payload: dict, exclude_send=None):
    """
    Broadcast a real-time event message to all connected clients in an article room.
    """
    if room_name not in ROOMS:
        return
    dead_connections = set()
    message_text = json.dumps(payload)
    for send in list(ROOMS[room_name]):
        if send is exclude_send:
            continue
        try:
            await send({
                "type": "websocket.send",
                "text": message_text,
            })
        except Exception:
            dead_connections.add(send)
    ROOMS[room_name].difference_update(dead_connections)


async def annotation_websocket_consumer(scope, receive, send):
    """
    Pure ASGI WebSocket consumer handling real-time annotation discussions,
    live thread updates, and typing presence indicators.
    URL Pattern: /ws/articles/<slug_or_id>/annotations/
    """
    path = scope.get("path", "")
    parts = [p for p in path.strip("/").split("/") if p]
    # Expect: ws / articles / <slug_or_id> / annotations
    if len(parts) >= 3 and parts[0] == "ws" and parts[1] == "articles":
        room_name = parts[2]
    else:
        room_name = "general"

    if room_name not in ROOMS:
        ROOMS[room_name] = set()
    ROOMS[room_name].add(send)

    try:
        while True:
            message = await receive()
            msg_type = message.get("type")

            if msg_type == "websocket.connect":
                await send({"type": "websocket.accept"})
                await send({
                    "type": "websocket.send",
                    "text": json.dumps({
                        "type": "connected",
                        "room": room_name,
                        "status": "active",
                    }),
                })

            elif msg_type == "websocket.receive":
                raw_text = message.get("text", "")
                if not raw_text:
                    continue
                try:
                    data = json.loads(raw_text)
                except Exception:
                    continue

                event_type = data.get("type")

                if event_type == "typing":
                    # Broadcast typing presence to other clients in room
                    await broadcast_to_room(
                        room_name,
                        {
                            "type": "typing_indicator",
                            "annotation_id": data.get("annotation_id"),
                            "username": data.get("username", "Teammate"),
                            "full_name": data.get("full_name", ""),
                            "is_typing": bool(data.get("is_typing", True)),
                        },
                        exclude_send=send,
                    )
                elif event_type == "ping":
                    await send({
                        "type": "websocket.send",
                        "text": json.dumps({"type": "pong"}),
                    })
                elif event_type in ["new_annotation", "new_reply", "resolve", "reopen"]:
                    await broadcast_to_room(room_name, data, exclude_send=send)

            elif msg_type == "websocket.disconnect":
                break
    finally:
        if room_name in ROOMS:
            ROOMS[room_name].discard(send)
