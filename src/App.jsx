import React, { useState, useEffect } from "react";

const SIZE = 4;
const GOAL = 11;

const emptyGrid = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
const cloneGrid = (g) => g.map((r) => r.slice());

function getTileColor(v) {

  if (v === 0) return "#cdc1b4";

  const ratio = v / GOAL;

  const red = Math.floor(255 * ratio);
  const green = Math.floor(200 * (1 - ratio));

  return `rgb(${red},${green},80)`;
}

/* ============================ */

function simulateMove(grid, dir) {

  const g = cloneGrid(grid);

  let moved = false;
  let merges = 0;

  const rotateLeft = (m) => {

    const res = emptyGrid();

    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        res[SIZE - 1 - c][r] = m[r][c];

    return res;
  };

  const rotateRight = (m) => {

    const res = emptyGrid();

    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        res[c][SIZE - 1 - r] = m[r][c];

    return res;
  };

  const reflect = (m) => m.map((row) => row.slice().reverse());

  const compressAndMerge = (line) => {

    const arr = line.filter((v) => v !== 0);

    const merged = [];

    let skip = false;

    for (let i = 0; i < arr.length; i++) {

      if (skip) {
        skip = false;
        continue;
      }

      if (i + 1 < arr.length && arr[i] === arr[i + 1]) {

        merged.push(arr[i] + 1);
        merges++;
        skip = true;

      } else {

        merged.push(arr[i]);
      }
    }

    while (merged.length < SIZE) merged.push(0);

    return merged;
  };

  let working = g;

  if (dir === "up") working = rotateLeft(working);
  if (dir === "down") working = rotateRight(working);
  if (dir === "right") working = reflect(working);

  for (let r = 0; r < SIZE; r++) {

    const original = working[r].slice();

    const compressed = compressAndMerge(working[r]);

    working[r] = compressed;

    if (!moved && original.some((v, i) => v !== compressed[i])) moved = true;
  }

  if (dir === "up") working = rotateRight(working);
  if (dir === "down") working = rotateLeft(working);
  if (dir === "right") working = reflect(working);

  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (working[r][c] >= GOAL) working[r][c] = 0;

  return { grid: working, moved, merges };
}

/* ============================ */

function evaluateGrid(grid) {

  let empty = 0;
  let merges = 0;
  let total = 0;

  for (let r = 0; r < SIZE; r++) {

    for (let c = 0; c < SIZE; c++) {

      const v = grid[r][c];

      if (v === 0) empty++;

      total += v;

      if (c < SIZE - 1 && v === grid[r][c + 1] && v !== 0) merges++;
      if (r < SIZE - 1 && v === grid[r + 1][c] && v !== 0) merges++;
    }
  }

  return empty * 40 + merges * 120 + total;
}

/* ============================ */

function search(grid, depth) {

  if (depth === 0) return evaluateGrid(grid);

  const dirs = ["left","up","right","down"];

  let best = -Infinity;

  for (const dir of dirs) {

    const result = simulateMove(grid, dir);

    if (!result.moved) continue;

    const score = search(result.grid, depth - 1);

    if (score > best) best = score;
  }

  if (best === -Infinity) return evaluateGrid(grid);

  return best;
}

function dirToArabic(d) {

  if (d === "up") return "فوق";
  if (d === "down") return "تحت";
  if (d === "left") return "شمال";
  if (d === "right") return "يمين";
}

export default function App() {

  const [gameGrid, setGameGrid] = useState(() => emptyGrid());
  const [inputGrid, setInputGrid] = useState(() => emptyGrid());

  const [message, setMessage] = useState("");
  const [suggestedDir, setSuggestedDir] = useState(null);

  const [selectedInput, setSelectedInput] = useState({ r: -1, c: -1 });

  /* ===== إدخال الأرقام من الكيبورد ===== */

  useEffect(() => {

    const handleKey = (e) => {

      if (selectedInput.r < 0) return;

      if (e.key === "Backspace") {

        const g = cloneGrid(inputGrid);
        g[selectedInput.r][selectedInput.c] = 0;
        setInputGrid(g);
        return;
      }

      const n = parseInt(e.key);

      if (!isNaN(n) && n >= 0 && n <= GOAL) {

        const g = cloneGrid(inputGrid);

        g[selectedInput.r][selectedInput.c] = n;

        setInputGrid(g);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);

  }, [selectedInput, inputGrid]);

  function saveInputToGame() {

    setGameGrid(cloneGrid(inputGrid));
    setMessage("تم حفظ الشبكة في اللعبة");
  }

  function suggestMove() {

    const dirs = ["left","up","right","down"];

    let bestDir = null;
    let bestScore = -Infinity;

    for (const dir of dirs) {

      const result = simulateMove(gameGrid, dir);

      if (!result.moved) continue;

      const score = search(result.grid,3) + result.merges * 500;

      if(score > bestScore){

        bestScore = score;
        bestDir = dir;
      }
    }

    if(!bestDir){

      setMessage("لا يوجد حركة ممكنة");
      return;
    }

    setSuggestedDir(bestDir);
setMessage("الاقتراح الذكي: " + dirToArabic(bestDir));

const result = simulateMove(gameGrid, bestDir);

if(result.moved){
  setGameGrid(result.grid);
  setInputGrid(cloneGrid(result.grid));
}
  }

  function applySuggested(){

    if(!suggestedDir) return;

    const result = simulateMove(gameGrid,suggestedDir);

    if(!result.moved) return;

    setGameGrid(result.grid);
    setInputGrid(cloneGrid(result.grid));
  }

  const gridStyle = {

    display:"grid",
    gridTemplateColumns:`repeat(${SIZE},70px)`,
    gap:8,
    background:"#bbada0",
    padding:10,
    borderRadius:8
  };

  const cellStyle = (v)=>({

    width:70,
    height:70,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    fontWeight:"bold",
    fontSize:18,
    background:getTileColor(v),
    color:"#000",
    cursor:"pointer"
  });

  return (

    <div style={{padding:20,fontFamily:"Arial"}}>

      <h2>My 2048 AI</h2>

      <h3>شبكة الإدخال</h3>

      <div style={gridStyle}>
        {inputGrid.map((row,r)=>
          row.map((cell,c)=>(
            <div
              key={r+"-"+c}
              style={cellStyle(cell)}
              onClick={()=>setSelectedInput({r,c})}
            >
              {cell===0 ? "" : cell}
            </div>
          ))
        )}
      </div>

      <button onClick={saveInputToGame} style={{marginTop:10}}>
        حفظ إلى اللعبة
      </button>

      <h3 style={{marginTop:20}}>شبكة اللعبة</h3>

      <div style={gridStyle}>
        {gameGrid.map((row,r)=>
          row.map((cell,c)=>(
            <div
              key={r+"-"+c}
              style={cellStyle(cell)}
            >
              {cell===0 ? "" : cell}
            </div>
          ))
        )}
      </div>

      <div style={{marginTop:15}}>

        <button onClick={suggestMove}>
          اقتراح حركة
        </button>

        <button onClick={applySuggested}>
          تطبيق الاقتراح
        </button>

      </div>

      <div style={{marginTop:10}}>
        {message}
      </div>

    </div>
  );
}