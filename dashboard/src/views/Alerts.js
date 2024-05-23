// import React from "react";
import React, { useState, useEffect } from "react";
import { InfluxDB } from "@influxdata/influxdb-client";
// import classNames from "classnames";
// react plugin used to create charts
import  { Line } from "react-chartjs-2";
import {Chart, registerables} from "chart.js";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
// import 'chartjs-adapter-date-fns'; // Import the date adapter
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';

// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";

// core components
import { chartExample1 } from "variables/charts.js";
import dayjs from "dayjs";
import { symbolName } from "typescript";
const token =
  "ByyEkuioDW7FPp1kBt4S7gVewGoROmShs4xmyOAUWHk9zMEpSq-WuJHd-YGLN5zmvpZjOYtBS0XtNkfokItO2w==";
const org = "btp";
// const bucket = "sensor_data";
const url = "https://us-east-1-1.aws.cloud2.influxdata.com/";

Chart.register(...registerables);


function getQuery(start,end){
  return `from(bucket: "sensor_data")
  |> range(start: ${start.toISOString()},stop:${end.toISOString()})
  |> filter(fn: (r) => r._measurement == "my_measurement_webhook1")
  |> filter(fn: (r) =>r._field == "temperature" or r._field == "water_temperature" or r._field == "ph" or  r._field == "electrical_conductivity" or  r._field == "humidity" or r._field == "luminosity" or r._field == "tds")
  |>group(columns:["_time"])`;
}

let lbls = [
  "water_temperature",
  "electrical_conductivity",
  "humidity",
  "luminosity",
  "ph",
  "tds",
  "temperature",
];

let alert_options = {
    maintainAspectRatio: false,
    legend: {
      display: false,
    },
    tooltips: {
        // callbacks: {
        //     label: function(tooltipItem, data) {
        //       var datasetLabel = data.datasets[tooltipItem.datasetIndex].label || '';
        //       var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
        //       // Add your additional information here, for example:
        //       return datasetLabel + ': (' + value.x + ', ' + value.y + ', '+value.description+ ')';
        //     }
        // },
      backgroundColor: "#f5f5f5",
      titleFontColor: "#333",
      bodyFontColor: "#666",
      bodySpacing: 4,
      xPadding: 12,
      mode: "nearest",
      intersect: 0,
      position: "nearest",
    },
    responsive: true,
    scales: {
      // x:[{
      //   
      //   }},],
      y: {
        barPercentage: 1.6,
        gridLines: {
          drawBorder: false,
          color: "rgba(29,140,248,0.0)",
          zeroLineColor: "transparent",
        },
        ticks: {
          suggestedMin: 60,
          suggestedMax: 125,
          padding: 20,
          fontColor: "#9a9a9a",
        },
      },
      x: {
        type:"time",
        adapters: { 
          date: {
            locale: dayjs, 
          },
        time:{
          parser: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
        }},
        barPercentage: 1.6,
        gridLines: {
          drawBorder: false,
          color: "rgba(29,140,248,0.1)",
          zeroLineColor: "transparent",
        },
        ticks: {
          // padding: 20,
          // fontColor: "#9a9a9a",
          callback: function(value, index,values) {
                      // Show only one label after every 10 labels
                      // console.log(value,index)
                      // return index % 5 === 0 ? this.getLabelForValue(value) : '';
                      return "";
                  }
        },
      },
    }
  };

let obj = {
  labels: [],
  datasets: [
    {
      label: "My First dataset",
      fill: true,
      // backgroundColor: gradientStroke,
      borderColor: "#1f8ef1",
      borderWidth: 2,
      borderDash: [],
      borderDashOffset: 0.0,
      pointBackgroundColor: "#1f8ef1",
      pointBorderColor: "rgba(255,255,255,0)",
      pointHoverBackgroundColor: "#1f8ef1",
      pointBorderWidth: 20,
      pointHoverRadius: 4,
      pointHoverBorderWidth: 15,
      pointRadius: 4,
      data: [],
    },
  ],
};

function formatData(x_values, y_values, alerts) {
  return {
    
    // labels: x_values.map(x_values => {
    //   return new Date(x_values).getTime();
    // }),
    labels: x_values,
    datasets: [

    {
        label: "Alerts",
        fill: true,
        type:"scatter",
        // backgroundColor: gradientStroke,
        borderColor: "#1f8ef1",
        borderWidth: 2,
        borderDash: [],
        borderDashOffset: 0.0,
        pointBackgroundColor: "red",
        pointBorderColor: "rgba(255,255,255,0)",
        pointHoverBackgroundColor: "red",
        pointBorderWidth: 20,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 15,
        pointRadius: 4,
        data: alerts
          ,
        },
      {
        label: "My First dataset",
        fill: true,
        type:"line",
        // backgroundColor: gradientStroke,
        borderColor: "#1f8ef1",
        borderWidth: 2,
        borderDash: [],
        borderDashOffset: 0.0,
        pointBackgroundColor: "#1f8ef1",
        pointBorderColor: "rgba(255,255,255,0)",
        pointHoverBackgroundColor: "#1f8ef1",
        pointBorderWidth: 20,
        pointHoverRadius: 4,
        pointHoverBorderWidth: 15,
        pointRadius: 4,
        data: y_values,
        // scale: {
        //   x:{
        //     type: 'time',
        //     time: {
        //       unit: 'day'
        //     }
        //   },
        //   y: {
        //     min:20,
        //     max:100
        //   }
        // }
      },

      
      ],
  }
}



function AlertPage(props) {
  // let fetch_alerts = async (start, end, field) => {
  //   const url = `http://localhost:8000/alerts/?start=${start.toISOString()}&end=${end.toISOString()}&field=${field}`;

  //   try {
  //   let data = []
  //   fetch(url)
  //   .then(res=>res.json())
  //   .then(a=>{console.log(a);data=a['alerts'];})
  //     // const response = await fetch(url);
  //     // if (!response.ok) {
  //     //   throw new Error('Failed to fetch data');
  //     // }
  //     // const data = await response.json();
  //     for(let i=0;i<data.length;++i){
  //       data[i]["x"] = data[i]["timestamp"]
  //       data[i]["y"] = data[i]["current_value"]
  //     }
  //     console.log(data)
  //     return data;
      
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //     return [];
  //   }
  // }
  const [temperatureData, setTempData] = useState(obj);
  const [waterTemperatureData, setWaterTempData] = useState(obj);
  const [humidityData, setHumidityData] = useState(obj);
  const [phData, setPHData] = useState(obj);
  const [electricConductivityData, setElectricConductivityData] = useState(obj);
  const [tdsData, setTdsData] = useState(obj);
  const [luminosityData, setLuminosityData] = useState(obj);
  const [start, setStart] = useState(dayjs().subtract(15,"minutes"));
  const [end, setEnd] = useState(dayjs());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);
  useEffect(() => {
    let alerts = {}
    let fetch_alerts = async (start, end, field) => {
      const url = `http://localhost:8000/alerts/?start=${start.toISOString()}&end=${end.toISOString()}&field=${field}`;
  
      try {
      fetch(url)
      .then(res=>res.json())
      .then(a=>a['alerts'])
      .then((data)=>{for(let i=0;i<data.length;++i){
        data[i]["x"] = data[i]["timestamp"]
        data[i]["y"] = data[i]["current_value"]
      };alerts[field] = data;})
      // console.log(data)
      // alerts[field] = data})
        // const response = await fetch(url);
        // if (!response.ok) {
        //   throw new Error('Failed to fetch data');
        // }
        // const data = await response.json();
        // for(let i=0;i<data.length;++i){
        //   data[i]["x"] = data[i]["timestamp"]
        //   data[i]["y"] = data[i]["current_value"]
        // }
        // console.log(data)
        // alerts[field] = data
        
      } catch (error) {
        console.error('Error fetching data:', error);
        alerts[field] = []
        // return [];
      }
    }
    let t=0;
    
    fetch_alerts(start, end, "temperature");
    console.log(alerts)
    alerts["humidity"] = fetch_alerts(start, end, "humidity");
    alerts["tds"] = fetch_alerts(start, end, "tds");
    alerts["water_temperature"] = fetch_alerts(start, end, "water_temperature");
    alerts["ph"] = fetch_alerts(start, end, "ph");
    alerts["electrical_conductivity"] = fetch_alerts(start, end, "electrical_conductivity");
    alerts["luminosity"] = fetch_alerts(start, end, "luminosity");
    const intervalId = setInterval(() => {
      // let query = getQuery(field);
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
            // console.log(res);
            let data = {};
            for(let i=0;i<lbls.length;++i){
              data[lbls[i]] = { x: [], y: [] };
            }
            for (let i = 0; i < lbls.length; ++i) {
              data[lbls[i]] = { x: [], y: [] };
            }
            for (let i = 0; i < res.length; ++i) {
              data[res[i]["_field"]].x.push(res[i]["_time"]);
              data[res[i]["_field"]].y.push(res[i]["_value"]);
            }
            setTempData(
              formatData(
                data["temperature"].x,
                data["temperature"].y,
                alerts["temperature"]
              )
            );
            // console.log(temperatureData)
            setElectricConductivityData(
              formatData(
                data["electrical_conductivity"].x,
                data["electrical_conductivity"].y,
                alerts["electrical_conductivity"]
              )
            );
            setHumidityData(
              formatData(
                data["humidity"].x,
                data["humidity"].y,
                alerts["humidity"]
              )
            );
            setLuminosityData(
              formatData(
                data["luminosity"].x,
                data["luminosity"].y,
                alerts["luminosity"]
              )
            );
            setPHData(
              formatData(
                data["ph"].x,
                data["ph"].y,
                alerts["ph"]
              )
            );
            setWaterTempData(
              formatData(
                data["water_temperature"].x,
                data["water_temperature"].y,
                alerts["water_temperature"]
              )
            );
            setTdsData(
              formatData(
                data["tds"].x,
                data["tds"].y,
                alerts["tds"]
              )
            );
          },
          error(error) {
            // console.log("query failed- ", error);
            setTempData(formatData([],[]))
            setTdsData(formatData([],[]))
            setTempData(formatData([],[]))
            setLuminosityData(formatData([],[]))
            setHumidityData(formatData([],[]))
            setPHData(formatData([],[]))
            setElectricConductivityData(formatData([],[]))
            setWaterTempData(formatData([],[]))
          },
        });
      };
      influxQuery();
    }, 5000);
    return () => clearInterval(intervalId);
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
                      setEnd(dayjs());
                      setStart(dayjs().subtract(15, "minute"));
                    }}
                  >
                    Last 15Min
                  </DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem
                    onClick={() => {
                      setEnd(dayjs());
                      setStart(dayjs().subtract(1, "hour"));
                    }}
                  >
                    Last 1Hour
                  </DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem
                    onClick={() => {
                      setEnd(dayjs());
                      setStart(dayjs().subtract(1, "Day"));
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
      <Row>
        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">Temperature</CardTitle>
                  <h5 className="card-category">Celcius</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line
                  key={1}
                  data={temperatureData}
                  options={alert_options}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">Water Temperature</CardTitle>
                  <h5 className="card-category">Celcius</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line
                  key={1}
                  data={waterTemperatureData}
                  options={alert_options}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">Humidity</CardTitle>
                  <h5 className="card-category">Percentage</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line
                  key={1}
                  data={humidityData}
                  options={alert_options}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">pH</CardTitle>
                  <h5 className="card-category">ph</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line
                  key={1}
                  data={phData}
                  options={alert_options}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">Electrical Conductivity</CardTitle>
                  <h5 className="card-category">.</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line
                  key={1}
                  data={electricConductivityData}
                  options={alert_options}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">Luminosity</CardTitle>
                  <h5 className="card-category">Lumen</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line
                  key={1}
                  data={luminosityData}
                  options={alert_options}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">TDS</CardTitle>
                  <h5 className="card-category"></h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line
                  key={1}
                  data={tdsData}
                  options={alert_options}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        {/* <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">Humidity</CardTitle>
                  <h5 className="card-category">Percentage</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line data={humidityData} options={chartExample1.options} />
              </div>
            </CardBody>
          </Card>
        </Col>
        {/* <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">CO2 Concetration</CardTitle>
                  <h5 className="card-category">PPM</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line data={co2Data} options={chartExample1.options} />
              </div>
            </CardBody>
          </Card>
        </Col> */}
        {/* <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">Luminosity</CardTitle>
                  <h5 className="card-category">Lumen</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line data={luminosityData} options={chartExample1.options} />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">PH</CardTitle>
                  <h5 className="card-category">.</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line data={phData} options={chartExample1.options} />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">Electric Conductivity</CardTitle>
                  <h5 className="card-category">.</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line
                  data={electricConductivityData}
                  options={chartExample1.options}
                />
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">Water Temperature</CardTitle>
                  <h5 className="card-category">Celcius</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line
                  data={waterTemperatureData}
                  options={chartExample1.options}
                />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xs="6">
          <Card className="card-chart">
            <CardHeader>
              <Row>
                <Col className="text-left" sm="6">
                  <CardTitle tag="h2">TDS</CardTitle>
                  <h5 className="card-category">Celcius</h5>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Line data={tdsData} options={chartExample1.options} />
              </div>
            </CardBody>
          </Card>
        </Col> */}
      </Row>
    </div>
  );
}
export default AlertPage;
