import { useState } from 'react';
import './SyllabusEditor.css';
import SchedulePreview from './SchedulePreview';

function SyllabusEditor({ syllabus: initialSyllabus, warnings, onConfirm, onCancel, loading }) {
  const [syllabus, setSyllabus] = useState(initialSyllabus);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [expandedUnits, setExpandedUnits] = useState(
    Object.fromEntries(syllabus.units.map(u => [u.id, true]))
  );

  const toggleUnit = (unitId) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  const addUnit = () => {
    const newUnit = {
      id: `unit-${Date.now()}`,
      name: 'New Unit',
      topics: []
    };
    setSyllabus({
      ...syllabus,
      units: [...syllabus.units, newUnit]
    });
    setEditingUnit(newUnit.id);
  };

  const updateUnitName = (unitId, newName) => {
    setSyllabus({
      ...syllabus,
      units: syllabus.units.map(unit =>
        unit.id === unitId ? { ...unit, name: newName } : unit
      )
    });
  };

  const deleteUnit = (unitId) => {
    if (confirm('Delete this unit and all its topics?')) {
      setSyllabus({
        ...syllabus,
        units: syllabus.units.filter(unit => unit.id !== unitId)
      });
    }
  };

  const addTopic = (unitId) => {
    const newTopic = {
      id: `topic-${Date.now()}`,
      title: 'New Topic',
      difficulty: undefined,
      estimatedHours: undefined
    };
    setSyllabus({
      ...syllabus,
      units: syllabus.units.map(unit =>
        unit.id === unitId
          ? { ...unit, topics: [...unit.topics, newTopic] }
          : unit
      )
    });
    setEditingTopic(newTopic.id);
  };

  const updateTopic = (unitId, topicId, updates) => {
    setSyllabus({
      ...syllabus,
      units: syllabus.units.map(unit =>
        unit.id === unitId
          ? {
              ...unit,
              topics: unit.topics.map(topic =>
                topic.id === topicId ? { ...topic, ...updates } : topic
              )
            }
          : unit
      )
    });
  };

  const deleteTopic = (unitId, topicId) => {
    if (confirm('Delete this topic?')) {
      setSyllabus({
        ...syllabus,
        units: syllabus.units.map(unit =>
          unit.id === unitId
            ? { ...unit, topics: unit.topics.filter(t => t.id !== topicId) }
            : unit
        )
      });
    }
  };

  const handleConfirm = () => {
    onConfirm(syllabus);
  };

  const lowConfidenceTopics = warnings?.topics || [];

  return (
    <div className="syllabus-editor">
      <div className="editor-header">
        <div>
          <h1>Edit Syllabus</h1>
          <p className="subject-info">
            Subject: <strong>{syllabus.subject}</strong>
            {syllabus.level && ` • Level: ${syllabus.level}`}
            {' '}• Source: <strong>{syllabus.source}</strong>
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Saving...' : 'Confirm & Save'}
          </button>
        </div>
      </div>

      {/* Schedule Preview */}
      <SchedulePreview />

      {warnings && (
        <div className="warning-banner">
          <span className="warning-icon">⚠️</span>
          <div>
            <strong>{warnings.message}</strong>
            <p>Topics highlighted in yellow have low confidence scores.</p>
          </div>
        </div>
      )}

      <div className="editor-content">
        <div className="units-list">
          {syllabus.units.map((unit) => (
            <div key={unit.id} className="unit-card">
              <div className="unit-header">
                <button
                  className="expand-btn"
                  onClick={() => toggleUnit(unit.id)}
                >
                  {expandedUnits[unit.id] ? '▼' : '▶'}
                </button>
                
                {editingUnit === unit.id ? (
                  <input
                    type="text"
                    className="unit-name-input"
                    value={unit.name}
                    onChange={(e) => updateUnitName(unit.id, e.target.value)}
                    onBlur={() => setEditingUnit(null)}
                    onKeyPress={(e) => e.key === 'Enter' && setEditingUnit(null)}
                    autoFocus
                  />
                ) : (
                  <h3
                    className="unit-name"
                    onClick={() => setEditingUnit(unit.id)}
                  >
                    {unit.name}
                  </h3>
                )}

                <div className="unit-actions">
                  <button
                    className="icon-btn"
                    onClick={() => addTopic(unit.id)}
                    title="Add topic"
                  >
                    ➕
                  </button>
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => setEditingUnit(unit.id)}
                    title="Rename unit"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => deleteUnit(unit.id)}
                    title="Delete unit"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {expandedUnits[unit.id] && (
                <div className="topics-list">
                  {unit.topics.length === 0 ? (
                    <p className="no-topics">No topics yet. Click ➕ to add one.</p>
                  ) : (
                    unit.topics.map((topic) => {
                      const isLowConfidence = lowConfidenceTopics.some(
                        t => t.topicTitle === topic.title
                      );

                      return (
                        <div
                          key={topic.id}
                          className={`topic-item ${isLowConfidence ? 'low-confidence' : ''}`}
                        >
                          {editingTopic === topic.id ? (
                            <div className="topic-edit-form">
                              <input
                                type="text"
                                className="topic-title-input"
                                value={topic.title}
                                onChange={(e) =>
                                  updateTopic(unit.id, topic.id, { title: e.target.value })
                                }
                                placeholder="Topic title"
                                autoFocus
                              />
                              <div className="topic-meta-inputs">
                                <select
                                  value={topic.difficulty || ''}
                                  onChange={(e) =>
                                    updateTopic(unit.id, topic.id, {
                                      difficulty: e.target.value || undefined
                                    })
                                  }
                                >
                                  <option value="">Difficulty</option>
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={topic.estimatedHours || ''}
                                  onChange={(e) =>
                                    updateTopic(unit.id, topic.id, {
                                      estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined
                                    })
                                  }
                                  placeholder="Hours"
                                />
                              </div>
                              <button
                                className="btn-done"
                                onClick={() => setEditingTopic(null)}
                              >
                                Done
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="topic-info">
                                <span className="topic-title">{topic.title}</span>
                                <div className="topic-meta">
                                  {topic.difficulty && (
                                    <span className={`badge difficulty-${topic.difficulty}`}>
                                      {topic.difficulty}
                                    </span>
                                  )}
                                  {topic.estimatedHours && (
                                    <span className="badge hours">
                                      {topic.estimatedHours}h
                                    </span>
                                  )}
                                  {isLowConfidence && (
                                    <span className="badge confidence">
                                      Low confidence
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="topic-actions">
                                <button
                                  className="icon-btn edit-btn"
                                  onClick={() => setEditingTopic(topic.id)}
                                  title="Edit topic"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="icon-btn delete-btn"
                                  onClick={() => deleteTopic(unit.id, topic.id)}
                                  title="Delete topic"
                                >
                                  🗑️
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="btn-add-unit" onClick={addUnit}>
          ➕ Add Unit
        </button>
      </div>
    </div>
  );
}

export default SyllabusEditor;
