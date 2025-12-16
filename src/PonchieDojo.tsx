import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Pencil, Eraser, Clock, Lightbulb, Hand, Trash2, X, Palette, Home, Info } from 'lucide-react';

// バージョン情報
const APP_VERSION = 'v1.5.1';

// --- データ定義 ---

interface WordPart {
  text: string;
}

// 主語（誰が、何が）
const SUBJECTS: WordPart[] = [
  { text: '部長' }, { text: '新入社員' }, { text: '社長' }, { text: '医者' }, { text: '看護師' },
  { text: '警察官' }, { text: '消防士' }, { text: '大工' }, { text: 'シェフ' }, { text: 'アイドル' },
  { text: 'ユーチューバー' }, { text: 'プロゲーマー' }, { text: '力士' }, { text: '忍者' }, { text: 'サムライ' },
  { text: '探偵' }, { text: '魔法使い' }, { text: '王様' }, { text: '泥棒' }, { text: '宇宙飛行士' },
  { text: 'サンタクロース' }, { text: 'ピエロ' }, { text: '海賊' }, { text: 'スパイ' },
  { text: '猫' }, { text: '犬' }, { text: 'ハムスター' }, { text: 'パンダ' }, { text: 'ゴリラ' },
  { text: 'ライオン' }, { text: 'キリン' }, { text: 'ペンギン' }, { text: 'カラス' }, { text: 'フクロウ' },
  { text: 'カエル' }, { text: '亀' }, { text: '金魚' }, { text: 'サメ' }, { text: 'タコ' },
  { text: '恐竜' }, { text: 'ドラゴン' }, { text: 'ユニコーン' }, { text: '怪獣' }, { text: '宇宙人' },
  { text: '幽霊' }, { text: 'ゾンビ' }, { text: 'AIロボット' }, { text: 'アンドロイド' },
  { text: '脳みそ' }, { text: 'ガイコツ' }, { text: 'マッチョな人' }, { text: 'おじいさん' }, { text: 'おばあさん' },
  { text: '赤ちゃん' }, { text: '双子' }, { text: '銅像' }, { text: 'マネキン' }, { text: '雪だるま' },
  { text: '埴輪' }, { text: 'ムキムキの猫' }
];

// 動作・状態（どうしている）
const ACTIONS: WordPart[] = [
  { text: '大笑いしている' }, { text: 'ガッツポーズしている' }, { text: '踊っている' }, { text: '歌っている' },
  { text: '走っている' }, { text: '飛んでいる' }, { text: '泳いでいる' }, { text: '登っている' },
  { text: '筋トレしている' }, { text: '戦っている' }, { text: '魔法をかけている' }, { text: '指揮している' },
  { text: '演説している' }, { text: 'プレゼンしている' }, { text: 'ひらめいた' }, { text: '発見した' },
  { text: '泣いている' }, { text: '謝罪している' }, { text: '土下座している' }, { text: '逃げている' },
  { text: '隠れている' }, { text: '怯えている' }, { text: '怒っている' }, { text: '叫んでいる' },
  { text: '迷子になっている' }, { text: '転んでいる' }, { text: '溺れている' }, { text: '寝ている' },
  { text: '気絶している' }, { text: '瞑想している' }, { text: 'サボっている' }, { text: '考えている' },
  { text: '食事している' }, { text: '料理している' }, { text: '掃除している' }, { text: '電話している' },
  { text: 'スマホを見ている' }, { text: '読書している' }, { text: 'ゲームしている' }, { text: '釣りをしている' },
  { text: '運転している' }, { text: '買い物をしている' }, { text: '写真を撮っている' }, { text: '絵を描いている' },
  { text: '爆発した' }, { text: '溶けている' }, { text: '燃えている' }, { text: '凍っている' },
  { text: '分裂している' }, { text: '巨大化している' }, { text: '浮いている' }, { text: '壁にぶつかっている' },
  { text: 'ビームを出している' }, { text: '積み上げている' }, { text: '穴を掘っている' }, { text: '雨宿りしている' }
];

// 場所・修飾（どこで、どんな）
const CONTEXTS: WordPart[] = [
  { text: '無人島で' }, { text: '宇宙空間で' }, { text: '月面で' }, { text: '砂漠で' }, { text: 'ジャングルで' },
  { text: '海底で' }, { text: '雲の上で' }, { text: '洞窟の中で' }, { text: '北極で' }, { text: '火口で' },
  { text: '崖っぷちで' }, { text: '屋上で' }, { text: '満員電車で' }, { text: 'エレベーターで' }, { text: 'トイレで' },
  { text: 'お風呂で' }, { text: 'ベッドの中で' }, { text: '教室で' }, { text: '会議室で' }, { text: 'コンビニで' },
  { text: '遊園地で' }, { text: 'お化け屋敷で' }, { text: '牢屋の中で' }, { text: '夢の中で' }, { text: 'テレビの中で' },
  { text: '巨大な' }, { text: '極小の' }, { text: '透明な' }, { text: '黄金の' }, { text: '虹色の' },
  { text: 'ボロボロの' }, { text: 'ピカピカの' }, { text: '燃えている' }, { text: '凍った' }, { text: '濡れた' },
  { text: '粘土でできた' }, { text: 'メカニカルな' }, { text: '毒々しい' }, { text: 'ふわふわの' }, { text: 'トゲトゲの' },
  { text: '美味しそうな' }, { text: '臭そうな' }, { text: '重すぎる' }, { text: '軽すぎる' }, { text: '高速の' },
  { text: '嵐の中で' }, { text: '暗闇の中で' }, { text: 'スポットライトを浴びて' }, { text: '逆さまの' },
  { text: '大量の' }, { text: 'たった一つの' }, { text: '100年後の' }, { text: '江戸時代の' },
  { text: 'サイバーパンクな' }, { text: 'レトロな' }, { text: 'ドット絵風の' }
];

// 具体物
const OBJECTS: WordPart[] = [
  { text: 'スマートフォン' }, { text: 'パソコン' }, { text: 'マウス' }, { text: '鉛筆' }, { text: '万年筆' },
  { text: '消しゴム' }, { text: 'ハサミ' }, { text: 'ホッチキス' }, { text: 'ノート' }, { text: '手帳' },
  { text: 'カバン' }, { text: '財布' }, { text: '鍵' }, { text: 'メガネ' }, { text: '腕時計' },
  { text: '目覚まし時計' }, { text: '電卓' }, { text: '印鑑' }, { text: 'クリップ' }, { text: 'ティッシュ' },
  { text: '椅子' }, { text: 'ソファ' }, { text: 'ベッド' }, { text: 'テレビ' }, { text: '冷蔵庫' },
  { text: '洗濯機' }, { text: '電子レンジ' }, { text: '扇風機' }, { text: '掃除機' }, { text: '電球' },
  { text: 'トイレットペーパー' }, { text: '歯ブラシ' }, { text: 'ドライヤー' },
  { text: 'ハンバーガー' }, { text: 'おにぎり' }, { text: 'ラーメン' }, { text: '寿司' }, { text: 'ピザ' },
  { text: 'ケーキ' }, { text: 'ドーナツ' }, { text: 'アイスクリーム' }, { text: 'バナナ' }, { text: 'リンゴ' },
  { text: '目玉焼き' }, { text: 'コーヒーカップ' }, { text: 'ビールジョッキ' },
  { text: '自転車' }, { text: '自動車' }, { text: 'パトカー' }, { text: '救急車' }, { text: '消防車' },
  { text: 'トラック' }, { text: 'バス' }, { text: '電車' }, { text: '新幹線' }, { text: '飛行機' },
  { text: 'ヘリコプター' }, { text: 'ロケット' }, { text: 'UFO' }, { text: '潜水艦' }, { text: '船' },
  { text: '宝箱' }, { text: '爆弾' }, { text: 'プレゼント箱' }, { text: 'サッカーボール' }, { text: 'バット' },
  { text: 'トロフィー' }, { text: '王冠' }, { text: 'ダイヤモンド' }, { text: 'うんち' }, { text: '土偶' }
];

interface Theme {
  id: string;
  mainText: string;
  subText: string;
}

const TIME_LIMIT_TRAINING = 30;
const TIME_LIMIT_FREE = 60;

export default function PonchieDojo() {
  const [gameState, setGameState] = useState<'title' | 'generating' | 'drawing' | 'result'>('title');
  const [currentTheme, setCurrentTheme] = useState<Theme>({ id: 'init', mainText: '', subText: '' });
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_TRAINING);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [history, setHistory] = useState<string[]>([]);
  // saveImage関連も削除しました
  
  const [gameMode, setGameMode] = useState<'training' | 'free'>('training');
  const [penMode, setPenMode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // --- iPad PWA対応: タッチイベント制御 ---
  useEffect(() => {
    if (gameState !== 'drawing' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    
    const preventDefault = (e: TouchEvent) => e.preventDefault();

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

  // カウントダウン
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

  const getRandom = (arr: WordPart[]) => arr[Math.floor(Math.random() * arr.length)];

  const generateTheme = useCallback((): Theme => {
    const mode = Math.random() > 0.4 ? 'situation' : 'object'; 
    let mainText = '';
    let subText = '';

    for (let i = 0; i < 10; i++) { 
      if (mode === 'situation') {
        const ctx = getRandom(CONTEXTS);
        const act = getRandom(ACTIONS);
        const sub = getRandom(SUBJECTS);
        mainText = `${sub.text}が${act.text}`;
        subText = `${ctx.text}`;
      } else {
        const ctx = getRandom(CONTEXTS);
        const obj = getRandom(OBJECTS);
        mainText = obj.text;
        subText = `${ctx.text}`;
      }

      const fullText = subText + mainText;
      if (!history.includes(fullText)) {
        setHistory(prev => {
          const newHistory = [fullText, ...prev];
          if (newHistory.length > 30) newHistory.pop();
          return newHistory;
        });
        break;
      }
    }
    return { id: Date.now().toString(), mainText, subText };
  }, [history]);

  const startTraining = () => {
    setGameMode('training');
    setGameState('generating');
    setTimeout(() => {
      const nextTheme = generateTheme();
      setCurrentTheme(nextTheme);
      setGameState('drawing');
      setTimeLeft(TIME_LIMIT_TRAINING);
      requestAnimationFrame(() => resetCanvas());
    }, 800);
  };

  const startFreeMode = () => {
    setGameMode('free');
    setGameState('drawing');
    setCurrentTheme({ id: 'free', mainText: '自由研究', subText: '思うがままに描こう' });
    setTimeLeft(TIME_LIMIT_FREE);
    requestAnimationFrame(() => resetCanvas());
  };

  const returnToTitle = () => {
    setGameState('title');
    setPenMode(false); 
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  };
  
  // 初期化時のサイズ設定用: 親要素の短辺に合わせて正方形を作る
  const initCanvasSize = () => {
    const canvas = canvasRef.current;
    if (canvas && canvas.parentElement) {
      const size = Math.min(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
      canvas.width = size;
      canvas.height = size;
      resetCanvas();
    }
  };

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

        if (canvas.parentElement) {
          // リサイズ時も正方形を維持
          const size = Math.min(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
          canvas.width = size;
          canvas.height = size;
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    if (gameState === 'drawing') {
      setTimeout(initCanvasSize, 50);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  // --- 描画ロジック ---
  const getCoordinates = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault(); 
    if (penMode && e.pointerType !== 'pen') return;
    (e.target as Element).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = tool === 'pen' ? 3 : 20; 
      ctx.strokeStyle = tool === 'pen' ? '#1a1a1a' : '#ffffff';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (penMode && e.pointerType !== 'pen') return;
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
    if (penMode && e.pointerType !== 'pen') return;
    isDrawingRef.current = false;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { ctx.beginPath(); }
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch (err) {}
  };

  // --- UI ---

  if (gameState === 'title') {
    return (
      <div className="fixed inset-0 bg-stone-100 flex flex-col items-center justify-center p-6 text-stone-800 font-sans select-none">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl flex flex-col items-center max-w-lg w-full text-center border-4 border-stone-800">
          <div className="w-24 h-24 bg-stone-800 rounded-full flex items-center justify-center mb-6">
            <Pencil className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter">ポンチ絵道場</h1>
          <p className="text-stone-500 mb-8 font-medium">直感で描く30秒。イメージを形にせよ。</p>
          <div className="w-full flex flex-col gap-4">
            <button onClick={startTraining} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 shadow-lg border-b-4 border-yellow-600 flex items-center justify-center gap-3">
              <Play className="w-6 h-6" /> 修行を開始する <span className="text-xs bg-black/10 px-2 py-1 rounded">30秒</span>
            </button>
            <button onClick={startFreeMode} className="w-full bg-white hover:bg-stone-50 text-stone-800 font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 shadow-md border-2 border-stone-200 flex items-center justify-center gap-3">
              <Palette className="w-6 h-6 text-stone-500" /> 自由研究 <span className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-500">60秒</span>
            </button>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 text-xs text-stone-400 font-mono">{APP_VERSION}</div>
      </div>
    );
  }

  if (gameState === 'generating') {
    return (
      <div className="fixed inset-0 bg-stone-900 flex flex-col items-center justify-center text-white select-none">
        <div className="animate-spin mb-6"><RotateCcw className="w-12 h-12 text-yellow-400" /></div>
        <h2 className="text-2xl font-bold mb-2">お題を選定中...</h2>
      </div>
    );
  }

  if (gameState === 'drawing') {
    return (
      <div className="fixed inset-0 bg-stone-100 flex flex-col touch-none select-none">
        {/* ヘッダーエリア：高さを固定して中身を中央配置 */}
        <div className="shrink-0 w-full max-w-6xl mx-auto flex justify-between items-center p-2 gap-2 h-16 md:h-20 z-10">
          <div className="flex-1 bg-stone-800 rounded-xl flex items-center justify-center p-2 text-center shadow border-2 border-stone-700 relative h-full">
             <button onClick={() => { if (window.confirm('中断してタイトルに戻りますか？')) returnToTitle(); }} className="absolute left-2 text-stone-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors" title="中断して戻る"><X className="w-6 h-6" /></button>
             <div className="flex flex-col items-center leading-none">
               <span className="text-yellow-400 font-bold text-[10px] md:text-xs mb-0.5">{currentTheme.subText}</span>
               <span className="text-white font-black text-lg md:text-2xl">{currentTheme.mainText}</span>
             </div>
          </div>
          <div className="shrink-0 w-20 md:w-24 bg-white rounded-xl flex flex-col items-center justify-center border-4 h-full shadow border-stone-800 text-stone-800">
             <Clock className="w-4 h-4 mb-0.5" />
             <span className={`text-2xl font-black font-mono leading-none ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>{timeLeft}</span>
          </div>
        </div>

        {/* メインエリア：残りの高さを埋める */}
        <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 p-2 min-h-0">
          
          {/* キャンバスコンテナ：正方形を維持しつつ最大化 */}
          <div className="relative flex-1 w-full h-full flex items-center justify-center min-h-0 min-w-0">
             <div className="aspect-square max-h-full max-w-full bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-stone-300 relative cursor-crosshair">
                <canvas ref={canvasRef} onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerOut={stopDrawing} className="w-full h-full touch-none select-none" style={{ touchAction: 'none' }} />
             </div>
          </div>

          {/* ツールバー：レスポンシブ配置（横画面は右、縦画面は下） */}
          <div className="shrink-0 bg-stone-800 p-2 md:p-3 rounded-2xl shadow-xl border border-stone-600 flex flex-row md:flex-col gap-3 items-center justify-center">
            <button onClick={() => setTool('pen')} className={`p-3 md:p-4 rounded-xl transition-all ${tool === 'pen' ? 'bg-white text-black scale-110' : 'text-stone-400 hover:text-white hover:bg-stone-700'}`}><Pencil className="w-6 h-6" /></button>
            <button onClick={() => setTool('eraser')} className={`p-3 md:p-4 rounded-xl transition-all ${tool === 'eraser' ? 'bg-white text-black scale-110' : 'text-stone-400 hover:text-white hover:bg-stone-700'}`}><Eraser className="w-6 h-6" /></button>
            
            <div className="w-px h-6 md:w-6 md:h-px bg-stone-600 mx-1 md:mx-0"></div>
            
            <button onClick={() => setPenMode(!penMode)} className={`p-3 md:p-4 rounded-xl transition-all relative ${penMode ? 'bg-blue-500 text-white scale-110' : 'text-stone-400 hover:text-white hover:bg-stone-700'}`}>
              <Hand className="w-6 h-6" />
              {penMode && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
            </button>
            
            <div className="w-px h-6 md:w-6 md:h-px bg-stone-600 mx-1 md:mx-0"></div>
            
            <button onClick={() => { if (window.confirm('本当に全て消去しますか？')) resetCanvas(); }} className="p-3 md:p-4 rounded-xl transition-all text-stone-400 hover:text-red-400 hover:bg-stone-700"><Trash2 className="w-6 h-6" /></button>
          </div>
        </div>
        
        {/* フッターメッセージ */}
        <div className="shrink-0 text-center pb-2 text-stone-400 text-xs h-6">
          {penMode ? "ペン専用モードON: 指での描画は無効化されています" : ""}
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="fixed inset-0 bg-stone-100 flex flex-col items-center p-4 overflow-hidden select-none">
        <div className="w-full max-w-5xl flex-1 flex flex-col justify-center min-h-0 gap-4">
          
          <h2 className="shrink-0 text-2xl md:text-3xl font-black text-center text-stone-800 mt-2">TIME UP!</h2>
          
          {/* コンテンツエリア：高さを抑えてスクロール不要に */}
          <div className="flex-1 min-h-0 grid grid-rows-2 md:grid-rows-1 md:grid-cols-2 gap-4 md:gap-8 justify-center items-center">
            
            {/* お題カード */}
            <div className="h-full max-h-[40vh] md:max-h-[60vh] aspect-square mx-auto bg-white p-4 rounded-3xl shadow-lg border border-stone-200 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 mb-2 text-stone-400"><Lightbulb className="w-5 h-5" /><span className="font-bold text-sm">今回のお題</span></div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-stone-500 text-lg font-bold mb-1">{currentTheme.subText}</div>
                <div className="text-stone-900 text-3xl md:text-4xl font-black leading-tight">{currentTheme.mainText}</div>
              </div>
            </div>

            {/* 結果画像カード */}
            <div className="h-full max-h-[40vh] md:max-h-[60vh] aspect-square mx-auto bg-white p-3 rounded-3xl shadow-lg border-4 border-yellow-400 relative flex flex-col">
              <div className="absolute -top-3 -right-3 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-md transform rotate-3">YOUR WORK</div>
              
              <div className="flex-1 rounded-2xl overflow-hidden bg-white border border-stone-100 relative min-h-0">
                 {/* 長押し保存用の画像（強制的にタッチ操作有効化） */}
                 <img 
                   src={canvasRef.current?.toDataURL()} 
                   alt="描いた絵" 
                   className="w-full h-full object-contain bg-white"
                   onDragStart={(e) => e.preventDefault()}
                   style={{ WebkitTouchCallout: 'default', userSelect: 'none', touchAction: 'auto', pointerEvents: 'auto' }}
                 />
              </div>
              <div className="shrink-0 mt-2 text-center">
                <div className="inline-flex items-center gap-1.5 text-stone-500 text-xs font-bold bg-stone-100 py-1.5 px-3 rounded-full">
                  <Info className="w-3.5 h-3.5" />
                  画像を長押しして「写真に保存」
                </div>
              </div>
            </div>
          </div>

          {/* フッターアクションボタン */}
          <div className="shrink-0 flex flex-col md:flex-row gap-3 justify-center w-full max-w-lg mx-auto mb-2">
            <button onClick={gameMode === 'free' ? startFreeMode : startTraining} className="flex-1 flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform hover:scale-105 text-sm md:text-base"><RotateCcw className="w-4 h-4" /> もう一度やる</button>
            <button onClick={returnToTitle} className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-500 font-bold py-3 px-4 rounded-xl border-2 border-stone-200 transition-colors text-sm md:text-base"><Home className="w-4 h-4" /> タイトルへ戻る</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}