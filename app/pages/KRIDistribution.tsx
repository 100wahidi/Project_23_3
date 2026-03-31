import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { apiFetch } from '../utils/apiFetch';
import { PivotTable } from '../components/PivotTable';
import { SummaryCard } from '../components/SummaryCard';

const KRIDistribution = () => {
    const [distributionData, setDistributionData] = useState([]);
    const [statsData, setStatsData] = useState({ breaches_number: 0, most_freq_breach: '' });
    const [timeColumn, setTimeColumn] = useState('');
    const [kriLike, setKriLike] = useState('');
    const [kriFilters, setKriFilters] = useState('');

    useEffect(() => {
        fetchKRIStats();
        fetchKRIDistribution();
    }, [timeColumn, kriLike, kriFilters]);

    const fetchKRIStats = async () => {
        const response = await apiFetch('/kri/stats');
        setStatsData(response);
    };

    const fetchKRIDistribution = async () => {
        const response = await apiFetch(`/kri/distribution?time_column=${timeColumn}&kri_like=${kriLike}&kri_filters=${kriFilters}`);
        setDistributionData(response);
    };

    return (
        <DashboardLayout>
            <div>
                <h1>KRI Distribution</h1>
                <SummaryCard title="Breaches Number" value={statsData.breaches_number} />
                <SummaryCard title="Most Frequent Breach" value={statsData.most_freq_breach} />
                <div>
                    <input type="text" value={timeColumn} onChange={e => setTimeColumn(e.target.value)} placeholder="Select Time Column" />
                    <input type="text" value={kriLike} onChange={e => setKriLike(e.target.value)} placeholder="KRI Like Filter" />
                    <input type="text" value={kriFilters} onChange={e => setKriFilters(e.target.value)} placeholder="Comma-separated KRI Filters" />
                </div>
                <PivotTable data={distributionData} />
            </div>
        </DashboardLayout>
    );
};

export default KRIDistribution;
