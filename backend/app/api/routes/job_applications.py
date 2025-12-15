import uuid
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    JobApplication,
    JobApplicationCreate,
    JobApplicationPublic,
    JobApplicationsPublic,
    JobApplicationUpdate,
    Message,
)

router = APIRouter(prefix="/job-applications", tags=["job-applications"])


@router.get("/", response_model=JobApplicationsPublic)
def read_job_applications(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve all job applications (网申表格).
    """
    count_statement = select(func.count()).select_from(JobApplication)
    count = session.exec(count_statement).one()
    statement = (
        select(JobApplication)
        .order_by(JobApplication.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    job_applications = session.exec(statement).all()
    return JobApplicationsPublic(data=job_applications, count=count)


@router.get("/{id}", response_model=JobApplicationPublic)
def read_job_application(session: SessionDep, id: uuid.UUID) -> Any:
    """
    Get job application by ID.
    """
    job_application = session.get(JobApplication, id)
    if not job_application:
        raise HTTPException(status_code=404, detail="Job application not found")
    return job_application


@router.post("/", response_model=JobApplicationPublic)
def create_job_application(
    *, session: SessionDep, current_user: CurrentUser, job_application_in: JobApplicationCreate
) -> Any:
    """
    Create new job application.
    """
    job_application = JobApplication.model_validate(job_application_in)
    session.add(job_application)
    session.commit()
    session.refresh(job_application)
    return job_application


@router.put("/{id}", response_model=JobApplicationPublic)
def update_job_application(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    job_application_in: JobApplicationUpdate,
) -> Any:
    """
    Update a job application.
    """
    job_application = session.get(JobApplication, id)
    if not job_application:
        raise HTTPException(status_code=404, detail="Job application not found")
    update_dict = job_application_in.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    job_application.sqlmodel_update(update_dict)
    session.add(job_application)
    session.commit()
    session.refresh(job_application)
    return job_application


@router.delete("/{id}")
def delete_job_application(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a job application.
    """
    job_application = session.get(JobApplication, id)
    if not job_application:
        raise HTTPException(status_code=404, detail="Job application not found")
    session.delete(job_application)
    session.commit()
    return Message(message="Job application deleted successfully")


@router.post("/init-mock-data", response_model=Message)
def init_mock_data(session: SessionDep, current_user: CurrentUser) -> Message:
    """
    Initialize mock data for job applications (用于测试的 mock 数据).
    """
    # Check if data already exists
    count_statement = select(func.count()).select_from(JobApplication)
    count = session.exec(count_statement).one()
    if count > 0:
        return Message(message=f"Mock data already exists ({count} records)")

    mock_data = [
        {
            "company_name": "阿里巴巴集团",
            "announcement_url": "https://talent.alibaba.com/campus",
            "apply_url": "https://talent.alibaba.com/campus/apply",
            "industry": "互联网/电子商务",
            "tags": "大厂,技术,AI",
            "batch": "2025届秋招",
            "position": "后端开发工程师",
            "location": "杭州/北京/上海",
            "deadline": datetime.now() + timedelta(days=30),
        },
        {
            "company_name": "腾讯科技",
            "announcement_url": "https://join.qq.com",
            "apply_url": "https://join.qq.com/apply",
            "industry": "互联网/游戏",
            "tags": "大厂,社交,游戏",
            "batch": "2025届秋招",
            "position": "产品经理",
            "location": "深圳/北京/上海",
            "deadline": datetime.now() + timedelta(days=25),
        },
        {
            "company_name": "字节跳动",
            "announcement_url": "https://jobs.bytedance.com/campus",
            "apply_url": "https://jobs.bytedance.com/campus/apply",
            "industry": "互联网/短视频",
            "tags": "大厂,增长,国际化",
            "batch": "2025届秋招",
            "position": "算法工程师",
            "location": "北京/上海/深圳",
            "deadline": datetime.now() + timedelta(days=20),
        },
        {
            "company_name": "华为技术有限公司",
            "announcement_url": "https://career.huawei.com/reccampportal",
            "apply_url": "https://career.huawei.com/reccampportal/apply",
            "industry": "通信/电子",
            "tags": "硬件,5G,芯片",
            "batch": "2025届秋招",
            "position": "硬件工程师",
            "location": "深圳/东莞/武汉",
            "deadline": datetime.now() + timedelta(days=35),
        },
        {
            "company_name": "小米科技",
            "announcement_url": "https://hr.xiaomi.com/campus",
            "apply_url": "https://hr.xiaomi.com/campus/apply",
            "industry": "消费电子/IoT",
            "tags": "智能硬件,IoT,生态",
            "batch": "2025届秋招",
            "position": "嵌入式开发工程师",
            "location": "北京/武汉/南京",
            "deadline": datetime.now() + timedelta(days=28),
        },
        {
            "company_name": "美团",
            "announcement_url": "https://zhaopin.meituan.com/campus",
            "apply_url": "https://zhaopin.meituan.com/campus/apply",
            "industry": "本地生活/O2O",
            "tags": "生活服务,外卖,出行",
            "batch": "2025届秋招",
            "position": "数据分析师",
            "location": "北京/上海",
            "deadline": datetime.now() + timedelta(days=22),
        },
        {
            "company_name": "京东集团",
            "announcement_url": "https://campus.jd.com",
            "apply_url": "https://campus.jd.com/apply",
            "industry": "电商/物流",
            "tags": "电商,物流,供应链",
            "batch": "2025届秋招",
            "position": "供应链管理培训生",
            "location": "北京/上海/宿迁",
            "deadline": datetime.now() + timedelta(days=18),
        },
        {
            "company_name": "网易",
            "announcement_url": "https://campus.163.com",
            "apply_url": "https://campus.163.com/apply",
            "industry": "互联网/游戏",
            "tags": "游戏,音乐,教育",
            "batch": "2025届秋招",
            "position": "游戏策划",
            "location": "广州/杭州/上海",
            "deadline": datetime.now() + timedelta(days=15),
        },
        {
            "company_name": "百度",
            "announcement_url": "https://talent.baidu.com/campus",
            "apply_url": "https://talent.baidu.com/campus/apply",
            "industry": "互联网/AI",
            "tags": "搜索,AI,自动驾驶",
            "batch": "2025届秋招",
            "position": "AI研究员",
            "location": "北京/上海/深圳",
            "deadline": datetime.now() + timedelta(days=26),
        },
        {
            "company_name": "蚂蚁集团",
            "announcement_url": "https://talent.antgroup.com/campus",
            "apply_url": "https://talent.antgroup.com/campus/apply",
            "industry": "金融科技",
            "tags": "支付,金融,区块链",
            "batch": "2025届秋招",
            "position": "金融产品经理",
            "location": "杭州/上海/北京",
            "deadline": datetime.now() + timedelta(days=32),
        },
    ]

    for data in mock_data:
        job_application = JobApplication(**data)
        session.add(job_application)

    session.commit()
    return Message(message=f"Successfully created {len(mock_data)} mock job applications")
