# Exam Syllabus Storage - Important Information

## ⚠️ DO NOT Fetch Syllabi from Internet

The system is designed to use **pre-stored official exam syllabi** for these important reasons:

### Why Pre-Stored?

1. **Accuracy Guarantee** - Official syllabi don't change frequently, pre-storing ensures 100% accuracy
2. **No Web Scraping Issues** - Avoids legal issues, broken HTML, and website structure changes
3. **Instant Loading** - No network delays or failures
4. **No AI Hallucinations** - AI only structures the text, doesn't fetch or invent content
5. **Reliability** - Works offline, no dependency on external websites

### Where Syllabi are Stored

**File:** `backend/src/data/examSyllabi.js`

This file contains official syllabus text for:
- JEE Main (Physics, Chemistry, Mathematics)
- GATE (Computer Science)
- NEET (Biology)
- Mathematical Olympiad

### How to Add New Exam Syllabi

1. **Get Official Text** - Download PDF from official website and manually copy the text
2. **Add to examSyllabi.js:**

```javascript
export const examSyllabi = {
  // ... existing syllabi ...
  
  'NEW_EXAM_SUBJECT': `
SECTION 1: Unit Name
- Topic 1
- Topic 2

SECTION 2: Another Unit
- Topic A
- Topic B
`,

  // Add more...
};
```

3. **Update the list function:**

```javascript
export function getAvailableExams() {
  return [
    // ... existing exams ...
    { id: 'NEW_EXAM_SUBJECT', name: 'New Exam - Subject', subject: 'Subject' }
  ];
}
```

### Available Exams Currently

✅ JEE Main - Physics
✅ JEE Main - Chemistry  
✅ JEE Main - Mathematics
✅ GATE - Computer Science
✅ NEET - Biology
✅ Mathematical Olympiad

### To Add More Exams (Examples)

You can manually add:
- SAT Subject Tests
- AP (Advanced Placement) courses
- UPSC syllabus
- State board syllabi
- University entrance exams
- Professional certifications (AWS, Azure, etc.)

### Process to Add

1. Go to official exam website
2. Download official syllabus PDF
3. Copy text carefully
4. Add to `backend/src/data/examSyllabi.js`
5. Register in `getAvailableExams()` function
6. Restart backend server
7. Test in frontend

### Important Notes

- ❌ Do NOT use web scraping
- ❌ Do NOT let AI fetch from internet
- ❌ Do NOT invent syllabus content
- ✅ DO use official sources only
- ✅ DO store complete syllabus text
- ✅ DO update when official syllabi change (rare)

### Example Official Sources

- **JEE Main**: https://nta.ac.in/
- **GATE**: https://gate.iitk.ac.in/
- **NEET**: https://nta.ac.in/
- **SAT**: https://collegeboard.org/
- **AP**: https://apcentral.collegeboard.org/

### AI's Role

The AI (OpenRouter/Claude) is used ONLY to:
1. Structure the pre-stored text into JSON format
2. Identify units and topics
3. Organize hierarchy

AI does NOT:
- Fetch syllabi from websites
- Invent or add topics
- Modify official content

This ensures **100% accuracy** and **reliability**.
