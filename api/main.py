import os
from typing import Optional, List
from datetime import datetime
from fastapi import FastAPI, Body, HTTPException, status
from fastapi.responses import Response
from pydantic import ConfigDict, BaseModel
from pydantic.functional_validators import BeforeValidator

from typing_extensions import Annotated

from bson import ObjectId
import motor.motor_asyncio
from pymongo import ReturnDocument

from models import ThresholdCollection,ThresholdModel,UpdateThresholdModel,AlertCollection,AlertModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# client = motor.motor_asyncio.AsyncIOMotorClient("mongodb+srv://0im6580:pass123@cluster0.qijz9ps.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
db = client.get_database("mydb")
threshold_collection = db.get_collection("thresholds")
alert_collection = db.get_collection("alerts")

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.
PyObjectId = Annotated[str, BeforeValidator(str)]


# class UpdateStudentModel(BaseModel):
#     """
#     A set of optional updates to be made to a document in the database.
#     """

#     name: Optional[str] = None
#     email: Optional[EmailStr] = None
#     course: Optional[str] = None
#     gpa: Optional[float] = None
#     model_config = ConfigDict(
#         arbitrary_types_allowed=True,
#         json_encoders={ObjectId: str},
#         json_schema_extra={
#             "example": {
#                 "name": "Jane Doe",
#                 "email": "jdoe@example.com",
#                 "course": "Experiments, Science, and Fashion in Nanophotonics",
#                 "gpa": 3.0,
#             }
#         },
#     )






@app.post(
    "/thresholds/",
    response_description="Add new student",
    response_model=ThresholdModel,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def create_threshold(student: ThresholdModel = Body(...)):
    """
    Insert a new student record.

    A unique `id` will be created and provided in the response.
    """
    new_student = await threshold_collection.insert_one(
        student.model_dump(by_alias=True, exclude=["id"])
    )
    created_student = await threshold_collection.find_one(
        {"_id": new_student.inserted_id}
    )
    return created_student


@app.get(
    "/thresholds/",
    response_description="List all students",
    response_model=ThresholdCollection,
    response_model_by_alias=False,
)
async def list_thresholds():
    """
    List all of the student data in the database.

    The response is unpaginated and limited to 1000 results.
    """
    return ThresholdCollection(thresholds=await threshold_collection.find().to_list(10))


@app.get(
    "/thresholds/{id}",
    response_description="Get a single student",
    response_model=ThresholdModel,
    response_model_by_alias=False,
)
async def show_threshold(id: str):
    """
    Get the record for a specific student, looked up by `id`.
    """
    if (
        threshold := await threshold_collection.find_one({"_id": ObjectId(id)})
    ) is not None:
        return threshold

    raise HTTPException(status_code=404, detail=f"Student {id} not found")


@app.put(
    "/thresholds/{id}",
    response_description="Update a student",
    response_model=ThresholdModel,
    response_model_by_alias=False,
)
async def update_threshold(id: str, student: UpdateThresholdModel = Body(...)):
    """
    Update individual fields of an existing student record.

    Only the provided fields will be updated.
    Any missing or `null` fields will be ignored.
    """
    threshold = {
        k: v for k, v in threshold.model_dump(by_alias=True).items() if v is not None
    }

    if len(threshold) >= 1:
        update_result = await threshold_collection.find_one_and_update(
            {"_id": ObjectId(id)},
            {"$set": student},
            return_document=ReturnDocument.AFTER,
        )
        if update_result is not None:
            return update_result
        else:
            raise HTTPException(status_code=404, detail=f"Student {id} not found")

    # The update is empty, but we should still return the matching document:
    if (existing_threshold := await threshold_collection.find_one({"_id": id})) is not None:
        return existing_threshold

    raise HTTPException(status_code=404, detail=f"Student {id} not found")


@app.delete("/thresholds/{id}", response_description="Delete a student")
async def delete_threshold(id: str):
    """
    Remove a single student record from the database.
    """
    delete_result = await threshold_collection.delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    raise HTTPException(status_code=404, detail=f"Student {id} not found")



@app.post(
    "/alerts/",
    response_description="Add new alert",
    response_model=AlertModel,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def create_alert(alert: AlertModel = Body(...)):
    """
    Insert a new student record.

    A unique `id` will be created and provided in the response.
    """
    new_student = await alert_collection.insert_one(
        alert.model_dump(by_alias=True, exclude=["id"])
    )
    created_student = await threshold_collection.find_one(
        {"_id": new_student.inserted_id}
    )
    return created_student


@app.get(
    "/alerts/",
    response_description="List all alerts",
    response_model=AlertCollection,
    response_model_by_alias=False,
)
async def list_alerts(start :datetime,end:datetime,field:str):
    """
    List all of the student data in the database.

    The response is unpaginated and limited to 1000 results.
    """
    # return AlertCollection(alerts=await alert_collection.find().to_list(10)).
    print(start,end,field)
    query = {
        "timestamp": {
            "$gte": start,
            "$lte": end
        },
        "field":field
    }
    alerts = await alert_collection.find(query).to_list(None)
    # alerts = []
    return AlertCollection(alerts=alerts)
    return "hello"


@app.get(
    "/alerts/{id}",
    response_description="Get a single alert",
    response_model=AlertModel,
    response_model_by_alias=False,
)
async def show_alert(id: str):
    """
    Get the record for a specific student, looked up by `id`.
    """
    if (
        alert := await alert_collection.find_one({"_id": ObjectId(id)})
    ) is not None:
        return alert

    raise HTTPException(status_code=404, detail=f"Alert {id} not found")

@app.post(
    "/alerts_batch/",
    response_description="Add new alerts",
    response_model=List[AlertModel],
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
async def create_alerts_batch(alerts: List[AlertModel] = Body(...)):
    """
    Insert new alert records.
    Unique `id`s will be created and provided in the response.
    """
    result = await alert_collection.insert_many(
        [alert.model_dump(by_alias=True, exclude=["id"]) for alert in alerts]
    )
    created_alerts = []
    for insert_result in result.inserted_ids:
        created_alert = await alert_collection.find_one({"_id": insert_result})
        created_alerts.append(created_alert)
    return created_alerts