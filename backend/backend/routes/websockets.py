from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(
    prefix="/ws",  # WebSocket route prefix
    tags=["websockets"]
)

@router.websocket("/progress")
async def websocket_progress(websocket: WebSocket):
    """
    WebSocket to track progress based on real backend API calls.
    Progress updates are sent from the frontend after each batch of companies is added.
    """
    await websocket.accept()  # Accept WebSocket connection

    try:
        while True:
            # Receive the progress percentage or completion message from the frontend
            data = await websocket.receive_json()

            # If connection was already closed, don't send more data
            if websocket.application_state == "CLOSED":
                break

            # Send the progress update back to the frontend
            if "progress_percentage" in data:
                await websocket.send_json({
                    "progress_percentage": data["progress_percentage"]
                })

            # When all companies are added, send the completion message
            if data.get("message") == "Task completed":
                await websocket.send_json({"message": "Task completed"})
                break  # Exit the loop when the task is done

    except WebSocketDisconnect:
        print("WebSocket disconnected")

    finally:
        if websocket.application_state != "CLOSED":
            await websocket.close()  # Ensure the WebSocket is closed properly
