import uuid
from typing import Any, AsyncGenerator

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
from sqlmodel import func, select
import fitz  # pymupdf
import docx
from io import BytesIO

from app.core.config import settings

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Resume,
    ResumeCreate,
    ResumePublic,
    ResumesPublic,
    ResumeUpdate,
    Message,
)

router = APIRouter()

@router.get("/", response_model=ResumesPublic)
def read_resumes(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve resumes.
    """
    count_statement = select(func.count()).select_from(Resume).where(Resume.owner_id == current_user.id)
    count = session.exec(count_statement).one()
    statement = select(Resume).where(Resume.owner_id == current_user.id).offset(skip).limit(limit)
    resumes = session.exec(statement).all()
    return ResumesPublic(data=resumes, count=count)

@router.get("/{id}", response_model=ResumePublic)
def read_resume(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get resume by ID.
    """
    resume = session.get(Resume, id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return resume

@router.post("/", response_model=ResumePublic)
def create_resume(
    *, session: SessionDep, current_user: CurrentUser, resume_in: ResumeCreate
) -> Any:
    """
    Create new resume.
    """
    resume = Resume.model_validate(resume_in, update={"owner_id": current_user.id})
    session.add(resume)
    session.commit()
    session.refresh(resume)
    return resume

@router.put("/{id}", response_model=ResumePublic)
def update_resume(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    resume_in: ResumeUpdate,
) -> Any:
    """
    Update a resume.
    """
    resume = session.get(Resume, id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    update_data = resume_in.model_dump(exclude_unset=True)
    resume.sqlmodel_update(update_data)
    session.add(resume)
    session.commit()
    session.refresh(resume)
    return resume

@router.delete("/{id}", response_model=Message)
def delete_resume(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Delete a resume.
    """
    resume = session.get(Resume, id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.owner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(resume)
    session.commit()
    return Message(message="Resume deleted successfully")

@router.post("/parse", response_model=Message)
async def parse_resume_file(
    file: UploadFile = File(...)
) -> Any:
    """
    Parse a resume file (PDF, DOCX, MD) to Markdown.
    Returns the parsed markdown in 'message' field.
    """
    content = ""
    filename = (file.filename or "").lower()
    
    try:
        if filename.endswith(".pdf"):
            # Read file content
            file_content = await file.read()
            doc = fitz.open(stream=file_content, filetype="pdf")
            for page in doc:
                content += page.get_text() + "\n"
        elif filename.endswith(".docx"):
            file_content = await file.read()
            doc = docx.Document(BytesIO(file_content))
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            content = "\n".join(full_text)
        elif filename.endswith(".md") or filename.endswith(".txt") or filename.endswith(".markdown"):
            file_content = await file.read()
            content = file_content.decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, DOCX, or Markdown.")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    return Message(message=content)

class ResumeOptimizeRequest(BaseModel):
    content: str
    jd: str

@router.post("/optimize")
async def optimize_resume(
    request: ResumeOptimizeRequest,
    current_user: CurrentUser,
) -> StreamingResponse:
    """
    Stream optimized resume based on JD using DeepSeek (via OpenAI compatible API).
    """
    if not settings.DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="DeepSeek API Key not configured")

    client = AsyncOpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
    )

    prompt = f"""
你是一位资深的职业发展顾问和简历优化专家。
请根据以下【目标职位描述（JD）】来优化【候选人简历】。

【目标职位描述（JD）】
{request.jd}

【候选人简历】
{request.content}

优化要求：
1. **关键词匹配**：提取JD中的核心技能和关键词，自然地融入简历的技能列表和项目经历中。
2. **量化成果**：增强项目描述，使用STAR原则（Situation, Task, Action, Result），尽量用数据展示成果。
3. **结构清晰**：保持Markdown格式，使用清晰的标题和列表。
4. **语气专业**：使用专业、自信的职场语言，去除口语化表达。
5. **相关性**：强调与JD最相关的经验，弱化不相关的部分。

请直接输出优化后的简历Markdown内容，不需要任何开场白或结束语。
"""

    async def generate() -> AsyncGenerator[str, None]:
        try:
            stream = await client.chat.completions.create(
                model="deepseek-chat", # or "deepseek-coder" or generic "gpt-3.5-turbo" if mapping
                messages=[
                    {"role": "system", "content": "You are a helpful expert resume improver."},
                    {"role": "user", "content": prompt},
                ],
                stream=True,
                temperature=0.7,
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"\n\n[Error: {str(e)}]"

    return StreamingResponse(
        generate(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

