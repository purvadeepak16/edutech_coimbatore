/**
 * Generate daily study schedule by distributing topics across dates
 * @param {Array} units - Syllabus units with topics
 * @param {Date} startDate - Study start date
 * @param {Date} endDate - Study end date
 * @param {Array} excludeTopicIds - Topic IDs to exclude (already assigned)
 * @returns {Array} Daily schedule with date and topics
 */
export function generateDailySchedule(units, startDate, endDate, excludeTopicIds = []) {
  const excludeSet = new Set(excludeTopicIds);
  
  // Calculate total days available
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Flatten all topics from all units, excluding already assigned ones
  const allTopics = [];
  units.forEach(unit => {
    unit.topics.forEach(topic => {
      if (!excludeSet.has(topic.id)) {
        allTopics.push({
          ...topic,
          unitName: unit.name,
          unitId: unit.id
        });
      }
    });
  });

  const totalTopics = allTopics.length;
  
  if (totalTopics === 0) {
    return []; // No topics to assign
  }
  
  // Calculate topics per day (distribute evenly)
  const topicsPerDay = Math.ceil(totalTopics / totalDays);

  // Generate daily schedule
  const dailySchedule = [];
  let topicIndex = 0;
  let currentDate = new Date(start);

  for (let day = 0; day < totalDays && topicIndex < totalTopics; day++) {
    const dayTopics = [];
    const dayTopicIds = [];
    const topicsForToday = Math.min(topicsPerDay, totalTopics - topicIndex);

    for (let i = 0; i < topicsForToday && topicIndex < totalTopics; i++) {
      const topic = allTopics[topicIndex];
      dayTopics.push(topic);
      dayTopicIds.push(topic.id);
      topicIndex++;
    }

    if (dayTopics.length > 0) {
      dailySchedule.push({
        date: new Date(currentDate).toISOString().split('T')[0],
        dateObject: new Date(currentDate),
        day: day + 1,
        topics: dayTopics,
        topicIds: dayTopicIds,
        topicCount: dayTopics.length,
        units: [...new Set(dayTopics.map(t => t.unitName))]
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dailySchedule;
}

/**
 * Format daily schedule for frontend display
 * @param {Array} dailySchedule - Daily schedule array
 * @returns {Object} Formatted schedule with metadata
 */
export function formatDailySchedule(dailySchedule) {
  return {
    totalDays: dailySchedule.length,
    startDate: dailySchedule[0]?.date,
    endDate: dailySchedule[dailySchedule.length - 1]?.date,
    totalTopics: dailySchedule.reduce((sum, day) => sum + day.topicCount, 0),
    schedule: dailySchedule.map(day => ({
      date: day.date,
      day: day.day,
      topics: day.topics.map(t => t.title),
      topicIds: day.topicIds,
      topicDetails: day.topics,
      units: day.units,
      topicCount: day.topicCount
    }))
  };
}
