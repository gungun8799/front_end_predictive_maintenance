import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './StaticMatrix.css';
import { Link } from 'react-router-dom';
import { format, subMinutes, subHours, subDays, subMonths, isValid } from 'date-fns';


const formatData = (data, displayOption) => {
  switch (displayOption) {
    case 'minute':
      return data.filter((entry) => new Date(entry.time) >= subMinutes(new Date(), 60));
    case 'hourly':
      return data.filter((entry) => new Date(entry.time) >= subHours(new Date(), 24));
    case 'daily':
      return data.filter((entry) => new Date(entry.time) >= subDays(new Date(), 7));
    case 'monthly':
      return data.filter((entry) => new Date(entry.time) >= subMonths(new Date(), 12));
    default:
      return data;
  }
};

const StaticMatrix = ({ data }) => {
  const [chartData, setChartData] = useState(() => {
    const savedData = localStorage.getItem('chartData');
    return savedData ? JSON.parse(savedData) : [];
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [displayOption, setDisplayOption] = useState(() => {
    const savedDisplayOption = localStorage.getItem('displayOption');
    return savedDisplayOption ? savedDisplayOption : 'hourly';
  });
  const [xAxisDomain, setXAxisDomain] = useState(['auto', 'auto']);
  const chartRef = useRef(null);

  useEffect(() => {
    const processData = () => {
      const newData = [];
      const currentTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const averages = {
        vibration: 0,
        temperature: 0,
        noise_frequency: 0,
      };
      let count = 0;

      Object.values(data).forEach((values) => {
        averages.vibration += values.vibration;
        averages.temperature += values.temperature;
        averages.noise_frequency += values.noise_frequency;
        count++;
      });

      if (count > 0) {
        averages.vibration /= count;
        averages.temperature /= count;
        averages.noise_frequency /= count;

        // Adding larger hypothetical fluctuations
        averages.vibration += (Math.random() - 0.5) * 0.5;
        averages.temperature += (Math.random() - 0.5) * 2;
        averages.noise_frequency += (Math.random() - 0.5) * 5;
      }

      // Only add data if averages are not zero
      if (averages.vibration !== 0 || averages.temperature !== 0 || averages.noise_frequency !== 0) {
        newData.push({
          time: currentTime,
          vibration: parseFloat(averages.vibration.toFixed(2)),
          temperature: parseFloat(averages.temperature.toFixed(2)),
          noise_frequency: parseFloat(averages.noise_frequency.toFixed(2)),
        });

        setChartData((prevChartData) => {
          const updatedData = [...prevChartData, ...newData];
          localStorage.setItem('chartData', JSON.stringify(updatedData));
          return updatedData;
        });
      }
    };

    processData();
  }, [data]);

  const filterData = () => {
    const filteredData = chartData.filter((entry) => {
      const entryTime = new Date(entry.time).getTime();
      const startTime = startDate ? new Date(startDate).getTime() : null;
      const endTime = endDate ? new Date(endDate).getTime() : null;

      return (!startTime || entryTime >= startTime) && (!endTime || entryTime <= endTime);
    });
    return formatData(filteredData, displayOption);
  };

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    if (!isValid(date)) return ''; // Return empty string if the date is invalid

    switch (displayOption) {
      case 'minute':
        return format(date, 'HH:mm');
      case 'hourly':
        return format(date, 'dd/MM HH:mm');
      case 'daily':
        return format(date, 'dd/MM');
      case 'monthly':
        return format(date, 'MMM yyyy');
      default:
        return tickItem;
    }
  };

  const handleDisplayOptionChange = (e) => {
    const newDisplayOption = e.target.value;
    setDisplayOption(newDisplayOption);
    localStorage.setItem('displayOption', newDisplayOption);
  };

  const handleScroll = (e) => {
    e.preventDefault();
    const { deltaY } = e;

    if (chartRef.current) {
      const domain = chartRef.current.props.data.map((d) => new Date(d.time).getTime());
      const min = Math.min(...domain);
      const max = Math.max(...domain);

      const currentDomain = xAxisDomain.map((d) => new Date(d).getTime());
      const newDomain = [
        new Date(Math.max(min, currentDomain[0] + deltaY * 60 * 1000)),
        new Date(Math.min(max, currentDomain[1] + deltaY * 60 * 1000)),
      ];

      setXAxisDomain(newDomain.map((d) => d.toLocaleString()));
    }
  };

  useEffect(() => {
    const chartContainer = chartRef.current && chartRef.current.container;

    if (chartContainer) {
      chartContainer.addEventListener('wheel', handleScroll);

      return () => {
        chartContainer.removeEventListener('wheel', handleScroll);
      };
    }
  }, [chartRef.current]);

  return (
    <div className="static-matrix-SM">
      <div className="filter-container-2">
        <label>
          Start Date:
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date:
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>
      <div className="dropdown-container-sm">
        <label htmlFor="display-option">Display: </label>
        <select
          id="display-option"
          value={displayOption}
          onChange={handleDisplayOptionChange}
        >
          <option value="minute">Minutes</option>
          <option value="hourly">Hours</option>
          <option value="daily">Days</option>
          <option value="monthly">Months</option>
        </select>
      </div>
      <Link to="/OperatingEnvironment" className="link">
        <h3 className="matrix-heading">Average Operating Environment (All machines)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={filterData()}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
            ref={chartRef}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tickFormatter={formatXAxis} domain={xAxisDomain} />
            <YAxis yAxisId="left" stroke="#8884d8" />
            <YAxis yAxisId="middle" orientation="right" stroke="#82ca9d" />
            <YAxis yAxisId="right" orientation="right" stroke="#ffc658" offset={80} />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="vibration"
              stroke="#8884d8"
              name="Average Vibration"
              dot={false}
            />
            <Line
              yAxisId="middle"
              type="monotone"
              dataKey="temperature"
              stroke="#82ca9d"
              name="Average Temperature"
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="noise_frequency"
              stroke="#ffc658"
              name="Average Noise Frequency"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Link>
    </div>
  );
};

export default StaticMatrix
