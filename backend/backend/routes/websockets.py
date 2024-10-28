from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(
    prefix="/ws",
    tags=["websockets"]
)

@router.websocket("/progress")
async def websocket_progress(websocket: WebSocket):
    """
    WebSocket to track progress based on real backend API calls.
    Progress updates are sent from the frontend after each batch of companies is added.
    """
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()

            if websocket.application_state == "CLOSED":
                break

            if "progress_percentage" in data:
                await websocket.send_json({
                    "progress_percentage": data["progress_percentage"]
                })

            if data.get("message") == "Task completed":
                await websocket.send_json({"message": "Task completed"})
                break

    except WebSocketDisconnect:
        print("WebSocket disconnected")

    finally:
        if websocket.application_state != "CLOSED":
            await websocket.close()
