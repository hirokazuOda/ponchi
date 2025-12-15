import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Download, Pencil, Eraser, Clock, Image as ImageIcon, Save, AlertCircle } from 'lucide-react';

// --- データ定義 ---

type ThemeCategory = 'object' | 'action';

interface Theme {
  id: string;
  title: string;
  prompt: string; // 画像生成用の英語プロンプト
  category: ThemeCategory;
}

// 物・風景のテーマ（偶数回用）
const THEMES_OBJECT: Theme[] = [
  { id: 'o1', title: '淹れたてのコーヒー', prompt: 'fresh hot coffee cup with steam on wooden table, photorealistic, cinematic lighting', category: 'object' },
  { id: 'o2', title: '疾走する自転車', prompt: 'bicycle speeding on a road, motion blur, dynamic angle, photorealistic', category: 'object' },
  { id: 'o3', title: '雨上がりの紫陽花', prompt: 'hydrangea flowers with rain drops, glistening, soft lighting, nature photography', category: 'object' },
  { id: 'o4', title: 'アンティークな時計', prompt: 'antique pocket watch on old book, vintage style, macro photography', category: 'object' },
  { id: 'o5', title: '焼きたてのパン', prompt: 'freshly baked bread loaf, bakery setting, warm lighting, delicious', category: 'object' },
  { id: 'o6', title: '古いフィルムカメラ', prompt: 'vintage film camera on a desk, retro aesthetic, high quality', category: 'object' },
  { id: 'o7', title: '森のフクロウ', prompt: 'owl sitting on a tree branch in a forest, detailed feathers, mystery', category: 'object' },
  { id: 'o8', title: '夕暮れの灯台', prompt: 'lighthouse at sunset, ocean waves, dramatic sky, silhouette', category: 'object' },
  { id: 'o9', title: '積み上げられた本', prompt: 'stack of old books in a library, intellectual atmosphere', category: 'object' },
  { id: 'o10', title: '赤いスニーカー', prompt: 'red sneakers on asphalt, street style, close up', category: 'object' },
];

// 人間の行動のテーマ（奇数回用）
const THEMES_ACTION: Theme[] = [
  { id: 'a1', title: '本を読んでいる人', prompt: 'person reading a book in a cozy cafe, focused expression, side profile', category: 'action' },
  { id: 'a2', title: '公園で走る人', prompt: 'person running jogging in a park, morning sunlight, dynamic pose, fitness', category: 'action' },
  { id: 'a3', title: 'ギターを弾く手元', prompt: 'close up of hands playing acoustic guitar, musician, artistic', category: 'action' },
  { id: 'a4', title: '料理をしている様子', prompt: 'chef cooking in kitchen, chopping vegetables, dynamic action', category: 'action' },
  { id: 'a5', title: '靴紐を結ぶ人', prompt: 'person tying shoelaces, crouching down, street level view', category: 'action' },
  { id: 'a6', title: '水を飲んでいる人', prompt: 'person drinking water from a bottle, refreshing, after sports', category: 'action' },
  { id: 'a7', title: 'スマホで写真を撮る人', prompt: 'person taking a photo with smartphone, holding phone up', category: 'action' },
  { id: 'a8', title: '傘をさして歩く人', prompt: 'person walking with umbrella in rain, back view, cinematic', category: 'action' },
  { id: 'a9', title: '犬の散歩をしている人', prompt: 'person walking a dog in the neighborhood, happy vibes', category: 'action' },
  { id: 'a10', title: '荷物を運んでいる人', prompt: 'person carrying a heavy cardboard box, moving house', category: 'action' },
];

const TIME_LIMIT = 30; // 秒

export default function PonchieDojo() {
  const [gameState, setGameState] = useState<'title' | 'generating' | 'drawing' | 'result'>('title');
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES_OBJECT[0]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [imgError, setImgError] = useState(false);

  // ゲームの状態管理
  const [turnCount, setTurnCount] = useState(0); // 何回目か（0始まり）
  const [usedThemeIds, setUsedThemeIds] = useState<Set<string>>(new Set()); // 使用済みID

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // カウントダウンタイマー
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'drawing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'drawing') {
      setGameState('result');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // テーマ選択ロジック
  const selectNextTheme = useCallback(() => {
    const isActionTurn = (turnCount + 1) % 2 === 0; // 2回に1回（偶数回目）をActionとする設定
    // ※ turnCountは0から始まるため、0(1回目):Object, 1(2回目):Action, 2(3回目):Object... となります

    let candidateList = isActionTurn ? THEMES_ACTION : THEMES_OBJECT;
    
    // 使用済みを除外
    let available = candidateList.filter(t => !usedThemeIds.has(t.id));

    // もし候補が尽きてしまったら、そのカテゴリの履歴をリセットして再取得
    if (available.length === 0) {
      const categoryIds = new Set(candidateList.map(t => t.id));
      setUsedThemeIds(prev => {
        const next = new Set(prev);
        categoryIds.forEach(id => next.delete(id));
        return next;
      });
      available = candidateList; // 全復活
    }

    const randomTheme = available[Math.floor(Math.random() * available.length)];
    
    // 選ばれたIDを使用済みに登録
    setUsedThemeIds(prev => new Set(prev).add(randomTheme.id));
    setTurnCount(prev => prev + 1);

    return randomTheme;
  }, [turnCount, usedThemeIds]);

  // ゲーム開始処理
  const startGame = () => {
    setGameState('generating');
    setImgError(false);

    const nextTheme = selectNextTheme();
    setCurrentTheme(nextTheme);

    // AI画像生成URLを作成 (Pollinations.aiを使用)
    // キャッシュバスター(seed)をつけて毎回違う画像を生成させる
    const seed = Math.floor(Math.random() * 10000);
    const generatedUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(nextTheme.prompt)}?width=800&height=600&nologo=true&seed=${seed}&model=flux`;
    setCurrentImageUrl(generatedUrl);
    
    // 画像のプリロード処理
    const img = new Image();
    img.src = generatedUrl;
    
    // 画像生成（ロード）のシミュレーション
    // Pollinations.aiは生成に数秒かかるため、読み込み完了を待つか、最低待機時間を設ける
    const minWaitTime = 2500; // 最低2.5秒は見せる（演出）
    const startTime = Date.now();

    img.onload = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minWaitTime - elapsed);
      
      setTimeout(() => {
        setGameState('drawing');
        setTimeLeft(TIME_LIMIT);
        requestAnimationFrame(() => resetCanvas());
      }, remaining);
    };

    img.onerror = () => {
      // 失敗しても進める（エラー表示が出る）
      setTimeout(() => {
        setGameState('drawing');
        setTimeLeft(TIME_LIMIT);
        setImgError(true);
        requestAnimationFrame(() => resetCanvas());
      }, minWaitTime);
    };
  };

  // キャンバスのリセット
  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  };

  // 画面リサイズ時の処理
  useEffect(() => {
    const handleResize = () => {
      if (gameState === 'drawing' && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
        }

        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  // --- 描画ロジック ---
  
  const getCoordinates = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = tool === 'pen' ? 4 : 20;
      ctx.strokeStyle = tool === 'pen' ? '#1a1a1a' : '#ffffff';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawingRef.current = false;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
    }
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `ponchie-${currentTheme.title}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  // --- UIコンポーネント ---

  if (gameState === 'title') {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6 text-stone-800 font-sans">
        <div className="bg-white p-12 rounded-3xl shadow-xl flex flex-col items-center max-w-lg w-full text-center border-4 border-stone-800">
          <div className="w-24 h-24 bg-stone-800 rounded-full flex items-center justify-center mb-6">
            <Pencil className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter">ポンチ絵道場</h1>
          <p className="text-stone-500 mb-8 font-medium">30秒一本勝負。イメージを形にせよ。</p>
          
          <button 
            onClick={startGame}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 shadow-lg border-b-4 border-yellow-600 flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            修行を開始する
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'generating') {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-white">
        <div className="animate-spin mb-6">
          <RotateCcw className="w-12 h-12 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">お題を生成中...</h2>
        <p className="text-stone-400">
          {currentTheme.category === 'action' ? '動きのあるポーズを描きましょう' : '形の特徴を捉えましょう'}
        </p>
        <p className="text-xs text-stone-600 mt-4">Powered by Pollinations.ai</p>
      </div>
    );
  }

  if (gameState === 'drawing') {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center p-4 overflow-hidden touch-none">
        <div className="w-full max-w-5xl flex justify-between items-stretch mb-4 gap-4 h-32 md:h-48">
          {/* お題画像（左） */}
          <div className="relative flex-1 bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-stone-800 group">
            {imgError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-stone-400 p-4 text-center">
                <AlertCircle className="w-8 h-8 mb-2 text-yellow-500" />
                <span className="text-sm font-bold">画像生成に失敗しました</span>
              </div>
            ) : (
              <img 
                src={currentImageUrl} 
                alt={currentTheme.title} 
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                onError={() => setImgError(true)}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4 pointer-events-none">
              <div>
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Theme</span>
                <h2 className="text-white text-xl md:text-2xl font-bold">{currentTheme.title}</h2>
              </div>
            </div>
          </div>

          {/* タイマー（右） */}
          <div className={`w-32 md:w-48 bg-white rounded-2xl flex flex-col items-center justify-center border-4 ${timeLeft <= 10 ? 'border-red-500 text-red-500 animate-pulse' : 'border-stone-800 text-stone-800'} shadow-lg`}>
             <Clock className="w-8 h-8 mb-1" />
             <span className="text-4xl md:text-6xl font-black font-mono">{timeLeft}</span>
             <span className="text-xs font-bold">SECONDS</span>
          </div>
        </div>

        {/* 描画エリア */}
        <div className="flex-1 w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-stone-300 relative cursor-crosshair">
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerOut={stopDrawing}
            className="w-full h-full touch-none"
            style={{ touchAction: 'none' }}
          />
          
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-stone-800 rounded-full p-2 flex gap-4 shadow-2xl border border-stone-600">
            <button
              onClick={() => setTool('pen')}
              className={`p-4 rounded-full transition-all ${tool === 'pen' ? 'bg-white text-black scale-110' : 'text-stone-400 hover:text-white'}`}
            >
              <Pencil className="w-6 h-6" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-4 rounded-full transition-all ${tool === 'eraser' ? 'bg-white text-black scale-110' : 'text-stone-400 hover:text-white'}`}
            >
              <Eraser className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center p-6 overflow-y-auto">
        <div className="max-w-4xl w-full">
          <h2 className="text-3xl font-black text-center mb-8 text-stone-800">TIME UP!</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-4 rounded-3xl shadow-lg border border-stone-200">
              <div className="flex items-center gap-2 mb-3 text-stone-500">
                <ImageIcon className="w-5 h-5" />
                <span className="font-bold">お題: {currentTheme.title}</span>
              </div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-200">
                {imgError ? (
                  <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                ) : (
                  <img src={currentImageUrl} alt="お題" className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-lg border-4 border-yellow-400 relative">
              <div className="absolute -top-3 -right-3 bg-yellow-400 text-black font-bold px-4 py-1 rounded-full shadow-md transform rotate-3">
                YOUR WORK
              </div>
              <div className="flex items-center gap-2 mb-3 text-stone-500">
                <Pencil className="w-5 h-5" />
                <span className="font-bold">あなたのスケッチ</span>
              </div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-stone-100">
                 <img src={canvasRef.current?.toDataURL()} alt="描いた絵" className="w-full h-full object-contain bg-white" />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={downloadDrawing}
              className="flex items-center justify-center gap-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold py-4 px-8 rounded-xl transition-colors"
            >
              <Download className="w-5 h-5" />
              保存する
            </button>
            <button 
              onClick={startGame}
              className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-105"
            >
              <RotateCcw className="w-5 h-5" />
              次の修行へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}