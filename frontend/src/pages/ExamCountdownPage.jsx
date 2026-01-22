import React, { useState, useEffect } from 'react';
import ExamCountdownSection from '../sections/ExamCountdownSection';
import { useAuth } from '../context/AuthContext';

const ExamCountdownPage = () => {
    const { currentUser } = useAuth();
    const [dates, setDates] = useState({ startDate: null, endDate: null });

    useEffect(() => {
        const fetchScheduleDates = async () => {
            if (!currentUser) return;
            
            try {
                const response = await fetch(`/api/syllabus/all-schedules/${currentUser.uid}`);
                const data = await response.json();
                
                if (data.success && data.schedulesBySubject) {
                    // Get all dates from all schedules
                    const allDates = [];
                    Object.values(data.schedulesBySubject).forEach(schedule => {
                        schedule.forEach(day => {
                            allDates.push(new Date(day.date));
                        });
                    });
                    
                    if (allDates.length > 0) {
                        const minDate = new Date(Math.min(...allDates));
                        const maxDate = new Date(Math.max(...allDates));
                        setDates({
                            startDate: minDate.toISOString(),
                            endDate: maxDate.toISOString()
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch schedule dates:', error);
            }
        };

        fetchScheduleDates();
    }, [currentUser]);

    return (
        <div className="min-h-screen">
            <ExamCountdownSection 
                startDate={dates.startDate} 
                endDate={dates.endDate} 
            />
        </div>
    );
};

export default ExamCountdownPage;
