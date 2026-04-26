import json
import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from .agent import get_agent_executor

router = APIRouter()

@router.post("/stream")
async def stream_agent(request: Request):
    """
    HTTP Streaming endpoint for AI Agent (Vercel compatible).
    Replaces WebSockets which are not supported on Vercel.
    """
    payload = await request.json()
    message = payload.get("message")
    
    if not message:
        return {"error": "Message is required"}

    async def event_generator():
        executor = get_agent_executor()
        try:
            async for chunk in executor.astream(
                {"messages": [{"role": "user", "content": message}]},
                stream_mode=["messages", "updates"],
                version="v2",
            ):
                if chunk["type"] == "messages":
                    message_chunk, metadata = chunk["data"]
                    from langchain_core.messages import AIMessageChunk
                    if not isinstance(message_chunk, AIMessageChunk):
                        continue
                    
                    node = metadata.get("langgraph_node")
                    if node not in ["agent", "model"]:
                        continue

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
                        yield f"data: {json.dumps({'type': 'token', 'content': text})}\n\n"
                
                elif chunk["type"] == "updates":
                    for node_name, state in chunk["data"].items():
                        if node_name == "model":
                            messages = state.get("messages", [])
                            for msg in messages:
                                tool_calls = getattr(msg, "tool_calls", [])
                                for tc in tool_calls:
                                    yield f"data: {json.dumps({'type': 'tool_start', 'tool': tc['name']})}\n\n"
                        
                        elif node_name == "tools":
                            messages = state.get("messages", [])
                            for msg in messages:
                                tool_name = getattr(msg, "name", None)
                                if tool_name:
                                    yield f"data: {json.dumps({'type': 'tool_end', 'tool': tool_name})}\n\n"
            
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
            print(f"Stream Error: {e}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")
