from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from pydantic import ConfigDict, BaseModel, Field
from pydantic.functional_validators import BeforeValidator
from bson import ObjectId

from typing_extensions import Annotated
PyObjectId = Annotated[str, BeforeValidator(str)]
# # Threshold Model
# class Threshold(BaseModel):
#     field: str
#     limit: float
#     type: str  # "high" or "low"


# # Alert Model
# class Alert(BaseModel):
#     timestamp: datetime
#     current_value: float
#     field: str
#     limit: float
#     type: str  # "high" or "low"


class ThresholdModel(BaseModel):
    """
    Container for a single threshold record.
    """

    # The primary key for the StudentModel, stored as a `str` on the instance.
    # This will be aliased to `_id` when sent to MongoDB,
    # but provided as `id` in the API requests and responses.
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    field: str = Field(...)
    type: str = Field(...)
    limit: float = Field(...)
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "field": "temperature",
                "type": "high",
                "limit": 25,
            }
        },
    )

class UpdateThresholdModel(BaseModel):
    """
    Container for a single threshold record.
    """

    # The primary key for the StudentModel, stored as a `str` on the instance.
    # This will be aliased to `_id` when sent to MongoDB,
    # but provided as `id` in the API requests and responses.\
    field: Optional[str] = None
    type: Optional[str] = None
    limit: Optional[float] = None
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
        json_schema_extra={
            "example": {
                "field": "temperature",
                "type": "high",
                "limit": 25,
            }
        },
    )


class AlertModel(BaseModel):
    """
    Container for a single threshold record.
    """

    # The primary key for the StudentModel, stored as a `str` on the instance.
    # This will be aliased to `_id` when sent to MongoDB,
    # but provided as `id` in the API requests and responses.
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    timestamp: datetime = Field(...)
    field: str = Field(...)
    type: str = Field(...)
    current_value: float = Field(...)
    limit: float = Field(...)
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "timestamp": datetime.now(),
                "field": "temperature",
                "type": "high",
                "current_value": 26,
                "limit": 25,
            }
        },
    )





class ThresholdCollection(BaseModel):
    """
    A container holding a list of `ThresholdModel` instances.

    This exists because providing a top-level array in a JSON response can be a [vulnerability](https://haacked.com/archive/2009/06/25/json-hijacking.aspx/)
    """

    thresholds: List[ThresholdModel]

class AlertCollection(BaseModel):

    alerts: List[AlertModel]


