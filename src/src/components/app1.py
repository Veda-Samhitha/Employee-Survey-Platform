from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, constr, field_validator, model_validator
from typing import List, Optional, Dict, Annotated
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session
from passlib.context import CryptContext
import jwt
import json
import bcrypt
from datetime import datetime, timedelta
from perplexityai_analysis import analyze_submission
from sqlalchemy import func # Import func for aggregation

# ==============================
# CONFIGURATION
# ==============================
DATABASE_URL = "sqlite:///./survey_app.db"
SECRET_KEY = "your-secret-key"  # Use a strong, random key in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ==============================
# DATABASE MODELS
# ==============================
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin' or 'employee'

class UserOut(BaseModel):
    username: str
    role: str

class Employee(BaseModel):
    id: int # Assuming employee ID is an integer
    username: str
    role: str
    
    # Allows the model to be created from SQLAlchemy objects
    class Config:
        from_attributes = True

class Survey(Base):
    __tablename__ = "surveys"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    questions = Column(Text)  # Stored as JSON string
    published = Column(Boolean, default=False)


class SurveyAssignment(Base):
    __tablename__ = "survey_assignments"
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    survey = relationship("Survey")
    user = relationship("User")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    answers = Column(Text)  # JSON string of answers
    sentiment = Column(String, nullable=True)
    burnout_risk = Column(String, nullable=True)

    survey = relationship("Survey")
    user = relationship("User")


# Create database tables
Base.metadata.create_all(bind=engine)

# ==============================
# PYDANTIC SCHEMAS
# ==============================
class UserCreate(BaseModel):
    username: str
    password: constr(min_length=6, max_length=64)
    role: str
   
    @field_validator('password')
    @classmethod
    def validate_password_bytes(cls, v: str) -> str:
          if len(v.encode('utf-8')) > 72:
              raise ValueError('Password is too long (max 72 bytes)')
          return v
class Token(BaseModel):
    access_token: str
    token_type: str


class SurveyCreate(BaseModel):
    title: str
    questions: List[str]


class SurveyOut(BaseModel):
    id: int
    title: str
    questions: List[str]
    published: bool

    class Config:
        from_attributes = True


class SurveyAssignmentCreate(BaseModel):
    survey_id: int
    user_ids: List[int]


class SurveyResponseCreate(BaseModel):
    survey_id: int
    answers: Dict[str, str]


class SurveyResponseOut(BaseModel):
    id: int
    survey_id: int
    user_id: int
    answers: Dict[str, str]
    sentiment: Optional[str]
    burnout_risk: Optional[str]

    class Config:
        from_attributes = True

    @model_validator(mode='before')
    @classmethod
    def convert_json_fields(cls, data):
        """Converts the JSON string fields from the DB back into Python objects."""
        # Check if the data is an ORM object (SurveyResponse instance)
        if isinstance(data, dict):
            # If data is already a dict (e.g., from manual construction), just return it
            return data
            
        if hasattr(data, 'answers') and isinstance(data.answers, str):
            try:
                # Load the JSON string from the DB before Pydantic validates it
                data.answers = json.loads(data.answers)
            except json.JSONDecodeError:
                # Handle case where the JSON string is invalid
                print(f"Error decoding JSON for answers in response ID {data.id}")
                data.answers = {} # Set to empty dict or handle error as needed
                
        return data

# New Pydantic schema for the detailed report table
class SurveyReportRow(BaseModel):
    response_id: int
    user_id: int
    username: str
    sentiment: Optional[str]
    burnout_risk: Optional[str]


# ==============================
# UTILITY FUNCTIONS
# ==============================
def get_password_hash(password: str) -> str:
    print(f"Original password length: {len(password)} chars")
    print(f"Original password bytes: {len(password.encode('utf-8'))} bytes")
    print(f"Password content (first 50 chars): {password[:50]}")
    safe_password = password
    while len(safe_password.encode("utf-8")) > 72:
           safe_password = safe_password[:-1]
    print(f"Safe password length: {len(safe_password)} chars")
    print(f"Safe password bytes: {len(safe_password.encode('utf-8'))} bytes")
    return pwd_context.hash(safe_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    safe_password = plain_password
    while len(safe_password.encode("utf-8")) > 72:
           safe_password = safe_password[:-1]
    return pwd_context.verify(safe_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_users_by_role(db: Session, role: str):
    """Fetches all users with a specific role."""
    return db.query(User).filter(User.role == role).all()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = get_user(db, username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user


# ==============================
# FASTAPI APP INITIALIZATION
# ==============================
app = FastAPI(title="Employee Survey System", version="1.0")
origins = [
    "http://localhost",       # Default for local development
    "http://localhost:3000",  # Your React development server address
    "http://127.0.0.1:3000",  # Another common local address    
]

# Add the CORSMiddleware to your application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,              # List of origins permitted to make requests
    allow_credentials=True,             # Allow cookies to be included in cross-origin requests
    allow_methods=["*"],                # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],                # Allow all headers (including Authorization)
)
# ==============================
# ROUTES
# ==============================
@app.post("/users/", status_code=201)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = get_user(db, user_in.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user_in.password)
    user = User(username=user_in.username, hashed_password=hashed_password, role=user_in.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"username": user.username, "role": user.role}


@app.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/surveys/", response_model=SurveyOut)
def create_survey(survey_in: SurveyCreate,current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # Check if role is enum
    
    if isinstance(current_user.role, str):
        if current_user.role.lower() != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    import json
    survey = Survey(
        title=survey_in.title, 
        questions=json.dumps(survey_in.questions), 
        published=False
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)
    survey.questions = survey_in.questions  # Return as list
    return survey


@app.get("/surveys/", response_model=List[SurveyOut])
def get_surveys(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    surveys = db.query(Survey).all()
    for s in surveys:
        s.questions = json.loads(s.questions)
    return surveys


@app.post("/survey-assignments/")
def assign_survey(assign_in: SurveyAssignmentCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    survey = db.query(Survey).filter(Survey.id == assign_in.survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    db.query(SurveyAssignment).filter(SurveyAssignment.survey_id == assign_in.survey_id).delete()

    for user_id in assign_in.user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.add(SurveyAssignment(survey_id=assign_in.survey_id, user_id=user_id))

    survey.published = True
    db.commit()
    return {"detail": "Survey assigned successfully"}


@app.post("/survey-responses/")
def submit_response(response_in: SurveyResponseCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    assignment = db.query(SurveyAssignment).filter(
        SurveyAssignment.survey_id == response_in.survey_id,
        SurveyAssignment.user_id == current_user.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=403, detail="User not assigned to this survey")
    
    # NOTE: The analyze_submission function is external and assumed to work as intended
    ai_results = analyze_submission(submission_id=response_in.survey_id,responses=response_in.answers)
    
    if not ai_results or 'analysis' not in ai_results:
        # You can choose to raise an error or continue with defaults
        ai_results = {
            "analysis": {
                "emotional_tone": "Neutral",
                "burnout_risk": "Low"
            }
        }

    print(ai_results)
    answers_json = json.dumps(response_in.answers)
    resp = SurveyResponse(
        survey_id=response_in.survey_id,
        user_id=current_user.id,
        answers=answers_json,
        sentiment=ai_results["analysis"]["emotional_tone"],
        burnout_risk=ai_results["analysis"]["burnout_risk"]
    )
    db.add(resp)
    db.commit()
    db.refresh(resp)
    return {"detail": "Response submitted successfully"}

@app.get("/survey-responses/{survey_id}", response_model=List[SurveyResponseOut])
def get_survey_results(survey_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Returns all submitted responses and their AI analysis for a specific survey.
    Only accessible by users with the 'admin' role.
    """
    # 1. Authorization Check (Admin Role Required)
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized. Only admins can view results.")

    # 2. Query for Survey Responses
    responses = db.query(SurveyResponse).filter(
        SurveyResponse.survey_id == survey_id
    ).all()

    if not responses:
        survey = db.query(Survey).filter(Survey.id == survey_id).first()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found.")

        return [] 
    
    return responses

# --- NEW ANALYSIS ENDPOINTS START HERE ---
# =================================================================
# 1. DISTRIBUTION ENDPOINT (FOR PIE/BAR CHARTS)
# =================================================================
@app.get("/analysis/survey/{survey_id}/distribution")
def get_survey_distribution(survey_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Calculates the distribution count for sentiment and burnout risk for a survey.
    Returns data structured for frontend charting (e.g., Pie or Bar charts).
    """
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized.")

    # Check if survey exists
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")

    # Get all responses for the survey
    responses = db.query(SurveyResponse).filter(
        SurveyResponse.survey_id == survey_id
    ).all()

    if not responses:
        return {
            "sentiment_distribution": [],
            "burnout_risk_distribution": [],
            "total_responses": 0
        }

    # Calculate distributions
    sentiment_counts = {}
    burnout_risk_counts = {}
    
    for resp in responses:
        # Sentiment distribution
        sentiment = resp.sentiment or "Unknown"
        sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
        
        # Burnout risk distribution
        burnout_risk = resp.burnout_risk or "Unknown"
        burnout_risk_counts[burnout_risk] = burnout_risk_counts.get(burnout_risk, 0) + 1

    # Convert counts to a list of dicts suitable for chart libraries (optional but useful)
    sentiment_data = [{"label": k, "value": v} for k, v in sentiment_counts.items()]
    burnout_risk_data = [{"label": k, "value": v} for k, v in burnout_risk_counts.items()]

    return {
        "sentiment_distribution": sentiment_data,
        "burnout_risk_distribution": burnout_risk_data,
        "total_responses": len(responses)
    }

# -----------------------------------------------------------------

# =================================================================
# 2. REPORT TABLE ENDPOINT (FOR DETAILED EMPLOYEE DATA)
# =================================================================
@app.get("/analysis/survey/{survey_id}/report-table", response_model=List[SurveyReportRow])
def get_survey_report_table(survey_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Generates a table report of user-level metrics for admin review.
    NOTE: This requires a JOIN operation in SQLAlchemy.
    """
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized.")

    # Query responses and join with User to get the username
    results = db.query(SurveyResponse, User.username).join(
        User, SurveyResponse.user_id == User.id
    ).filter(
        SurveyResponse.survey_id == survey_id
    ).all()

    if not results:
        survey = db.query(Survey).filter(Survey.id == survey_id).first()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found.")
        return []

    report_data = []
    for resp, username in results:
        report_data.append(SurveyReportRow(
            response_id=resp.id,
            user_id=resp.user_id,
            username=username,
            sentiment=resp.sentiment,
            burnout_risk=resp.burnout_risk
        ))

    return report_data

# -----------------------------------------------------------------

# =================================================================
# 3. TEXT DATA ENDPOINT (FOR WORD CLOUDS)
# =================================================================
@app.get("/analysis/survey/{survey_id}/text-data")
def get_survey_text_data(survey_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Aggregates all text-based answers into a single string for further analysis 
    (e.g., Word Cloud generation) on the frontend.
    """
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized.")

    responses = db.query(SurveyResponse).filter(
        SurveyResponse.survey_id == survey_id
    ).all()

    if not responses:
        survey = db.query(Survey).filter(Survey.id == survey_id).first()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found.")
        return {"all_answers_text": ""}

    all_answers_list = []
    for resp in responses:
        # Answers are stored as a JSON string
        try:
            answers_dict = json.loads(resp.answers) # Load the raw JSON string
            # Concatenate all string values (the answers) from the dictionary
            # Note: This assumes all dictionary values are text answers.
            all_answers_list.extend(
                str(v) for v in answers_dict.values() if isinstance(v, str)
            )
        except json.JSONDecodeError:
            # Handle cases where the stored answers JSON is malformed
            print(f"Skipping bad JSON for response ID {resp.id}")
            continue

    # Join all text into one large string, separated by spaces
    all_answers_text = " ".join(all_answers_list)

    return {"all_answers_text": all_answers_text}
# -----------------------------------------------------------------

@app.get("/users/me", response_model=UserOut) # You might need a simplified Pydantic model here
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Retrieves the details of the currently authenticated user.
    """
    # The 'current_user' object already has the role field (admin or employee)
    print(current_user)
    return current_user

@app.get( # <--- Change from @router.get to @app.get
    "/employees/", 
    response_model=List[Employee], 
     
    status_code=status.HTTP_200_OK
)
async def read_employees(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user) 
):
    """
    Retrieves a list of all registered employees (users with role 'employee') 
    using the HTTP GET method.
    """
    # Assuming you have a CRUD function to filter users by role
    employees = get_users_by_role(db=db, role="employee")
    
    if not employees:
        return [] 
        
    return employees
# ==============================
# END OF FILE
# ==============================