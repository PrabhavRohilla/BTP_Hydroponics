import React, { useState, useEffect } from "react";
import { InfluxDB } from "@influxdata/influxdb-client";
import {
  Table,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Card,
  CardHeader,
  // CardBody,
  Row,
  Col,
  CardTitle,
} from "reactstrap";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
const token =
  "ByyEkuioDW7FPp1kBt4S7gVewGoROmShs4xmyOAUWHk9zMEpSq-WuJHd-YGLN5zmvpZjOYtBS0XtNkfokItO2w==";
const org = "btp";
// const bucket = "sensor_data";
const url = "https://us-east-1-1.aws.cloud2.influxdata.com/";

function getQuery(start,end){
  return `from(bucket: "sensor_data")
  |> range(start: ${start.toISOString()},stop:${end.toISOString()})
  |> filter(fn: (r) => r._measurement == "my_measurement_webhook1")
  |> filter(fn: (r) =>r._field == "temperature" or r._field == "water_temperature" or r._field == "ph" or  r._field == "electrical_conductivity" or  r._field == "humidity" or  r._field == "temperature" or r._field == "luminosity" or r._field == "tds")
  |>group(columns:["_time"])`;
}


function DataTable(props) {
  const [data, setData] = useState([]);
  const [start, setStart] =useState(dayjs().subtract(15, "minutes")); 
  const [end, setEnd] = useState(dayjs());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);
  useEffect(() => {
    let res = [];
    const influxQuery = async () => {
      //create InfluxDB client
      const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);
      //make query
      let query = getQuery(start,end)
      await queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          res.push(o);
        },
        complete() {
          let n = res[res.length - 1]["table"] + 1;
          console.log(res);
          let finalData = new Array(n);
          for (let i = 0; i < res.length; ++i) {
            let t = res[i]["table"];
            if (finalData[t] == null) {
              finalData[t] = {};
              finalData[t]["timestamp"] = res[i]["_time"];
            }
            finalData[t][res[i]["_field"]] = res[i]["_value"];
          }
          console.log(finalData);
          setData(finalData);
        },
        error(error) {
          console.log("query failed- ", error);
            setData([])
        },
      });
    };
    influxQuery();
  }, [start,end]);

  return (
    <div className="content">
      <Row>
        <Card className="p-4">
          <CardHeader>
            <Row>
              <Col className="text-left" sm="6">
                <CardTitle tag="h3">Select Time Range</CardTitle>
              </Col>
            </Row>
          </CardHeader>
          <Row>
            <Col>
              <Dropdown isOpen={dropdownOpen} toggle={toggle}>
                <DropdownToggle caret> Quick select</DropdownToggle>
                <DropdownMenu>
                  <DropdownItem
                    onClick={() => {
                      setStart(dayjs().subtract(15, "minute"));
                      setEnd(dayjs())
                    }}
                  >
                    Last 15Min
                  </DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem
                    onClick={() => {
                      setStart(dayjs().subtract(1, "hour"));
                      setEnd(dayjs())
                    }}
                  >
                    Last 1Hour
                  </DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem
                    onClick={() => {
                      setStart(dayjs().subtract(1, "Day"));
                      setEnd(dayjs())
                    }}
                  >
                    Last 1Day
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </Col>

            <Col>
              <Row>
                <Col>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label="Select Start"
                      value={start}
                      onChange={(newValue) => setStart(newValue)}
                    />
                  </LocalizationProvider>
                </Col>
                <Col>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label="Select End"
                      value={end}
                      onChange={(newValue) => setEnd(newValue)}
                    />
                  </LocalizationProvider>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </Row>
      <Table size="lg">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Temperature</th>
            <th>Humidity</th>
            <th>PH</th>
            <th>Electric Conductivity</th>
            <th>Water Temperature</th>
            <th>Luminosity</th>
            <th>TDS</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <th scope="row">{row["timestamp"]}</th>
              <td>{row["temperature"]}</td>
              <td>{row["humidity"]}</td>
              <td>{row.ph}</td>
              <td>{row.electrical_conductivity}</td>
              <td>{row.Water_temperature}</td>
              <td>{row.luminosity}</td>
              <td>{row.tds}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
export default DataTable;
