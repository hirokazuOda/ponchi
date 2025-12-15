import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Download, Pencil, Eraser, Clock, Image as ImageIcon, AlertCircle } from 'lucide-react';

// --- データ定義: 無限生成用の単語パーツ ---

type ThemeCategory = 'object' | 'action';

interface WordPart {
  ja: string;
  en: string;
}

// 行動テーマ用パーツ
const SUBJECTS: WordPart[] = [
  { ja: '少女', en: 'young girl' },
  { ja: '少年', en: 'young boy' },
  { ja: 'おじいさん', en: 'old man' },
  { ja: 'おばあさん', en: 'old woman' },
  { ja: 'サラリーマン', en: 'businessman in suit' },
  { ja: '猫', en: 'cat' },
  { ja: '犬', en: 'dog' },
  { ja: 'ロボット', en: 'cute robot' },
  { ja: '宇宙飛行士', en: 'astronaut' },
  { ja: '魔法使い', en: 'wizard' },
];

const ACTIONS: WordPart[] = [
  { ja: '本を読んでいる', en: 'reading a book' },
  { ja: '走っている', en: 'running fast, dynamic pose' },
  { ja: '食事をしている', en: 'eating delicious food' },
  { ja: '寝ている', en: 'sleeping peacefully' },
  { ja: 'ダンスをしている', en: 'dancing joyfully' },
  { ja: '写真を撮っている', en: 'taking a photo with camera' },
  { ja: '釣りをしている', en: 'fishing' },
  { ja: '楽器を弾いている', en: 'playing musical instrument' },
  { ja: '雨宿りをしている', en: 'taking shelter from rain' },
  { ja: 'コーヒーを飲んでいる', en: 'drinking coffee' },
  { ja: '叫んでいる', en: 'shouting, screaming' },
  { ja: 'ジャンプしている', en: 'jumping high' },
];

const LOCATIONS_ACTION: WordPart[] = [
  { ja: '公園で', en: 'in a park, sunny day' },
  { ja: 'カフェで', en: 'in a cozy cafe' },
  { ja: '宇宙で', en: 'in outer space, stars background' },
  { ja: '森の中で', en: 'in a deep forest' },
  { ja: '海辺で', en: 'at the beach' },
  { ja: '雪山で', en: 'on a snowy mountain' },
  { ja: '古い図書館で', en: 'in an old library' },
  { ja: '屋上で', en: 'on a building rooftop' },
  { ja: '電車の中で', en: 'inside a train' },
  { ja: '', en: 'simple background' }, // 場所指定なし
];

// 物テーマ用パーツ
const ADJECTIVES: WordPart[] = [
  { ja: '古い', en: 'antique, vintage, weathered' },
  { ja: '未来的な', en: 'futuristic, cyberpunk, neon' },
  { ja: '巨大な', en: 'giant, massive' },
  { ja: 'ガラス製の', en: 'made of glass, transparent' },
  { ja: '黄金の', en: 'golden, shiny' },
  { ja: 'ボロボロの', en: 'broken, ruined' },
  { ja: 'カラフルな', en: 'colorful, rainbow colored' },
  { ja: '燃えている', en: 'burning, on fire' },
  { ja: '凍った', en: 'frozen, icy' },
  { ja: '浮いている', en: 'floating in air' },
];

const OBJECTS: WordPart[] = [
  { ja: '時計', en: 'clock' },
  { ja: 'カメラ', en: 'camera' },
  { ja: '椅子', en: 'chair' },
  { ja: '靴', en: 'sneakers' },
  { ja: 'ハンバーガー', en: 'hamburger' },
  { ja: '自転車', en: 'bicycle' },
  { ja: 'ランプ', en: 'lamp' },
  { ja: '宝箱', en: 'treasure chest' },
  { ja: '剣', en: 'sword' },
  { ja: '花瓶', en: 'flower vase' },
  { ja: 'ラジカセ', en: 'boombox' },
  { ja: '車', en: 'car' },
];

const LOCATIONS_OBJECT: WordPart[] = [
  { ja: '机の上に', en: 'on a wooden desk' },
  { ja: '草むらに', en: 'on grass field' },
  { ja: '砂漠に', en: 'in desert' },
  { ja: '水中に', en: 'underwater' },
  { ja: '空中に', en: 'in the sky' },
  { ja: '美術館に', en: 'in a museum' },
  { ja: '洞窟に', en: 'in a dark cave' },
  { ja: '', en: 'studio lighting, plain background' }, // 場所指定なし
];

interface Theme {
  id: string;
  title: string;
  prompt: string;
  category: ThemeCategory;
}

const TIME_LIMIT = 30; // 秒

export default function PonchieDojo() {
  const [gameState, setGameState] = useState<'title' | 'generating' | 'drawing' | 'result'>('title');
  const [currentTheme, setCurrentTheme] = useState<Theme>({ id: 'init', title: '', prompt: '', category: 'object' });
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [imgError, setImgError] = useState(false);

  const [turnCount, setTurnCount] = useState(0);
  
  // 履歴管理（直近10件のタイトルを保存して重複を避ける簡易的な仕組み）
  const [history, setHistory] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // カウントダウンタイマー
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameState === 'drawing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'drawing') {
      setGameState('result');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // ランダムな要素を取得するヘルパー関数
  const getRandom = (arr: WordPart[]) => arr[Math.floor(Math.random() * arr.length)];

  // テーマ生成ロジック
  const generateTheme = useCallback((): Theme => {
    const isActionTurn = (turnCount + 1) % 2 === 0; // 偶数回目はAction
    let title = '';
    let prompt = '';
    let category: ThemeCategory = 'object';

    // 重複を避けるためのループ（最大5回試行）
    for (let i = 0; i < 5; i++) {
      if (isActionTurn) {
        // Action: 場所 + 主語 + 動作
        // 日本語: 「公園で」「本を読んでいる」「少女」
        // 英語: young girl, reading a book, in a park...
        const loc = getRandom(LOCATIONS_ACTION);
        const sub = getRandom(SUBJECTS);
        const act = getRandom(ACTIONS);
        
        // 日本語タイトルの組み立て（場所があれば先頭に）
        title = `${loc.ja}${act.ja}${sub.ja}`;
        prompt = `${sub.en}, ${act.en}, ${loc.en}, photorealistic, detailed`;
        category = 'action';
      } else {
        // Object: 場所 + 形容詞 + 物
        // 日本語: 「机の上に」「古い」「時計」
        // 英語: antique, clock, on a wooden desk...
        const loc = getRandom(LOCATIONS_OBJECT);
        const adj = getRandom(ADJECTIVES);
        const obj = getRandom(OBJECTS);

        // 日本語タイトルの組み立て
        title = `${loc.ja}${adj.ja}${obj.ja}`;
        prompt = `${adj.en} ${obj.en}, ${loc.en}, photorealistic, 8k resolution, still life`;
        category = 'object';
      }

      // 履歴になければ採用
      if (!history.includes(title)) {
        break;
      }
    }

    // 履歴更新
    setHistory(prev => {
      const newHistory = [title, ...prev];
      if (newHistory.length > 20) newHistory.pop(); // 最大20件保持
      return newHistory;
    });

    return {
      id: Date.now().toString(), // ユニークID
      title,
      prompt,
      category
    };

  }, [turnCount, history]);

  // ゲーム開始処理
  const startGame = () => {
    setGameState('generating');
    setImgError(false);

    // 次のテーマを生成
    setTurnCount(prev => prev + 1);
    const nextTheme = generateTheme();
    setCurrentTheme(nextTheme);

    // AI画像生成URLを作成 (Pollinations.aiを使用)
    const seed = Math.floor(Math.random() * 100000);
    const generatedUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(nextTheme.prompt)}?width=800&height=600&nologo=true&seed=${seed}&model=flux`;
    setCurrentImageUrl(generatedUrl);
    
    // 画像のプリロード
    const img = new Image();
    img.src = generatedUrl;
    
    const minWaitTime = 2500;
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
          <p className="text-stone-500 mb-8 font-medium">30秒一本勝負。無限のテーマに挑め。</p>
          
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
          {currentTheme.title || 'テーマを選定中...'}
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