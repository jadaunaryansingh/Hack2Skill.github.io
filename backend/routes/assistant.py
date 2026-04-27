from fastapi import APIRouter
from simulation.ai_engine import generate_ai_response, SUGGESTIONS

router = APIRouter(tags=["AI Assistant"])


@router.post("/assistant/query")
def query_assistant(body: dict):
    """
    AI strategy assistant query.
    Body: { "message": "...", "context": "optional" }
    """
    message = body.get("message", "")
    context = body.get("context", "")
    return generate_ai_response(message, context)


@router.get("/assistant/suggestions")
def get_suggestions():
    """Pre-built prompt suggestions for the AI assistant."""
    return {"suggestions": SUGGESTIONS}
