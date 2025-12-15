import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Download, Pencil, Eraser, Clock, Lightbulb } from 'lucide-react';

// --- データ定義: アイデア発想・ポンチ絵用の単語パーツ ---

interface WordPart {
  text: string;
}

// 主語（誰が、何が）- ビジネスや日常、少しシュールなものまで
const SUBJECTS: WordPart[] = [
  { text: '部長' }, { text: '新入社員' }, { text: 'AIロボット' }, { text: '猫' },
  { text: '怪獣' }, { text: 'スーパーマン' }, { text: '泥棒' }, { text: '宇宙人' },
  { text: '脳みそ' }, { text: 'スマートフォン' }, { text: 'ロケット' }, { text: '亀' }
];

// 動作・状態（どうしている）- 動きや状況を描く練習
const ACTIONS: WordPart[] = [
  { text: '謝罪している' }, { text: 'ひらめいた' }, { text: '爆走している' },
  { text: 'プレゼンしている' }, { text: '壁にぶつかっている' }, { text: '空を飛んでいる' },
  { text: '爆発した' }, { text: '握手している' }, { text: '迷子になっている' },
  { text: '積み上げている' }, { text: '溶けている' }, { text: '戦っている' }
];

// 場所・修飾（どこで、どんな）- 状況を複雑にするスパイス
const CONTEXTS: WordPart[] = [
  { text: '崖っぷちで' }, { text: '宇宙空間で' }, { text: '満員電車で' },
  { text: '会議室で' }, { text: '無人島で' }, { text: '夢の中で' },
  { text: '巨大な' }, { text: '透明な' }, { text: '燃えている' },
  { text: '猛スピードの' }, { text: '壊れた' }, { text: '未来の' }
];

// 具体物（モノを描く練習用）
const OBJECTS: WordPart[] = [
  { text: '電球' }, { text: 'ハンバーガー' }, { text: '目覚まし時計' }, { text: '万年筆' },
  { text: '宝箱' }, { text: 'パソコン' }, { text: '書類の山' }, { text: 'コーヒーカップ' },
  { text: 'メガネ' }, { text: 'カバン' }, { text: '自転車' }, { text: '消火器' }
];

interface Theme {
  id: string;
  mainText: string;
  subText: string;
}

const TIME_LIMIT = 30; // 秒

export default function PonchieDojo() {
  const [gameState, setGameState] = useState<'title' | 'generating' | 'drawing' | 'result'>('title');
  const [currentTheme, setCurrentTheme] = useState<Theme>({ id: 'init', mainText: '', subText: '' });
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [history, setHistory] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // --- iPad PWA対応: タッチイベント制御 ---
  useEffect(() => {
    if (gameState !== 'drawing' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // スクロール等のデフォルト動作を防止
    const preventDefault = (e: TouchEvent) => e.preventDefault();

    // passive: false で確実にイベントをキャンセル可能にする
    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });
    canvas.addEventListener('touchend', preventDefault, { passive: false });
    canvas.addEventListener('gesturestart', preventDefault as any);

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', preventDefault);
        canvas.removeEventListener('touchmove', preventDefault);
        canvas.removeEventListener('touchend', preventDefault);
        canvas.removeEventListener('gesturestart', preventDefault as any);
      }
    };
  }, [gameState]);

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

  // ランダム要素取得
  const getRandom = (arr: WordPart[]) => arr[Math.floor(Math.random() * arr.length)];

  // テーマ生成ロジック
  const generateTheme = useCallback((): Theme => {
    const mode = Math.random() > 0.4 ? 'situation' : 'object'; // 6割はシチュエーション
    let mainText = '';
    let subText = '';

    // 重複回避ループ
    for (let i = 0; i < 5; i++) {
      if (mode === 'situation') {
        // 例: 「崖っぷちで」「謝罪している」「部長」
        const ctx = getRandom(CONTEXTS);
        const act = getRandom(ACTIONS);
        const sub = getRandom(SUBJECTS);
        
        mainText = `${sub.text}が${act.text}`;
        subText = `${ctx.text}`;
      } else {
        // 例: 「巨大な」「目覚まし時計」
        const ctx = getRandom(CONTEXTS);
        const obj = getRandom(OBJECTS);
        
        mainText = obj.text;
        subText = `${ctx.text}`;
      }

      const fullText = subText + mainText;
      if (!history.includes(fullText)) {
        // 履歴更新
        setHistory(prev => {
          const newHistory = [fullText, ...prev];
          if (newHistory.length > 20) newHistory.pop();
          return newHistory;
        });
        break;
      }
    }

    return { id: Date.now().toString(), mainText, subText };
  }, [history]);

  // ゲーム開始処理
  const startGame = () => {
    setGameState('generating');
    
    // 少しだけ「選んでいる感」を出す演出
    setTimeout(() => {
      const nextTheme = generateTheme();
      setCurrentTheme(nextTheme);
      setGameState('drawing');
      setTimeLeft(TIME_LIMIT);
      requestAnimationFrame(() => resetCanvas());
    }, 800);
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

  // リサイズ対応
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
        if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

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
      ctx.lineWidth = tool === 'pen' ? 3 : 20; // ペンを少し細くして付箋描画っぽく
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
      link.download = `ponchie-${currentTheme.mainText}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  // --- UIコンポーネント ---

  if (gameState === 'title') {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6 text-stone-800 font-sans select-none">
        <div className="bg-white p-12 rounded-3xl shadow-xl flex flex-col items-center max-w-lg w-full text-center border-4 border-stone-800">
          <div className="w-24 h-24 bg-stone-800 rounded-full flex items-center justify-center mb-6">
            <Pencil className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter">ポンチ絵道場</h1>
          <p className="text-stone-500 mb-8 font-medium">お題はランダム。直感で描く30秒。</p>
          
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
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-white select-none">
        <div className="animate-spin mb-6">
          <RotateCcw className="w-12 h-12 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">お題を選定中...</h2>
      </div>
    );
  }

  if (gameState === 'drawing') {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col p-4 overflow-hidden touch-none select-none">
        {/* ヘッダーエリア：テキストお題と残り時間 */}
        <div className="w-full max-w-5xl mx-auto flex justify-between items-stretch mb-4 gap-4 h-32 md:h-40">
          {/* お題テキスト表示（画像の代わりに大きく） */}
          <div className="flex-1 bg-stone-800 rounded-2xl flex flex-col items-center justify-center p-4 text-center shadow-lg border-2 border-stone-700">
             <div className="text-yellow-400 font-bold text-sm md:text-base mb-1">{currentTheme.subText}</div>
             <div className="text-white font-black text-2xl md:text-4xl leading-tight">{currentTheme.mainText}</div>
          </div>

          {/* タイマー */}
          <div className={`w-32 md:w-40 bg-white rounded-2xl flex flex-col items-center justify-center border-4 ${timeLeft <= 10 ? 'border-red-500 text-red-500 animate-pulse' : 'border-stone-800 text-stone-800'} shadow-lg`}>
             <Clock className="w-8 h-8 mb-1" />
             <span className="text-4xl md:text-5xl font-black font-mono">{timeLeft}</span>
             <span className="text-xs font-bold">SECONDS</span>
          </div>
        </div>

        {/* 描画エリア */}
        <div className="flex-1 w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-stone-300 relative cursor-crosshair">
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerOut={stopDrawing}
            className="w-full h-full touch-none select-none"
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
            {/* お題（テキスト） */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-stone-200 flex flex-col items-center justify-center text-center aspect-[4/3]">
              <div className="flex items-center gap-2 mb-6 text-stone-400">
                <Lightbulb className="w-6 h-6" />
                <span className="font-bold">今回のお題</span>
              </div>
              <div>
                <div className="text-stone-500 text-xl font-bold mb-2">{currentTheme.subText}</div>
                <div className="text-stone-900 text-4xl font-black">{currentTheme.mainText}</div>
              </div>
            </div>

            {/* あなたの絵 */}
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