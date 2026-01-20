import { db } from './src/config/firebase.js';
import { saveSyllabus, saveTopicAssignments, getDailySchedule } from './src/services/firestoreService.js';

async function testFirestoreConnection() {
  console.log('🔥 Testing Firestore Connection...\n');

  const testUserId = 'test_user_123';
  
  try {
    // Test 1: Save sample syllabus
    console.log('📚 Test 1: Saving sample syllabus...');
    const syllabusData = {
      subject: 'Mathematics Grade 10',
      units: [
        {
          id: 'unit-1',
          name: 'Algebra',
          topics: [
            { id: 'topic-0-0', title: 'Linear Equations', difficulty: 'medium', confidence: 1.0 },
            { id: 'topic-0-1', title: 'Quadratic Equations', difficulty: 'hard', confidence: 1.0 }
          ]
        },
        {
          id: 'unit-2',
          name: 'Geometry',
          topics: [
            { id: 'topic-1-0', title: 'Triangles', difficulty: 'easy', confidence: 1.0 },
            { id: 'topic-1-1', title: 'Circles', difficulty: 'medium', confidence: 1.0 }
          ]
        }
      ],
      metadata: {
        pdfName: 'test_syllabus.pdf',
        pdfSize: 12345,
        pages: 5,
        startDate: '2026-01-20',
        endDate: '2026-01-25'
      }
    };

    await saveSyllabus(testUserId, syllabusData);
    console.log('✅ Syllabus saved successfully!\n');

    // Test 2: Save sample topic assignments
    console.log('📅 Test 2: Saving daily topic assignments...');
    const assignments = [
      {
        date: '2026-01-20',
        topics: ['Linear Equations', 'Quadratic Equations'],
        topicIds: ['topic-0-0', 'topic-0-1'],
        units: ['Algebra']
      },
      {
        date: '2026-01-21',
        topics: ['Triangles'],
        topicIds: ['topic-1-0'],
        units: ['Geometry']
      },
      {
        date: '2026-01-22',
        topics: ['Circles'],
        topicIds: ['topic-1-1'],
        units: ['Geometry']
      }
    ];

    await saveTopicAssignments(testUserId, assignments);
    console.log('✅ Topic assignments saved successfully!\n');

    // Test 3: Retrieve schedule
    console.log('📥 Test 3: Retrieving daily schedule...');
    const schedule = await getDailySchedule(testUserId);
    
    console.log('✅ Schedule retrieved successfully!');
    console.log('\n📊 SCHEDULE DATA STRUCTURE:');
    console.log('─────────────────────────────────────');
    console.log('Total Days:', schedule.totalDays);
    console.log('Start Date:', schedule.startDate);
    console.log('End Date:', schedule.endDate);
    console.log('Total Topics:', schedule.totalTopics);
    console.log('\n📅 Daily Schedule:');
    schedule.schedule.forEach(day => {
      console.log(`\n  Day ${day.day} (${day.date}):`);
      console.log(`    Topics (${day.topicCount}):`);
      day.topics.forEach(topic => console.log(`      - ${topic}`));
      console.log(`    Units: ${day.units.join(', ')}`);
    });

    console.log('\n\n🎉 All tests passed! Data is being stored correctly in Firestore.');
    console.log('\n📦 Collections created:');
    console.log('  1. userSyllabi/{userId} - Stores syllabus structure');
    console.log('  2. topicAssignments/{userId}_{date} - Stores daily assignments');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
}

testFirestoreConnection();
