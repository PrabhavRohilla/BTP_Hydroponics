from typing import Union,Dict
import influxdb_client
from influxdb_client.client.write_api import SYNCHRONOUS
from dateutil import parser
from fastapi import FastAPI,HTTPException


app = FastAPI()

last_values: Dict[str, float] = {}
bucket = "sensor_data"
org = "btp"
token="0rIUgw8MR8HN9SbxCyHmTZNdWZZ0ZGF_qxeTLUSDevJfaDsNYe2Gl5rbXOPzUpocl9-4hLsAY_9Y_nBXmeP28g=="
url = "https://us-east-1-1.aws.cloud2.influxdata.com/"
client = influxdb_client.InfluxDBClient(
   url=url,
   token=token,
   org=org
)
write_api = client.write_api(write_options=SYNCHRONOUS)

class Consumer:
    def __init__(self ,influx_write_api):
        self.influx_write_api = influx_write_api
        self.ref_value = None
        self.target_fields = ["temperature","humidity","ph","tds","electrical_conductivity","water_temperature","luminosity"]

    def write(self,val):
        p =  influxdb_client.Point("my_measurement_webhook1")
        p.field("temperature",float(val["temperature"]))
        p.field("humidity",float(val["humidity"]))
        p.field("ph",float(val["ph"]))
        p.field("tds",float(val["tds"]))
        p.field("electrical_conductivity",float(val["electrical_conductivity"]))
        # p.field("CO2_level",float(val["CO2_level"]))
        p.field("water_temperature",float(val["water_temperature"]))
        p.field('luminosity',float(val['luminosity']))
        print("@@@@@@@")
        p.time(val["timestamp"])
        write_api.write(bucket=bucket, org=org, record=p)
    
    def write2(self,actual_val,constructed_val,timestamp):
        p =  influxdb_client.Point("Error Analysis")
        p.field("temperature",float(actual_val["temperature"]))
        p.field("humidity",float(actual_val["humidity"]))
        p.field("ph",float(actual_val["ph"]))
        p.field("tds",float(actual_val["tds"]))
        p.field("electrical_conductivity",float(actual_val["electrical_conductivity"]))
        # p.field("CO2_level",float(actual_val["CO2_level"]))
        p.field("water_temperature",float(actual_val["water_temperature"]))
        p.field('luminosity',float(actual_val['luminosity']))

        # p =  influxdb_client.Point("Error Analysis")
        p.field("constructed_temperature",float(constructed_val["temperature"]))
        p.field("constructed_humidity",float(constructed_val["humidity"]))
        p.field("constructed_ph",float(constructed_val["ph"]))
        p.field("constructed_tds",float(constructed_val["tds"]))
        p.field("constructed_electrical_conductivity",float(constructed_val["electrical_conductivity"]))
        # p.field("constructed_CO2_level",float(constructed_val["CO2_level"]))
        p.field("constructed_water_temperature",float(constructed_val["water_temperature"]))
        p.field('constructed_luminosity',float(constructed_val['luminosity']))
        print("@@@@@@@")
        p.time(timestamp)
        write_api.write(bucket=bucket, org=org, record=p)
    

    def consume_type1(self,actual_value):
        self.ref_value = actual_value
        print("updating ref: ",self.ref_value)
        self.write(actual_value)

    # def parse(packet):
        
    
    def consume_type2(self,delta):
        actual_value = {}
        actual_value["timestamp"] = delta["timestamp"]
        print(self.ref_value)
        for field,value  in delta.items():
            if field in self.target_fields:
                value = self.ref_value[field]*(1+value/100)
            actual_value[field] = value
        print("Constructed values: ",actual_value)
        self.write(actual_value)
    
    def consume_type3(self,delta,actual,timestamp):
        constructed = {}
        for field,value  in delta.items():
            if field in self.target_fields:
                value = self.ref_value[field]*(1+value/100)
            constructed[field] = value
        self.write2(actual,delta,timestamp)
        
def parse(packet:dict):
    res = packet["uplink_message"]["decoded_payload"]
    res["timestamp"] = packet["received_at"]
    return res

cc = Consumer(write_api) 

@app.post("/webhook")
def consume(packet:dict):
    if "uplink_message" in packet and "decoded_payload" in packet["uplink_message"]:
        packet = parse(packet)
        print(packet)
        if packet["type"]==1:
            cc.consume_type1(packet)
        elif packet["type"]==2:
            cc.consume_type2(packet)
        # else:
        #     cc.consume_type3(packet["delta"] , packet["actual"],packet["timestamp"])

