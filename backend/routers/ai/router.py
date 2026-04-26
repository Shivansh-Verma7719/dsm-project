import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .agent import get_agent_executor

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            message = payload.get("message")
            
            if not message:
                continue
            
            executor = get_agent_executor()
            
            # Use astream with dual modes for messages (tokens) and updates (tool tracking)
            async for chunk in executor.astream(
                {"messages": [{"role": "user", "content": message}]},
                stream_mode=["messages", "updates"],
                version="v2",
            ):
                if chunk["type"] == "messages":
                    message_chunk, metadata = chunk["data"]
                    
                    # STRICT FILTER: Only allow incremental tokens from the model
                    from langchain_core.messages import AIMessageChunk
                    if not isinstance(message_chunk, AIMessageChunk):
                        continue
                    
                    # Also ensure we are in the agent/model node
                    node = metadata.get("langgraph_node")
                    if node not in ["agent", "model"]:
                        continue

                    # ❌ Skip tool call chunks (these are not user-facing text)
                    if getattr(message_chunk, "tool_call_chunks", None):
                        continue

                    content = getattr(message_chunk, "content", None)
                    
                    text = ""
                    if isinstance(content, str):
                        text = content
                    elif isinstance(content, list):
                        for block in content:
                            if isinstance(block, dict) and block.get("type") == "text":
                                text += block.get("text", "")
                    
                    if text:
                        await websocket.send_json({
                            "type": "token",
                            "content": text
                        })
                
                elif chunk["type"] == "updates":
                    for node_name, state in chunk["data"].items():
                        # Tool START (from model node)
                        if node_name == "model":
                            messages = state.get("messages", [])
                            for msg in messages:
                                tool_calls = getattr(msg, "tool_calls", [])
                                for tc in tool_calls:
                                    await websocket.send_json({
                                        "type": "tool_start",
                                        "tool": tc["name"]
                                    })
                        
                        # Tool END (from tools node)
                        elif node_name == "tools":
                            messages = state.get("messages", [])
                            for msg in messages:
                                tool_name = getattr(msg, "name", None)
                                if tool_name:
                                    await websocket.send_json({
                                        "type": "tool_end",
                                        "tool": tool_name
                                    })
            
            await websocket.send_json({"type": "done"})
            
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        await websocket.send_json({"type": "error", "content": str(e)})
        print(f"WS Error: {e}")
