import React, { useState, useEffect } from "react";
import {
  Table, Button
} from "reactstrap";
import { Link } from "react-router-dom";


function ThresholdTable(props) {
  const [data, setData] = useState([]);
//   let fetch_thresholds = async () => {
//     const url = `http://localhost:8000/thresholds/`;

//     try {
//       const response = await fetch(url);
//       if (!response.ok) {
//         throw new Error('Failed to fetch data');
//       }
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       return {'thresholds':[]};
//     }
//   }
//   useEffect(() => {
//     let res = fetch_thresholds();
//     setData(res['thresholds']);
//     console.log(res['thresholds']);
//     console.log(data);

// },[])

useEffect(() => {
    const fetchData = async () => {
      try {
         fetch('http://localhost:8000/thresholds/')
        .then((res)=> res.json())
        .then((d)=>setData(d['thresholds']))  
       
        
        console.log(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="content">
      
      <Table size="lg">
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Limit</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id}>
              <td>{row.field}</td>
              <td>{row.type}</td>
              <td>{row.limit}</td>
              {/* <td>
                <Link to={`/EditThreshold/${row.id}`}>
                  <Button>Edit</Button>
                </Link>
              </td> */}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
export default ThresholdTable;
