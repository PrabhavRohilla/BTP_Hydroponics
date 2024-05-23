import influxdb_client
import schedule
import time
import requests



bucket = "sensor_data"
org = "btp"
token="this will be given"
url = "https://us-east-1-1.aws.cloud2.influxdata.com/"
client = influxdb_client.InfluxDBClient(
   url=url,
   token=token,
   org=org
)
time_period = 0.5 #10 minutes
query_api = client.query_api()

# Abstract function to fetch thresholds
def fetch_thresholds():
    # Implement this function according to your needs
    # For example, you can read thresholds from a configuration file or retrieve them from an API
    # Return thresholds as a list of dictionaries with keys 'field', 'limit', and 'type'
    thresholds =[]
    try:
        response = requests.get("http://localhost:8000/thresholds/")  # Replace "http://localhost:8000" with the actual URL of your FastAPI server
        response.raise_for_status()  # Raise an error if the request was not successful
        thresholds = response.json()["thresholds"]  # Parse the JSON response
        return thresholds
    except requests.RequestException as e:
        # Handle request exceptions
        print(f"Error fetching thresholds: {e}")
        return []

def get_query(field):
   return f"""from(bucket: "sensor_data")\
  |> range(start: 2024-02-24T00:00:00.000Z)\
  |> filter(fn: (r) =>r._field == \"{field}\")"""

class AlertStore:
    def __init__(self,lim):
        self.arr= []
        self.lim= lim

    def send(self):
        try:
            response = requests.post(self.url, json=self.arr)
            response.raise_for_status()
            print(f"Successfully sent {len(self.arr)} alerts to {self.url}")
        except requests.exceptions.RequestException as e:
            print(f"Error sending alerts to {self.url}: {e}")
        finally:
            self.arr.clear()

    def append(self,alert):
        print(alert)
        self.arr.append(alert)
        if len(self.arr) == self.lim:
            self.send()
            self.arr.clear()

def generate_alerts():
    thresholds = fetch_thresholds()
    alerts = AlertStore(10)
    for threshold in thresholds:
        query = get_query(threshold['field'])
        try:
            result = query_api.query(org=org, query=query)        
            for record in result[0]:
                if threshold["type"] == "high" and record.get_value()>threshold["limit"]:
                    alerts.append({
                        "timestamp":record.get_time(),
                        "type": "high",
                        "field": threshold['field'],
                        "current_value": record.get_value(),
                        "threshold": threshold['limit']
                    })
                elif threshold["type"] == "low" and record.get_value()<threshold["limit"]:
                    alerts.append({
                        "timestamp":record.get_time(),
                        "type": "low",
                        "field": threshold['field'],
                        "current_value": record.get_value(),
                        "threshold": threshold['limit']
                    })
        except:
            print("query failed")




schedule.every(time_period).minutes.do(generate_alerts)
while True:
    schedule.run_pending()
    time.sleep(1)