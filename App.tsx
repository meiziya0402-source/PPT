import React, { useState, useRef } from 'react';
import SlideCanvas from './components/SlideCanvas';
import { SlideData, SlideType } from './types';
import { generateDeckContent } from './services/geminiService';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Wand2,
  Layers,
  Download,
  ChevronRight
} from 'lucide-react';
import JSZip from 'jszip';
import { toPng } from 'html-to-image';

// Initial Template Data
const INITIAL_DECK: SlideData[] = [
  {
    id: '1', type: SlideType.Cover, title: "阿拉斯加座头鲸", subtitle: "见证自然奇迹", footer: "2024 年度回顾",
    backgroundImage: null, themeColor: "#60A5FA"
  },
  {
    id: '2', type: SlideType.Agenda, title: "目录", subtitle: "汇报概览", bulletPoints: ["年度摘要", "关键数据", "项目亮点", "未来展望"], footer: "Agenda",
    backgroundImage: null, themeColor: "#60A5FA"
  },
  {
    id: '3', type: SlideType.Metric, title: "核心数据", subtitle: "同比增长率", bigValue: "+125%", footer: "Key Metrics",
    backgroundImage: null, themeColor: "#60A5FA"
  }
];

export default function App() {
  const [slides, setSlides] = useState<SlideData[]>(INITIAL_DECK);
  const [currentSlideId, setCurrentSlideId] = useState<string>(INITIAL_DECK[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [bgImage, setBgImage] = useState<string | null>("https://images.unsplash.com/photo-1502479532585-1d078b66e07a?q=80&w=2940&auto=format&fit=crop");
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentSlide = slides.find(s => s.id === currentSlideId) || slides[0];

  // Sync background image to all slides
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setBgImage(base64);
        setSlides(prev => prev.map(s => ({ ...s, backgroundImage: base64 })));
      };
      reader.readAsDataURL(file);
    }
  };

  // Update effect when bgImage changes (initial load)
  React.useEffect(() => {
    if (bgImage) {
        setSlides(prev => prev.map(s => ({ ...s, backgroundImage: bgImage })));
    }
  }, [bgImage]);

  const handleUpdateSlide = (id: string, updates: Partial<SlideData>) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleGenerateDeck = async () => {
    if (!bgImage) return;
    
    setIsGenerating(true);
    try {
      const result = await generateDeckContent(bgImage, userPrompt);
      
      // Map result slides to our state
      const newSlides: SlideData[] = result.slides.map((s, index) => ({
        id: `slide-${index}`,
        type: s.type,
        title: s.title,
        subtitle: s.subtitle,
        footer: `2024 Year End - Page ${index + 1}`,
        themeColor: result.themeColor,
        backgroundImage: bgImage,
        bodyText: s.bodyText,
        bulletPoints: s.bulletPoints,
        bigValue: s.bigValue,
        gridItems: s.gridItems
      }));

      setSlides(newSlides);
      setCurrentSlideId(newSlides[0].id);

    } catch (error) {
      console.error("Deck generation failed", error);
      alert("生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllSlides = async () => {
    if (!slides.length) return;
    const zip = new JSZip();
    const folder = zip.folder("presentation_images");
    
    const originalId = currentSlideId;
    setIsGenerating(true); // Reuse loader to mask the flickering

    try {
        for (let i = 0; i < slides.length; i++) {
            const s = slides[i];
            setCurrentSlideId(s.id);
            // Allow React render cycle to update DOM
            await new Promise(resolve => setTimeout(resolve, 300)); 
            
            if (canvasRef.current) {
                const dataUrl = await toPng(canvasRef.current, { cacheBust: true, pixelRatio: 2 });
                const base64Data = dataUrl.split(',')[1];
                folder?.file(`slide-${i+1}-${s.type}.png`, base64Data, { base64: true });
            }
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        
        // Native download
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "presentation-slides.zip";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (e) {
        console.error(e);
        alert("导出出错");
    } finally {
        setCurrentSlideId(originalId);
        setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-white/20">
      
      {/* Sidebar: Slides Thumbnails */}
      <div className="w-64 border-r border-white/10 flex flex-col bg-neutral-900/50 backdrop-blur-xl z-20">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-white mb-1">
             <div className="w-5 h-5 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-md"></div>
             <h1 className="font-serif font-bold text-lg tracking-tight">打个响指</h1>
          </div>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">AI 演示文稿生成</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {slides.map((slide, index) => (
                <button
                    key={slide.id}
                    onClick={() => setCurrentSlideId(slide.id)}
                    className={`w-full text-left p-2 rounded-lg border transition-all group relative overflow-hidden ${currentSlideId === slide.id ? 'bg-white/10 border-blue-500/50' : 'border-neutral-800 hover:bg-white/5'}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-neutral-500 w-4">{index + 1}</span>
                        <span className="text-xs font-semibold text-neutral-300 truncate">{slide.title}</span>
                    </div>
                    <div className="w-full h-12 bg-neutral-800 rounded overflow-hidden opacity-50 relative">
                        {/* Mini thumbnail preview via bg image */}
                        {slide.backgroundImage && <img src={slide.backgroundImage} className="w-full h-full object-cover grayscale opacity-50" />}
                        <div className="absolute inset-0 flex items-center justify-center">
                             <div className="text-[8px] uppercase tracking-tighter text-white/70">{slide.type}</div>
                        </div>
                    </div>
                </button>
            ))}
        </div>
      </div>

      {/* Sidebar: Controls */}
      <div className="w-72 border-r border-white/10 flex flex-col bg-neutral-900 z-20">
        
        {/* Image Upload */}
        <div className="p-5 border-b border-white/10">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ImageIcon size={14} /> 全局背景
            </h2>
            <label className="group flex flex-col items-center justify-center w-full h-28 border border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all relative overflow-hidden">
                {bgImage ? (
                    <img src={bgImage} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-opacity" />
                ) : null}
                <div className="flex flex-col items-center justify-center z-10">
                    <Upload className="w-6 h-6 mb-2 text-neutral-500 group-hover:text-white transition-colors" />
                    <p className="text-xs text-neutral-400">点击更换图片</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
        </div>

        {/* AI Generator */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-b from-blue-500/5 to-transparent flex-1">
             <h2 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={14} /> 一键生成全套
            </h2>
            <textarea 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-24 mb-3"
                placeholder="例如：一家AI科技公司的年终汇报，强调增长和创新..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
            />
            <button 
                onClick={handleGenerateDeck}
                disabled={!bgImage || isGenerating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
                {isGenerating ? <Wand2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                {isGenerating ? "正在规划 10 页 PPT..." : "生成 10 页 PPT 模版"}
            </button>
            <p className="mt-4 text-[10px] text-neutral-500 leading-relaxed">
                AI 将基于您的图片和描述，自动生成包括封面、目录、数据分析、团队介绍等在内的 10 页完整汇报结构。
            </p>
        </div>

        {/* Download Actions */}
        <div className="p-5 border-t border-white/10 bg-neutral-900">
             <button 
                onClick={downloadAllSlides}
                className="w-full py-3 border border-white/20 hover:bg-white/5 text-white text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2"
             >
                <Download size={16} />
                下载所有 PPT (Images)
             </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <main className="flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-neutral-950 flex flex-col relative items-center justify-center overflow-hidden">
          
          {/* Top Pagination */}
          <div className="absolute top-6 flex items-center gap-4 z-10 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
             <button 
               onClick={() => {
                   const idx = slides.findIndex(s => s.id === currentSlideId);
                   if (idx > 0) setCurrentSlideId(slides[idx - 1].id);
               }}
               disabled={slides.findIndex(s => s.id === currentSlideId) === 0}
               className="text-white/50 hover:text-white disabled:opacity-20"
             >
                 Prev
             </button>
             <span className="text-xs font-mono text-white/80">
                 {slides.findIndex(s => s.id === currentSlideId) + 1} / {slides.length}
             </span>
             <button 
               onClick={() => {
                   const idx = slides.findIndex(s => s.id === currentSlideId);
                   if (idx < slides.length - 1) setCurrentSlideId(slides[idx + 1].id);
               }}
               disabled={slides.findIndex(s => s.id === currentSlideId) === slides.length - 1}
               className="text-white/50 hover:text-white disabled:opacity-20"
             >
                 Next
             </button>
          </div>

          <div className="w-full max-w-6xl px-8 flex justify-center">
            <SlideCanvas 
                ref={canvasRef}
                data={currentSlide} 
                onUpdate={handleUpdateSlide}
                isGenerating={isGenerating}
                scale={0.9}
            />
          </div>
          
          <div className="absolute bottom-6 text-center text-neutral-600 text-xs pointer-events-none animate-pulse">
            点击文字可直接编辑 · 拖拽图片可更换背景
          </div>
      </main>
    </div>
  );
}