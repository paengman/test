import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const initialShape = (xPercent, yPercent, type = "circle", size = 40) => ({
  id: uuidv4(),
  xPercent,
  yPercent,
  type,
  size,
  pitch: "C",
  rhythm: "4/4",
  duration: "quarter",
  dynamic: "mf",
  active: false,
  lastPlayed: 0,
});

const SOUND_URL = "/sound/for_site/typewriter.mp3";
const PLAYBACK_DURATION = 15000; // 15초

const SoundPatternBuilder = () => {
  const [shapes, setShapes] = useState([
    initialShape(10, 50, "강박"),
    initialShape(30, 50, "중박"),
    initialShape(50, 50, "약박"),
  ]);
  const [selectedType, setSelectedType] = useState("강박");
  const [deleteMode, setDeleteMode] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playheadX, setPlayheadX] = useState(0);
  const svgRef = useRef(null);
  const shapesRef = useRef(shapes);
  const isClickSoundPlaying = useRef(false);
  const clickAudioRef = useRef(null);
  const activeDuration = 150;
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  useEffect(() => {
    clickAudioRef.current = new Audio(SOUND_URL);
    clickAudioRef.current.volume = 0.5;
  }, []);

  const playClickSound = () => {
    if (isClickSoundPlaying.current || !clickAudioRef.current) return;
    isClickSoundPlaying.current = true;
    clickAudioRef.current.currentTime = 0;
    clickAudioRef.current.play().catch((e) => console.error("오디오 실패:", e));
    setTimeout(() => {
      isClickSoundPlaying.current = false;
    }, 200);
  };

  const playWheelSound = () => {
    const audio = new Audio(SOUND_URL);
    audio.volume = 0.5;
    audio.play().catch((e) => console.error("오디오 실패:", e));
  };

  const handleMouseDown = (id, resize = false) => {
    playClickSound();
    if (deleteMode) {
      handleDelete(id);
      return;
    }
    if (resize) setResizingId(id);
    else setDraggingId(id);
  };

  const handleMouseMove = (e) => {
    const svgRect = svgRef.current.getBoundingClientRect();
    const svgWidth = svgRect.width;
    const svgHeight = svgRect.height;

    if (draggingId) {
      const newShapes = shapesRef.current.map((shape) => {
        if (shape.id === draggingId) {
          return {
            ...shape,
            xPercent: ((e.clientX - svgRect.left) / svgWidth) * 100,
            yPercent: ((e.clientY - svgRect.top) / svgHeight) * 100,
          };
        }
        return shape;
      });
      setShapes(newShapes);
    }

    if (resizingId) {
      const newShapes = shapesRef.current.map((shape) => {
        if (shape.id === resizingId && shape.type === "wave") {
          const newSize = Math.max(10, e.clientX - (shape.xPercent / 100) * svgWidth + shape.size / 2);
          return {
            ...shape,
            size: newSize,
          };
        }
        return shape;
      });
      setShapes(newShapes);
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  const handleDelete = (id) => {
    playClickSound();
    setShapes(shapes.filter((shape) => shape.id !== id));
  };

  const addShape = () => {
    playClickSound();
    setShapes([...shapesRef.current, initialShape(20, 50, selectedType)]);
  };

  const step = (timestamp) => {
    if (!isPlaying || isPaused) return;

    const svgWidth = svgRef.current?.clientWidth || 800;
    if (!startTimeRef.current) startTimeRef.current = timestamp - (pauseTimeRef.current || 0);

    const elapsed = timestamp - startTimeRef.current;
    const newX = (elapsed / PLAYBACK_DURATION) * svgWidth;

    if (newX > svgWidth) {
      setIsPlaying(false);
      setPlayheadX(0);
      startTimeRef.current = null;
      pauseTimeRef.current = null;
      setShapes(shapesRef.current.map(shape => ({ ...shape, active: false, lastPlayed: 0 })));
      cancelAnimationFrame(animationRef.current);
      return;
    }

    const updatedShapes = shapesRef.current.map((shape) => {
      const x = (shape.xPercent / 100) * svgWidth;
      let active = shape.active;
      let lastPlayed = shape.lastPlayed > 0 ? shape.lastPlayed - 1 : 0;
      const triggerX = shape.type === "wave" ? x - shape.size / 2 : x;
      if (Math.abs(triggerX - newX) < 5) {
        active = true;
        lastPlayed = activeDuration;
      } else if (shape.lastPlayed > 0) {
        active = true;
      } else {
        active = false;
      }
      return { ...shape, active, lastPlayed };
    });

    setPlayheadX(newX);
    setShapes(updatedShapes);
    animationRef.current = requestAnimationFrame(step);
  };

  const startPlayback = () => {
    playClickSound();
    setIsPlaying(true);
    setIsPaused(false);
    setPlayheadX(0);
    startTimeRef.current = null;
    pauseTimeRef.current = null;
    cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(step);
  };

  const pausePlayback = () => {
    playClickSound();
    if (isPlaying && !isPaused) {
      setIsPaused(true);
      pauseTimeRef.current = performance.now() - startTimeRef.current;
      cancelAnimationFrame(animationRef.current);
    }
  };

  const resumePlayback = () => {
    playClickSound();
    if (isPlaying && isPaused) {
      setIsPaused(false);
      animationRef.current = requestAnimationFrame(step);
    }
  };

  return (
    <div className="p-4 w-full max-w-7xl mx-auto" onWheel={playWheelSound} onClick={playClickSound}>
      <h2 className="text-lg font-bold mb-4">🎵 Sound Pattern Builder</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-2 py-1 border rounded">
          <option value="강박">● 강박</option>
          <option value="중박">◐ 중박</option>
          <option value="약박">○ 약박</option>
          <option value="네모">■ 네모</option>
          <option value="조시작">■ 조시작</option>
          <option value="삼각">▲ 삼각</option>
          <option value="강세">▶ 강세</option>
          <option value="wave">~ 물결</option>
        </select>
        <button onClick={addShape} className="px-4 py-2 bg-blue-500 text-white rounded">Add Shape</button>
        <button onClick={startPlayback} className="px-4 py-2 bg-green-500 text-white rounded">▶ Start</button>
        <button onClick={pausePlayback} className="px-4 py-2 bg-yellow-500 text-white rounded">⏸ Pause</button>
        <button onClick={resumePlayback} className="px-4 py-2 bg-purple-500 text-white rounded">⏵ Resume</button>
        <button
          onClick={() => {
            playClickSound();
            setDeleteMode((prev) => !prev);
          }}
          className={`px-4 py-2 rounded ${deleteMode ? "bg-red-600" : "bg-gray-400"} text-white`}
        >
          {deleteMode ? "🗑 삭제 모드 ON" : "삭제 모드 OFF"}
        </button>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="40vh"
        className="border border-gray-300"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {shapes.map((shape) => {
          const svgWidth = svgRef.current?.clientWidth || 800;
          const svgHeight = svgRef.current?.clientHeight || 400;
          const x = (shape.xPercent / 100) * svgWidth;
          const y = (shape.yPercent / 100) * svgHeight;

          const commonProps = {
            onMouseDown: () => handleMouseDown(shape.id),
            fill: shape.active ? "orange" : "skyblue",
          };

          switch (shape.type) {
            case "강박":
              return <g key={shape.id}><circle {...commonProps} cx={x} cy={y} r="12" /></g>;
            case "중박":
              return <g key={shape.id}><circle {...commonProps} cx={x} cy={y} r="12" fill="white" stroke={shape.active ? "orange" : "gray"} strokeWidth={2} /></g>;
            case "약박":
              return <g key={shape.id}><circle {...commonProps} cx={x} cy={y} r="12" stroke={shape.active ? "orange" : "gray"} strokeWidth={1} fill="none" /></g>;
            case "네모":
              return <g key={shape.id}><rect {...commonProps} x={x - 10} y={y - 10} width="20" height="20" /></g>;
            case "조시작":
              return <g key={shape.id}><rect {...commonProps} x={x - 10} y={y - 10} width="20" height="20" fill="red" /></g>;
            case "삼각":
              return <g key={shape.id}><polygon {...commonProps} points={`${x},${y - 12} ${x - 10},${y + 10} ${x + 10},${y + 10}`} /></g>;
            case "강세":
              return <g key={shape.id}><polygon {...commonProps} points={`${x - 10},${y - 10} ${x + 10},${y} ${x - 10},${y + 10}`} /></g>;
            case "wave":
              const pathData = `M ${x - shape.size / 2} ${y} q ${shape.size / 4} -20 ${shape.size / 2} 0 q ${shape.size / 4} 20 ${shape.size / 2} 0`;
              return (
                <g key={shape.id}>
                  <path d={pathData} fill="none" stroke={shape.active ? "orange" : "skyblue"} strokeWidth={3} onMouseDown={() => handleMouseDown(shape.id)} />
                  <circle cx={x + shape.size / 2 + 5} cy={y} r={6} fill="gray" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(shape.id, true); }} />
                </g>
              );
            default:
              return <g key={shape.id}><circle {...commonProps} cx={x} cy={y} r="10" /></g>;
          }
        })}
        {isPlaying && (
          <line
            x1={playheadX}
            y1={0}
            x2={playheadX}
            y2={svgRef.current?.clientHeight || 400}
            stroke="red"
            strokeWidth={2}
          />
        )}
      </svg>
    </div>
  );
};

export default SoundPatternBuilder;
