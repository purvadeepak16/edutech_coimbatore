/**
 * Generate daily study schedule by distributing subtopics across dates
 * Topics are split into subtopics (comma/period separated), then distributed
 * @param {Array} units - Syllabus units with topics
 * @param {Date} startDate - Study start date
 * @param {Date} endDate - Study end date
 * @param {Array} excludeTopicIds - Topic IDs to exclude (already assigned)
 * @returns {Array} Daily schedule with date and subtopics
 */
export function generateDailySchedule(units, startDate, endDate, excludeTopicIds = []) {
  const excludeSet = new Set(excludeTopicIds);
  
  // Calculate total days available
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Flatten all subtopics from all units, excluding already assigned topic IDs
  const allSubtopics = [];
  units.forEach(unit => {
    unit.topics.forEach(topic => {
      if (!excludeSet.has(topic.id)) {
        // Get subtopics array from topic (already parsed by normalizeSyllabus)
        const subtopics = topic.subtopics || [topic.title];
        
        // Create a subtopic entry for each subtopic string
        subtopics.forEach((subtopic, idx) => {
          allSubtopics.push({
            id: `${topic.id}-sub-${idx}`,
            parentTopicId: topic.id,
            title: subtopic,
            originalTitle: topic.title,
            difficulty: topic.difficulty,
            estimatedHours: topic.estimatedHours,
            unitName: unit.name,
            unitId: unit.id
          });
        });
      }
    });
  });

  const totalSubtopics = allSubtopics.length;
  
  console.log(`📊 Schedule Generation:`);
  console.log(`   - Total days: ${totalDays}`);
  console.log(`   - Total subtopics to distribute: ${totalSubtopics}`);
  console.log(`   - Sample subtopic:`, allSubtopics[0]);
  
  if (totalSubtopics === 0) {
    return []; // No topics to assign
  }
  
  // Calculate subtopics per day (distribute evenly)
  const subtopicsPerDay = Math.ceil(totalSubtopics / totalDays);
  console.log(`   - Subtopics per day: ${subtopicsPerDay}`);

  // Generate daily schedule
  const dailySchedule = [];
  let subtopicIndex = 0;
  let currentDate = new Date(start);

  for (let day = 0; day < totalDays && subtopicIndex < totalSubtopics; day++) {
    const daySubtopics = [];
    const dayTopicIds = [];
    const subtopicsForToday = Math.min(subtopicsPerDay, totalSubtopics - subtopicIndex);

    for (let i = 0; i < subtopicsForToday && subtopicIndex < totalSubtopics; i++) {
      const subtopic = allSubtopics[subtopicIndex];
      daySubtopics.push(subtopic);
      // Track unique parent topic IDs for reference
      if (!dayTopicIds.includes(subtopic.parentTopicId)) {
        dayTopicIds.push(subtopic.parentTopicId);
      }
      subtopicIndex++;
    }

    if (daySubtopics.length > 0) {
      dailySchedule.push({
        date: new Date(currentDate).toISOString().split('T')[0],
        dateObject: new Date(currentDate),
        day: day + 1,
        topics: daySubtopics,
        topicIds: dayTopicIds,
        topicCount: daySubtopics.length,
        units: [...new Set(daySubtopics.map(t => t.unitName))]
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
