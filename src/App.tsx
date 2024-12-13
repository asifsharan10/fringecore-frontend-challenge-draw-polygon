import React, {
  useState,
  useRef,
  MouseEvent,
  TouchEvent,
  useEffect,
} from 'react';

type Polygon = [number, number][];

const App: React.FC = () => {
  const [polygons, setPolygons] = useState<Polygon[]>([]); // List of completed polygons
  const [currentPolygon, setCurrentPolygon] = useState<Polygon>([]); // Active polygon being drawn
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(
    null
  ); // Track if a vertex is being dragged
  const [draggingPolygonIndex, setDraggingPolygonIndex] = useState<
    number | null
  >(null); // Track which polygon is being edited
  const [isDragging, setIsDragging] = useState(false); // Track if dragging is in progress
  const [history, setHistory] = useState<Polygon[][]>([]); // Undo/Redo history stack
  const [historyIndex, setHistoryIndex] = useState(0); // History pointer
  const [polygonStyle, setPolygonStyle] = useState({
    fillColor: 'rgba(0, 150, 255, 0.4)',
    strokeColor: 'blue',
    lineWidth: 2,
  }); // Polygon style

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Create a new polygon when clicking on the canvas
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // If there's an active polygon being drawn, add the point
    if (currentPolygon.length > 0) {
      const [startX, startY] = currentPolygon[0];
      // Close the polygon if near the starting point
      if (Math.hypot(x - startX, y - startY) < 10) {
        setPolygons([...polygons, currentPolygon]);
        setCurrentPolygon([]); // Reset current polygon
        updateHistory([...polygons, currentPolygon]);
        return;
      }
    }

    // Snapping to the nearest existing vertex (for smooth drawing)
    let snapped = false;
    const snappedPolygon = polygons.find((polygon) =>
      polygon.some(([vx, vy]) => Math.hypot(x - vx, y - vy) < 10)
    );
    if (snappedPolygon) {
      const nearestVertex = snappedPolygon.reduce(
        (nearest, [vx, vy]) => {
          const distance = Math.hypot(x - vx, y - vy);
          return distance < nearest.distance
            ? { vertex: [vx, vy], distance }
            : nearest;
        },
        { vertex: [0, 0], distance: Infinity }
      );
      if (nearestVertex.distance < 10) {
        setCurrentPolygon([...currentPolygon, nearestVertex.vertex]);
        snapped = true;
      }
    }

    // Add a new vertex to the current polygon
    if (!snapped) {
      setCurrentPolygon([...currentPolygon, [x, y]]);
    }
  };

  // Handle mouse movements for dragging vertices
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (
      !canvasRef.current ||
      draggingVertexIndex === null ||
      draggingPolygonIndex === null
    )
      return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update the position of the dragged vertex
    const newPolygons = [...polygons];
    const polygon = newPolygons[draggingPolygonIndex];
    polygon[draggingVertexIndex] = [x, y];
    setPolygons(newPolygons);
  };

  // Handle mouse down event for dragging vertices
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found = false;
    polygons.forEach((polygon, polygonIndex) => {
      polygon.forEach(([vx, vy], vertexIndex) => {
        if (Math.hypot(x - vx, y - vy) < 10) {
          setDraggingVertexIndex(vertexIndex);
          setDraggingPolygonIndex(polygonIndex);
          setIsDragging(true); // Mark dragging as active
          found = true;
        }
      });
    });

    if (!found && currentPolygon.length > 0) {
      currentPolygon.forEach(([vx, vy], vertexIndex) => {
        if (Math.hypot(x - vx, y - vy) < 10) {
          setDraggingVertexIndex(vertexIndex);
          setDraggingPolygonIndex(-1); // No need for dragging for a new polygon
          setIsDragging(true); // Mark dragging as active
          found = true; // Polygon vertex found
        }
      });
    }
  };

  // Handle mouse up event to stop dragging
  const handleMouseUp = () => {
    setDraggingVertexIndex(null);
    setDraggingPolygonIndex(null);
    setIsDragging(false); // Mark dragging as inactive
  };

  // Handle touch events for mobile compatibility
  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    if (
      !canvasRef.current ||
      draggingVertexIndex === null ||
      draggingPolygonIndex === null
    )
      return;

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const newPolygons = [...polygons];
    const polygon = newPolygons[draggingPolygonIndex];
    polygon[draggingVertexIndex] = [x, y];
    setPolygons(newPolygons);
  };

  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    let found = false;
    polygons.forEach((polygon, polygonIndex) => {
      polygon.forEach(([vx, vy], vertexIndex) => {
        if (Math.hypot(x - vx, y - vy) < 10) {
          setDraggingVertexIndex(vertexIndex);
          setDraggingPolygonIndex(polygonIndex);
          setIsDragging(true); // Mark dragging as active
          found = true;
        }
      });
    });

    if (!found && currentPolygon.length > 0) {
      currentPolygon.forEach(([vx, vy], vertexIndex) => {
        if (Math.hypot(x - vx, y - vy) < 10) {
          setDraggingVertexIndex(vertexIndex);
          setDraggingPolygonIndex(-1); // No need for dragging for a new polygon
          setIsDragging(true); // Mark dragging as active
          found = true;
        }
      });
    }
  };

  const handleTouchEnd = () => {
    setDraggingVertexIndex(null);
    setDraggingPolygonIndex(null);
    setIsDragging(false); // Mark dragging as inactive
  };

  // Function to draw all polygons and the current polygon
  const drawCanvas = (
    ctx: CanvasRenderingContext2D,
    polygons: Polygon[] = [],
    currentPolygon: Polygon = [],
    mousePosition: [number, number] = [0, 0]
  ) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw completed polygons
    polygons.forEach((polygon) => {
      ctx.beginPath();
      polygon.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = polygonStyle.fillColor;
      ctx.fill();
      ctx.strokeStyle = polygonStyle.strokeColor;
      ctx.lineWidth = polygonStyle.lineWidth;
      ctx.stroke();
    });

    // Draw current polygon being drawn
    if (currentPolygon.length > 0) {
      ctx.beginPath();
      currentPolygon.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw draggable vertices for all polygons
    polygons.forEach((polygon) => {
      polygon.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
      });
    });

    // Draw draggable vertices for the current polygon
    currentPolygon.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'blue';
      ctx.fill();
    });

    // Draw mouse cursor
    ctx.beginPath();
    ctx.arc(mousePosition[0], mousePosition[1], 5, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
  };

  // Update history for undo/redo
  const updateHistory = (newPolygons: Polygon[]) => {
    // Remove any future history states when new points are added
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newPolygons);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  // Undo functionality (removes the last point added)
  const handleUndo = () => {
    if (currentPolygon.length > 0) {
      const newPolygon = [...currentPolygon];
      newPolygon.pop(); // Remove the last point
      setCurrentPolygon(newPolygon);
      updateHistory([...polygons, newPolygon]); // Update history
    } else if (polygons.length > 0) {
      const lastPolygon = polygons[polygons.length - 1];
      const newPolygons = polygons.slice(0, polygons.length - 1);
      setPolygons(newPolygons);
      updateHistory(newPolygons); // Update history
    }
  };

  // Redo functionality (re-adds the previously removed point or polygon)
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPolygons(nextState);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Clear all polygons
  const handleClear = () => {
    setPolygons([]);
    setCurrentPolygon([]);
    setHistory([]);
    setHistoryIndex(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const mousePosition: [number, number] = [0, 0];
      drawCanvas(ctx, polygons, currentPolygon, mousePosition);
    };
    draw();
  }, [polygons, currentPolygon]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width="500"
        height="500"
        style={{ border: '1px solid black' }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div>
        <button onClick={handleUndo}>Undo</button>
        <button onClick={handleRedo}>Redo</button>
        <button onClick={handleClear}>Clear</button>
      </div>
    </div>
  );
};

export default App;
