import { createContext, useContext, useState } from "react";

const StudyMapContext = createContext();

export const StudyMapProvider = ({ children }) => {
  const [topic, setTopic] = useState("");
  const [mindMapData, setMindMapData] = useState(null);
  const [loading, setLoading] = useState(false);
const [learningMapData, setLearningMapData] = useState(null);

  return (
    <StudyMapContext.Provider
    value={{
  topic,
  setTopic,
  mindMapData,
  setMindMapData,
  learningMapData,
  setLearningMapData,
  loading,
  setLoading
}}

    >
      {children}
    </StudyMapContext.Provider>
  );
};

export const useStudyMap = () => useContext(StudyMapContext);
