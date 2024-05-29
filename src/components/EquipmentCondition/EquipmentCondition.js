import React from 'react';
import './EquipmentCondition.css';
import { Link } from 'react-router-dom';

const EquipmentCondition = ({ data }) => {
  console.log('EquipmentCondition data:', data); // Log received data

  const getConditionClass = (condition) => {
    if (condition === 'Attention Required') {
      return 'attention-required';
    } else if (condition === 'Normal') {
      return 'normal';
    }
    return '';
  };

  const getStatusClass = (status) => {
    if (status === 'Running') {
      return 'status-running';
    }
    return '';
  };

  return (
    <div className="container-EC">
      <Link to="/EquipmentConditionDetail" className="link">
        <div className="equipment-condition">
          <h3>Equipment Condition</h3>
          <table>
            <thead>
              <tr>
                <th>Machine</th>
                <th>Status</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{item.machine}</td>
                  <td><span className={`status ${getStatusClass(item.status)}`}>{item.status}</span></td>
                  <td><span className={`condition ${getConditionClass(item.condition)}`}>{item.condition}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Link>
    </div>
  );
};

export default EquipmentCondition;
