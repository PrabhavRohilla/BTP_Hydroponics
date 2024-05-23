import React, { useState } from 'react';
import { Button, Form, FormGroup, Label, Input } from 'reactstrap';

function ThresholdForm() {
  const [formData, setFormData] = useState({
    field: '',
    limit: '',
    type: ''
  });

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/thresholds/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        throw new Error('Failed to add threshold');
      }
      // Clear form data after successful submission
      setFormData({
        field: '',
        limit: '',
        type: ''
      });
      alert('Threshold added successfully!');
    } catch (error) {
      console.error('Error adding threshold:', error);
      alert('Failed to add threshold');
    }
  };

  return (
    <div className='content'>
      <h3>Add Threshold</h3>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label for="field">Field</Label>
          <Input
            type="select"
            name="field"
            id="field"
            value={formData.field}
            onChange={handleChange}
            required
          >
            <option value="">Select Field</option>
            <option value="water_temperature">Water Temperature</option>
            <option value="electrical_conductivity">Electrical Conductivity</option>
            <option value="humidity">Humidity</option>
            <option value="luminosity">Luminosity</option>
            <option value="ph">PH</option>
            <option value="tds">TDS</option>
            <option value="temperature">Temperature</option>
          </Input>
        </FormGroup>
        <FormGroup>
          <Label for="limit">Limit</Label>
          <Input
            type="number"
            name="limit"
            id="limit"
            value={formData.limit}
            onChange={handleChange}
            required
          />
        </FormGroup>
        <FormGroup>
          <Label for="type">Type</Label>
          <Input
            type="select"
            name="type"
            id="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="">Select Type</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </Input>
        </FormGroup>
        <Button type="submit" color="primary">Submit</Button>
      </Form>
    </div>
  );
}

export default ThresholdForm;
