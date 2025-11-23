import React, { useRef, forwardRef } from 'react';
import { SlideData, SlideType } from '../types';
import { Download } from 'lucide-react';

interface SlideCanvasProps {
  data: SlideData;
  onUpdate: (id: string, updates: Partial<SlideData>) => void;
  isGenerating: boolean;
  scale?: number;
}

const SlideCanvas = forwardRef<HTMLDivElement, SlideCanvasProps>(({ data, onUpdate, isGenerating, scale = 1 }, ref) => {
  
  const handleTextChange = (field: keyof SlideData, value: string) => {
    onUpdate(data.id, { [field]: value });
  };

  const handleArrayChange = (field: 'bulletPoints' | 'gridItems', index: number, subField: string | null, value: string) => {
    if (field === 'bulletPoints' && data.bulletPoints) {
      const newBullets = [...data.bulletPoints];
      newBullets[index] = value;
      onUpdate(data.id, { bulletPoints: newBullets });
    } else if (field === 'gridItems' && data.gridItems && subField) {
      const newItems = [...data.gridItems];
      // @ts-ignore
      newItems[index] = { ...newItems[index], [subField]: value };
      onUpdate(data.id, { gridItems: newItems });
    }
  };

  // Helper: Editable Text Component
  const EditableText = ({ 
    value, 
    field, 
    className, 
    placeholder,
    multiline = false
  }: { 
    value?: string, 
    field: keyof SlideData, 
    className: string,
    placeholder: string,
    multiline?: boolean
  }) => (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => handleTextChange(field, e.currentTarget.textContent || '')}
      className={`outline-none border-b border-transparent hover:border-white/30 transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-white/50 cursor-text ${className}`}
      data-placeholder={placeholder}
      style={{ whiteSpace: multiline ? 'pre-wrap' : 'normal' }}
    >
      {value}
    </div>
  );

  // --- Layout Engines ---

  // 1. Cover / Thank You / Minimal
  const renderCentered = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-black/40 backdrop-blur-[2px]">
      <div className="max-w-4xl space-y-8 animate-fade-in-up">
        <div className="w-24 h-1 mx-auto mb-8 shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ backgroundColor: data.themeColor }}></div>
        <h1 className="text-6xl md:text-7xl font-serif font-bold tracking-tight text-white drop-shadow-2xl leading-tight">
          <EditableText value={data.title} field="title" className="" placeholder="标题" />
        </h1>
        <div className="text-xl md:text-2xl font-light tracking-widest text-white/90 font-sans uppercase">
          <EditableText value={data.subtitle} field="subtitle" className="" placeholder="副标题" />
        </div>
      </div>
      <div className="absolute bottom-12 text-white/60 text-sm tracking-[0.2em] font-sans">
        <EditableText value={data.footer} field="footer" className="" placeholder="页脚" />
      </div>
    </div>
  );

  // 2. List / Agenda (Title Left, List Right)
  const renderList = () => (
    <div className="absolute inset-0 flex p-16 bg-gradient-to-r from-black/80 to-transparent">
      <div className="w-1/3 flex flex-col justify-center border-r border-white/20 pr-12">
        <h2 className="text-5xl font-serif font-bold text-white mb-4 leading-tight">
           <EditableText value={data.title} field="title" className="" placeholder="目录" />
        </h2>
        <p className="text-white/60 text-lg tracking-wide">
           <EditableText value={data.subtitle} field="subtitle" className="" placeholder="描述" />
        </p>
      </div>
      <div className="w-2/3 flex flex-col justify-center pl-16">
        <ul className="space-y-6">
          {data.bulletPoints?.map((item, idx) => (
            <li key={idx} className="flex items-center gap-6 group">
              <span className="text-2xl font-bold font-serif opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: data.themeColor }}>
                0{idx + 1}
              </span>
              <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleArrayChange('bulletPoints', idx, null, e.currentTarget.textContent || '')}
                className="text-2xl md:text-3xl font-light text-white border-b border-transparent hover:border-white/20 cursor-text"
              >
                {item}
              </div>
            </li>
          )) || <li className="text-white/50">暂无列表项</li>}
        </ul>
      </div>
    </div>
  );

  // 3. Split (Text / Image)
  const renderSplit = (imagePosition: 'left' | 'right') => (
    <div className={`absolute inset-0 flex ${imagePosition === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-5/12 bg-neutral-900/95 backdrop-blur-xl h-full flex flex-col justify-center p-14 text-white relative z-10 shadow-2xl">
        <div className="mb-8 text-xs tracking-[0.3em] text-white/40 uppercase">
             <EditableText value={data.footer} field="footer" className="" placeholder="SECTION" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">
             <EditableText value={data.title} field="title" className="text-white" placeholder="标题" />
        </h1>
        <div className="h-[2px] w-12 bg-white/20 mb-8" style={{ backgroundColor: data.themeColor }}></div>
        <p className="text-lg text-neutral-300 font-sans font-light leading-relaxed whitespace-pre-wrap">
             <EditableText value={data.bodyText || data.subtitle} field="bodyText" className="" placeholder="在此输入段落内容..." multiline />
        </p>
      </div>
      <div className="w-7/12 h-full relative">
        <div className={`absolute inset-0 ${imagePosition === 'left' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-neutral-900/90 via-transparent to-transparent`}></div>
      </div>
    </div>
  );

  // 4. Metric (Big Number Center)
  const renderMetric = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-12">
        <h3 className="text-xl md:text-2xl tracking-[0.2em] text-white/80 uppercase mb-8 font-sans">
             <EditableText value={data.title} field="title" className="" placeholder="METRIC" />
        </h3>
        <div className="relative">
             <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('bigValue', e.currentTarget.textContent || '')}
                className="text-[10rem] md:text-[12rem] font-serif font-bold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-2xl cursor-text"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}
             >
                {data.bigValue || "00"}
             </div>
        </div>
        <div className="mt-8 text-2xl md:text-3xl font-light text-white/90 max-w-2xl text-center">
             <EditableText value={data.subtitle} field="subtitle" className="" placeholder="数据描述" />
        </div>
    </div>
  );

  // 5. Grid (3 Columns)
  const renderGrid = () => (
    <div className="absolute inset-0 flex flex-col pt-16 px-16 pb-12 bg-gradient-to-b from-black/70 to-black/40">
        <div className="mb-12 border-l-4 pl-6" style={{ borderColor: data.themeColor }}>
            <h2 className="text-4xl font-serif text-white mb-2">
                <EditableText value={data.title} field="title" className="" placeholder="标题" />
            </h2>
            <p className="text-white/60 text-lg">
                <EditableText value={data.subtitle} field="subtitle" className="" placeholder="副标题" />
            </p>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-8 items-start">
            {data.gridItems?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 p-8 h-full rounded-sm hover:bg-white/15 transition-colors">
                    <div className="text-3xl font-serif mb-4" style={{ color: data.themeColor }}>0{idx + 1}.</div>
                    <div 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleArrayChange('gridItems', idx, 'title', e.currentTarget.textContent || '')}
                        className="text-xl font-bold text-white mb-3 cursor-text block"
                    >
                        {item.title}
                    </div>
                    <div 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleArrayChange('gridItems', idx, 'desc', e.currentTarget.textContent || '')}
                        className="text-sm text-neutral-300 leading-relaxed cursor-text block"
                    >
                        {item.desc}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const getRenderer = () => {
    switch (data.type) {
      case SlideType.Cover:
      case SlideType.ThankYou:
        return renderCentered();
      case SlideType.Agenda:
      case SlideType.List:
        return renderList();
      case SlideType.SplitRight:
      case SlideType.Overview:
        return renderSplit('right');
      case SlideType.SplitLeft:
        return renderSplit('left');
      case SlideType.Metric:
        return renderMetric();
      case SlideType.Grid3:
      case SlideType.Team:
        return renderGrid();
      default:
        return renderCentered();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div 
        ref={ref}
        className="relative w-full aspect-video bg-neutral-800 overflow-hidden shadow-2xl group select-none transition-transform duration-200"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          backgroundImage: data.backgroundImage ? `url(${data.backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Placeholder if no image */}
        {!data.backgroundImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 text-neutral-600">
            <span className="font-sans text-lg tracking-widest uppercase">等待背景图片...</span>
          </div>
        )}

        {/* Loading Overlay */}
        {isGenerating && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                <span className="tracking-widest text-sm uppercase animate-pulse">AI 正在撰写文案...</span>
            </div>
        )}

        {/* Content Render */}
        {data.backgroundImage && getRenderer()}
      </div>
    </div>
  );
});

SlideCanvas.displayName = 'SlideCanvas';
export default SlideCanvas;